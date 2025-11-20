import { FollowTrackerBot } from './bot';
import { logger } from './utils/logger';
import { ConfigValidator } from './utils/validator';
import { config } from './config';

async function main() {
  try {
    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

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

    const bot = new FollowTrackerBot(dryRun);
    await bot.run();
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
