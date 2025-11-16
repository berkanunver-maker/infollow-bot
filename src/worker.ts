import cron from 'node-cron';
import { FollowTrackerBot } from './bot';
import { logger } from './utils/logger';
import { ConfigValidator } from './utils/validator';
import { config } from './config';

class BotWorker {
  private isRunning = false;

  async executeTask(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running, skipping this execution');
      return;
    }

    this.isRunning = true;

    try {
      const bot = new FollowTrackerBot();
      await bot.run();
    } catch (error) {
      logger.error('Error in bot execution:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(): void {
    logger.info('=== Follow Tracker Bot Worker Starting ===');

    // Validate configuration before starting
    logger.info('Validating configuration...');
    const validation = ConfigValidator.validate(config);

    if (!validation.valid) {
      logger.error('Configuration validation failed:');
      validation.errors.forEach((error) => logger.error(`  - ${error}`));
      process.exit(1);
    }

    if (validation.errors.length > 0) {
      logger.warn('Configuration warnings:');
      validation.errors.forEach((error) => logger.warn(`  - ${error}`));
    }

    logger.info('Configuration validated successfully');
    logger.info(`Cron schedule: ${config.cron.schedule}`);
    logger.info(`Target account: @${config.instagram.targetUsername}`);
    logger.info('Worker is now running...');

    // Validate cron expression
    if (!cron.validate(config.cron.schedule)) {
      logger.error(`Invalid cron schedule: ${config.cron.schedule}`);
      process.exit(1);
    }

    // Run immediately on startup
    logger.info('Running initial task...');
    this.executeTask().catch((error) => {
      logger.error('Error in initial task execution:', error);
    });

    // Schedule periodic execution
    cron.schedule(config.cron.schedule, () => {
      logger.info('Cron trigger - starting scheduled task...');
      this.executeTask().catch((error) => {
        logger.error('Error in scheduled task execution:', error);
      });
    });

    logger.info('Cron job scheduled successfully');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the worker
const worker = new BotWorker();
worker.start();
