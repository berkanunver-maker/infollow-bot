import { FollowTrackerBot } from '../bot';
import { MultiAccountManager, TargetAccount } from './multi-account';
import { logger } from '../utils/logger';

/**
 * Multi-account bot runner
 * Orchestrates running the bot for multiple target accounts
 */
export class MultiAccountRunner {
  private manager: MultiAccountManager;
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.manager = new MultiAccountManager();
    this.dryRun = dryRun;
  }

  /**
   * Run bot for all target accounts
   */
  async runAll(): Promise<void> {
    const startTime = Date.now();

    logger.info('=== Multi-Account Mode ===');
    logger.info('Loading target accounts...');

    // Load targets
    const targets = this.manager.loadTargets();

    if (targets.length === 0) {
      logger.warn('No targets to process');
      return;
    }

    logger.info(`Processing ${targets.length} target accounts`);

    // Check if parallel mode is enabled
    const isParallel = this.manager.isParallelEnabled();
    const delay = this.manager.getDelayBetweenAccounts();

    if (isParallel) {
      logger.info('Running in PARALLEL mode');
      await this.runParallel(targets);
    } else {
      logger.info('Running in SEQUENTIAL mode');
      logger.info(`Delay between accounts: ${delay}ms`);
      await this.runSequential(targets, delay);
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Multi-account processing completed in ${totalDuration}s ===`);
  }

  /**
   * Run all targets in parallel
   */
  private async runParallel(targets: TargetAccount[]): Promise<void> {
    const promises = targets.map((target) => this.runTarget(target));
    const results = await Promise.allSettled(promises);

    // Log results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info(`Results: ${successful} successful, ${failed} failed`);

    // Log errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error(`Target @${targets[index].username} failed:`, result.reason);
      }
    });
  }

  /**
   * Run all targets sequentially with delays
   */
  private async runSequential(targets: TargetAccount[], delay: number): Promise<void> {
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];

      try {
        await this.runTarget(target);
        successful++;
      } catch (error) {
        logger.error(`Target @${target.username} failed:`, error);
        failed++;
      }

      // Add delay between accounts (except after last one)
      if (i < targets.length - 1 && delay > 0) {
        logger.info(`Waiting ${delay}ms before next account...`);
        await this.sleep(delay);
      }
    }

    logger.info(`Results: ${successful} successful, ${failed} failed`);
  }

  /**
   * Run bot for a single target account
   */
  private async runTarget(target: TargetAccount): Promise<void> {
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`Processing target: @${target.username}`);
    logger.info('='.repeat(60));

    // Store original environment
    const originalEnv: { [key: string]: string | undefined } = {
      ENABLE_TWITTER_NOTIFICATIONS: process.env.ENABLE_TWITTER_NOTIFICATIONS,
      ENABLE_DISCORD_NOTIFICATIONS: process.env.ENABLE_DISCORD_NOTIFICATIONS,
      ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS,
      ENABLE_SLACK_NOTIFICATIONS: process.env.ENABLE_SLACK_NOTIFICATIONS,
      ENABLE_TELEGRAM_NOTIFICATIONS: process.env.ENABLE_TELEGRAM_NOTIFICATIONS,
      AUTO_EXPORT_CSV: process.env.AUTO_EXPORT_CSV,
      AUTO_EXPORT_EXCEL: process.env.AUTO_EXPORT_EXCEL,
    };

    try {
      // Apply target-specific overrides
      this.manager.applyNotificationOverrides(target);
      this.manager.applyExportOverrides(target);

      // Create and run bot for this target
      const bot = new FollowTrackerBot(this.dryRun);
      await bot.run(target.username);

      logger.info(`✓ Successfully processed @${target.username}`);
    } catch (error) {
      logger.error(`✗ Failed to process @${target.username}:`, error);
      throw error;
    } finally {
      // Restore original environment
      this.manager.restoreEnvironment(originalEnv);
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
