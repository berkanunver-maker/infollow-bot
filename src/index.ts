import { FollowTrackerBot } from './bot';
import { logger } from './utils/logger';

async function main() {
  try {
    const bot = new FollowTrackerBot();
    await bot.run();
    process.exit(0);
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
