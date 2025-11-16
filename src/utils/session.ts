import fs from 'fs';
import path from 'path';
import { BrowserContext } from 'playwright';
import { logger } from './logger';
import { config } from '../config';

const SESSION_DIR = path.join(config.paths.dataDir, 'sessions');
const SESSION_FILE = path.join(SESSION_DIR, 'instagram_session.json');

export class SessionManager {
  constructor() {
    this.ensureSessionDir();
  }

  private ensureSessionDir(): void {
    if (!fs.existsSync(SESSION_DIR)) {
      fs.mkdirSync(SESSION_DIR, { recursive: true });
      logger.info(`Created session directory: ${SESSION_DIR}`);
    }
  }

  async saveSession(context: BrowserContext): Promise<void> {
    try {
      const cookies = await context.cookies();
      const sessionData = {
        cookies,
        timestamp: Date.now(),
        username: config.instagram.username,
      };

      fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2));
      logger.info('Instagram session saved successfully');
    } catch (error) {
      logger.error('Error saving session:', error);
    }
  }

  async loadSession(context: BrowserContext): Promise<boolean> {
    try {
      if (!fs.existsSync(SESSION_FILE)) {
        logger.info('No saved session found');
        return false;
      }

      const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));

      // Check if session is for the same user
      if (sessionData.username !== config.instagram.username) {
        logger.warn('Saved session is for different user, ignoring');
        return false;
      }

      // Check if session is not too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      if (Date.now() - sessionData.timestamp > maxAge) {
        logger.warn('Saved session is too old, ignoring');
        return false;
      }

      await context.addCookies(sessionData.cookies);
      logger.info('Instagram session loaded successfully');
      return true;
    } catch (error) {
      logger.error('Error loading session:', error);
      return false;
    }
  }

  clearSession(): void {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        fs.unlinkSync(SESSION_FILE);
        logger.info('Session cleared');
      }
    } catch (error) {
      logger.error('Error clearing session:', error);
    }
  }

  hasSession(): boolean {
    return fs.existsSync(SESSION_FILE);
  }
}
