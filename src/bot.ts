import { InstagramScraper } from './scrapers/instagram';
import { SnapshotStorage } from './utils/storage';
import { DiffDetector } from './utils/diff';
import { TwitterClient } from './twitter/client';
import { logger } from './utils/logger';
import { config } from './config';

export class FollowTrackerBot {
  private scraper: InstagramScraper;
  private storage: SnapshotStorage;
  private diffDetector: DiffDetector;
  private twitterClient: TwitterClient;

  constructor() {
    this.scraper = new InstagramScraper();
    this.storage = new SnapshotStorage();
    this.diffDetector = new DiffDetector();
    this.twitterClient = new TwitterClient();
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    logger.info('=== Starting Follow Tracker Bot ===');
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

      // Post to Twitter if there are changes
      if (this.diffDetector.hasChanges(diff)) {
        logger.info('Changes detected, posting to Twitter...');

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

        // Post to Twitter
        const twitterResult = await this.twitterClient.postDiffUpdate(
          diff,
          config.instagram.targetUsername,
          screenshotPath || undefined
        );

        if (twitterResult.success) {
          logger.info(
            `Successfully posted to Twitter: ${twitterResult.tweetId}`
          );
        } else {
          logger.error(
            `Failed to post to Twitter: ${twitterResult.error}`
          );
        }
      } else {
        logger.info('No changes detected, skipping Twitter post');
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
