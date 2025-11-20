import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { logger } from '../utils/logger';
import { SnapshotStorage } from '../utils/storage';
import { DiffDetector } from '../utils/diff';
import { config } from '../config';
import fs from 'fs';

/**
 * Professional Web Dashboard Server
 */
export class DashboardServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private storage: SnapshotStorage;
  private diffDetector: DiffDetector;
  private port: number;
  private username: string;
  private password: string;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server);
    this.storage = new SnapshotStorage();
    this.diffDetector = new DiffDetector();

    // Configuration
    this.port = parseInt(process.env.DASHBOARD_PORT || '3000', 10);
    this.username = process.env.DASHBOARD_USERNAME || 'admin';
    this.password = process.env.DASHBOARD_PASSWORD || 'changeme';

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware() {
    // Parse JSON bodies
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, 'public')));

    // Set view engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));

    // Simple session middleware (in-memory)
    const sessions = new Map<string, { username: string; expires: number }>();

    this.app.use((req, res, next) => {
      const sessionId = req.headers['x-session-id'] as string;

      if (sessionId && sessions.has(sessionId)) {
        const session = sessions.get(sessionId)!;
        if (session.expires > Date.now()) {
          (req as any).session = session;
          return next();
        } else {
          sessions.delete(sessionId);
        }
      }

      (req as any).session = null;
      next();
    });

    // Authentication middleware for protected routes
    this.app.use((req, res, next) => {
      // Public routes
      if (req.path === '/login' || req.path.startsWith('/static')) {
        return next();
      }

      // Check if authenticated
      if ((req as any).session) {
        return next();
      }

      // Redirect to login
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.redirect('/login');
    });
  }

  /**
   * Setup routes
   */
  private setupRoutes() {
    // Login page
    this.app.get('/login', (req, res) => {
      res.render('login', { error: null });
    });

    // Login handler
    this.app.post('/login', (req, res) => {
      const { username, password } = req.body;

      if (username === this.username && password === this.password) {
        // Create session
        const sessionId = this.generateSessionId();
        const session = {
          username,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };

        // Store session (in production, use Redis or similar)
        (global as any).dashboardSessions = (global as any).dashboardSessions || new Map();
        (global as any).dashboardSessions.set(sessionId, session);

        res.json({ success: true, sessionId });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // Dashboard home
    this.app.get('/', (req, res) => {
      res.render('dashboard', {
        username: (req as any).session.username,
        config: this.getSafeConfig(),
      });
    });

    // API: Get snapshots
    this.app.get('/api/snapshots', (req, res) => {
      try {
        const targetUsername = (req.query.username as string) || config.instagram.targetUsername;
        const snapshots = this.storage.getAllSnapshots(targetUsername);

        res.json({
          success: true,
          snapshots: snapshots.map((s) => ({
            date: s.date,
            targetUsername: s.targetUsername,
            followingCount: s.followingCount,
            userCount: s.users.length,
          })),
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get latest snapshot
    this.app.get('/api/snapshots/latest', (req, res) => {
      try {
        const targetUsername = (req.query.username as string) || config.instagram.targetUsername;
        const snapshot = this.storage.getLatestSnapshot(targetUsername);

        if (!snapshot) {
          return res.status(404).json({ success: false, error: 'No snapshots found' });
        }

        res.json({ success: true, snapshot });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get statistics
    this.app.get('/api/stats', (req, res) => {
      try {
        const targetUsername = (req.query.username as string) || config.instagram.targetUsername;
        const snapshots = this.storage.getAllSnapshots(targetUsername);

        if (snapshots.length === 0) {
          return res.json({
            success: true,
            stats: {
              totalSnapshots: 0,
              firstSnapshot: null,
              latestSnapshot: null,
              currentFollowing: 0,
              netChange: 0,
            },
          });
        }

        const first = snapshots[0];
        const latest = snapshots[snapshots.length - 1];
        const netChange = latest.followingCount - first.followingCount;

        res.json({
          success: true,
          stats: {
            totalSnapshots: snapshots.length,
            firstSnapshot: first.date,
            latestSnapshot: latest.date,
            currentFollowing: latest.followingCount,
            initialFollowing: first.followingCount,
            netChange,
          },
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get activity (changes over time)
    this.app.get('/api/activity', (req, res) => {
      try {
        const targetUsername = (req.query.username as string) || config.instagram.targetUsername;
        const snapshots = this.storage.getAllSnapshots(targetUsername);

        const activity = [];

        for (let i = 1; i < snapshots.length; i++) {
          const prev = snapshots[i - 1];
          const curr = snapshots[i];
          const diff = this.diffDetector.calculateDiff(prev, curr);

          if (this.diffDetector.hasChanges(diff)) {
            activity.push({
              date: curr.date,
              newFollows: diff.newFollows.length,
              unfollows: diff.unfollows.length,
              netChange: diff.currentCount - diff.previousCount,
            });
          }
        }

        res.json({ success: true, activity });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // API: Get logs
    this.app.get('/api/logs', (req, res) => {
      try {
        const logDir = process.env.LOG_DIR || './logs';
        const logFile = path.join(logDir, 'combined.log');

        if (!fs.existsSync(logFile)) {
          return res.json({ success: true, logs: [] });
        }

        const logs = fs.readFileSync(logFile, 'utf-8').split('\n').filter(Boolean);
        const recentLogs = logs.slice(-100).reverse(); // Last 100 logs

        res.json({ success: true, logs: recentLogs });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Logout
    this.app.post('/logout', (req, res) => {
      const sessionId = req.headers['x-session-id'] as string;
      if (sessionId && (global as any).dashboardSessions) {
        (global as any).dashboardSessions.delete(sessionId);
      }
      res.json({ success: true });
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info('Dashboard client connected');

      socket.on('disconnect', () => {
        logger.info('Dashboard client disconnected');
      });

      socket.on('subscribe', (targetUsername: string) => {
        socket.join(`target:${targetUsername}`);
        logger.info(`Client subscribed to ${targetUsername}`);
      });
    });
  }

  /**
   * Emit real-time update to connected clients
   */
  public emitUpdate(targetUsername: string, event: any) {
    this.io.to(`target:${targetUsername}`).emit('update', event);
  }

  /**
   * Get safe config (without sensitive data)
   */
  private getSafeConfig() {
    return {
      targetUsername: config.instagram.targetUsername,
      cronSchedule: process.env.CRON_SCHEDULE,
      notifications: {
        twitter: process.env.ENABLE_TWITTER_NOTIFICATIONS === 'true',
        discord: process.env.ENABLE_DISCORD_NOTIFICATIONS === 'true',
        email: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        slack: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
        telegram: process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true',
      },
      export: {
        csv: process.env.ENABLE_CSV_EXPORT === 'true',
        excel: process.env.ENABLE_EXCEL_EXPORT === 'true',
      },
      multiAccount: process.env.ENABLE_MULTI_ACCOUNT === 'true',
    };
  }

  /**
   * Generate random session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Start the dashboard server
   */
  public start() {
    this.server.listen(this.port, () => {
      logger.info(`\n${'='.repeat(60)}`);
      logger.info('🚀 Dashboard Server Started');
      logger.info('='.repeat(60));
      logger.info(`URL: http://localhost:${this.port}`);
      logger.info(`Username: ${this.username}`);
      logger.info(`Password: ${this.password}`);
      logger.info('='.repeat(60));
    });
  }

  /**
   * Stop the dashboard server
   */
  public stop() {
    this.server.close();
    logger.info('Dashboard server stopped');
  }
}

// Run server if this file is executed directly
if (require.main === module) {
  if (process.env.ENABLE_DASHBOARD !== 'true') {
    logger.error('Dashboard is not enabled. Set ENABLE_DASHBOARD=true in .env');
    process.exit(1);
  }

  const server = new DashboardServer();
  server.start();
}
