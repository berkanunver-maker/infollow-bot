#!/usr/bin/env ts-node
/**
 * One-off scraping script for testing
 * Usage: npm run scrape
 */

import { InstagramScraper } from './scrapers/instagram';
import { SnapshotStorage } from './utils/storage';
import { logger } from './utils/logger';
import { config } from './config';

async function main() {
  logger.info('=== Manual Instagram Scraping ===');
  logger.info(`Target: @${config.instagram.targetUsername}`);

  const scraper = new InstagramScraper();
  const storage = new SnapshotStorage();

  try {
    // Initialize and login
    await scraper.initialize();
    await scraper.login();

    // Scrape following list
    const result = await scraper.scrapeFollowing(config.instagram.targetUsername);

    if (!result.success || !result.snapshot) {
      throw new Error(result.error || 'Scraping failed');
    }

    // Save snapshot
    const filepath = storage.saveSnapshot(result.snapshot);
    logger.info(`Snapshot saved: ${filepath}`);

    // Display summary
    logger.info('\n=== Scraping Summary ===');
    logger.info(`Total following: ${result.snapshot.followingCount}`);
    logger.info(`Users scraped: ${result.snapshot.users.length}`);
    logger.info(`Timestamp: ${result.snapshot.date}`);

    // Display first 10 users
    logger.info('\nFirst 10 users:');
    result.snapshot.users.slice(0, 10).forEach((user, index) => {
      logger.info(
        `${index + 1}. @${user.username} - ${user.fullName}${user.isVerified ? ' ✓' : ''}`
      );
    });

    if (result.snapshot.users.length > 10) {
      logger.info(`... and ${result.snapshot.users.length - 10} more`);
    }

    logger.info('\n=== Scraping completed successfully ===');
  } catch (error) {
    logger.error('Error during scraping:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

main();
