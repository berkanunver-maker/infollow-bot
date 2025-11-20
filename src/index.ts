import { FollowTrackerBot } from './bot';
import { MultiAccountRunner } from './services/multi-account-runner';
import { MultiAccountManager } from './services/multi-account';
import { logger } from './utils/logger';
import { ConfigValidator } from './utils/validator';
import { config } from './config';

async function main() {
  try {
    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

    // Check if multi-account mode is enabled
    const multiAccountManager = new MultiAccountManager();
    const isMultiAccount = multiAccountManager.isEnabled();

    if (isMultiAccount) {
      // Multi-account mode
      logger.info('Multi-account mode enabled');
      const runner = new MultiAccountRunner(dryRun);
      await runner.runAll();
    } else {
      // Single account mode
      logger.info('Single account mode');

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
    }

    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
