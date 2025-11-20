import { InstagramSecureScraper } from './scrapers/instagram-secure';
import { SnapshotStorage } from './utils/storage';
import { DiffDetector } from './utils/diff';
import { logger } from './utils/logger';
import { config } from './config';
import { notificationManager } from './notifications/manager';
import {
  TwitterProvider,
  DiscordProvider,
  EmailProvider,
  SlackProvider,
  TelegramProvider,
} from './notifications/providers';

export class FollowTrackerBot {
  private scraper: InstagramSecureScraper;
  private storage: SnapshotStorage;
  private diffDetector: DiffDetector;
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.scraper = new InstagramSecureScraper();
    this.storage = new SnapshotStorage();
    this.diffDetector = new DiffDetector();
    this.dryRun = dryRun;

    // Register all notification providers
    this.registerNotificationProviders();
  }

  private registerNotificationProviders() {
    notificationManager.register(new TwitterProvider(this.dryRun));
    notificationManager.register(new DiscordProvider());
    notificationManager.register(new EmailProvider());
    notificationManager.register(new SlackProvider());
    notificationManager.register(new TelegramProvider());
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    logger.info('=== Starting Follow Tracker Bot ===');
    if (this.dryRun) {
      logger.info('🔍 DRY RUN MODE - No tweets will be posted');
    }
    logger.info(`Target: @${config.instagram.targetUsername}`);

    try {
      // Initialize scraper
      await this.scraper.initialize();

      // Login to Instagram
      await this.scraper.login();

      // Scrape following list
      const result = await this.scraper.scrapeFollowing(
        config.instagram.targetUsername
      );

      if (!result.success || !result.snapshot) {
        throw new Error(result.error || 'Failed to scrape following list');
      }

      const currentSnapshot = result.snapshot;

      // Save current snapshot
      this.storage.saveSnapshot(currentSnapshot);

      // Get previous snapshot
      const previousSnapshot = this.storage.getLatestSnapshot(
        config.instagram.targetUsername
      );

      // Calculate diff (skip the most recent one we just saved)
      const allSnapshots = this.storage.getAllSnapshots(
        config.instagram.targetUsername
      );
      const previousSnapshotForDiff =
        allSnapshots.length > 1 ? allSnapshots[allSnapshots.length - 2] : null;

      const diff = this.diffDetector.calculateDiff(
        previousSnapshotForDiff,
        currentSnapshot
      );

      // Log diff summary
      const diffSummary = this.diffDetector.formatDiffSummary(diff);
      logger.info('\n' + diffSummary);

      // Send notifications if there are changes
      if (this.diffDetector.hasChanges(diff)) {
        logger.info('Changes detected, sending notifications...');

        // Take screenshot of one of the changed profiles
        let screenshotPath: string | null = null;

        if (diff.newFollows.length > 0) {
          screenshotPath = await this.scraper.takeProfileScreenshot(
            diff.newFollows[0].username
          );
        } else if (diff.unfollows.length > 0) {
          screenshotPath = await this.scraper.takeProfileScreenshot(
            diff.unfollows[0].username
          );
        }

        // Send to all enabled notification providers
        const results = await notificationManager.sendToAll({
          type: 'change',
          targetUsername: config.instagram.targetUsername,
          diff,
          timestamp: Date.now(),
          screenshotPath: screenshotPath || undefined,
        });

        // Log results
        const successCount = results.filter((r) => r.success).length;
        const failCount = results.filter((r) => !r.success).length;

        logger.info(
          `Notifications sent: ${successCount} succeeded, ${failCount} failed`
        );

        // Log failed providers
        results
          .filter((r) => !r.success)
          .forEach((r) => {
            logger.error(`${r.provider} failed: ${r.error}`);
          });
      } else {
        logger.info('No changes detected, skipping notifications');
      }

      // Cleanup old snapshots (keep last 10)
      this.storage.deleteOldSnapshots(config.instagram.targetUsername, 10);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logger.info(`=== Bot completed successfully in ${duration}s ===`);
    } catch (error) {
      logger.error('Error running bot:', error);
      throw error;
    } finally {
      // Always close the scraper
      await this.scraper.close();
    }
  }
}
