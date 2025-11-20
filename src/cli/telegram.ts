import TelegramBot from 'node-telegram-bot-api';
import { SnapshotStorage } from '../utils/storage';
import { DiffDetector } from '../utils/diff';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Telegram Bot CLI for interactive commands
 * Allows users to query bot status, stats, and latest changes via Telegram
 */
export class TelegramBotCLI {
  private bot: TelegramBot;
  private storage: SnapshotStorage;
  private diffDetector: DiffDetector;
  private authorizedChatIds: Set<number>;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.storage = new SnapshotStorage();
    this.diffDetector = new DiffDetector();

    // Parse authorized chat IDs
    const chatId = process.env.TELEGRAM_CHAT_ID;
    this.authorizedChatIds = new Set();

    if (chatId) {
      // Support multiple chat IDs separated by comma
      chatId.split(',').forEach((id) => {
        const parsed = parseInt(id.trim(), 10);
        if (!isNaN(parsed)) {
          this.authorizedChatIds.add(parsed);
        }
      });
    }

    this.registerCommands();
    logger.info('Telegram Bot CLI started');
  }

  /**
   * Check if chat is authorized
   */
  private isAuthorized(chatId: number): boolean {
    // If no chat IDs configured, allow all (not recommended for production)
    if (this.authorizedChatIds.size === 0) {
      return true;
    }

    return this.authorizedChatIds.has(chatId);
  }

  /**
   * Register bot commands
   */
  private registerCommands() {
    // Set bot commands (shown in Telegram menu)
    this.bot.setMyCommands([
      { command: 'start', description: 'Start the bot and show welcome message' },
      { command: 'help', description: 'Show available commands' },
      { command: 'status', description: 'Show current bot status' },
      { command: 'stats', description: 'Show statistics for target account' },
      { command: 'latest', description: 'Show latest changes' },
      { command: 'snapshot', description: 'Show latest snapshot details' },
    ]);

    // Start command
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));

    // Help command
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));

    // Status command
    this.bot.onText(/\/status/, (msg) => this.handleStatus(msg));

    // Stats command
    this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));

    // Latest command
    this.bot.onText(/\/latest/, (msg) => this.handleLatest(msg));

    // Snapshot command
    this.bot.onText(/\/snapshot/, (msg) => this.handleSnapshot(msg));

    // Error handling
    this.bot.on('polling_error', (error) => {
      logger.error('Telegram polling error:', error);
    });
  }

  /**
   * Handle /start command
   */
  private async handleStart(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const message = `
🤖 *Instagram Follow Tracker Bot*

Welcome! I help you track Instagram following changes.

*Available Commands:*
/help - Show this help message
/status - Check bot status
/stats - View account statistics
/latest - See latest changes
/snapshot - View latest snapshot

Target account: @${config.instagram.targetUsername}

Use the commands to get started!
    `.trim();

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /help command
   */
  private async handleHelp(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const message = `
📚 *Available Commands*

/start - Start the bot
/help - Show this help message
/status - Show current bot status
/stats - Show statistics for tracked account
/latest - Show latest changes detected
/snapshot - Show details of latest snapshot

*Target Account:* @${config.instagram.targetUsername}

*Features:*
• Automatic tracking of following changes
• Multi-channel notifications
• CSV/Excel export
• Web dashboard

Need more info? Check the documentation.
    `.trim();

    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /status command
   */
  private async handleStatus(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const targetUsername = config.instagram.targetUsername;
    const snapshots = this.storage.getAllSnapshots(targetUsername);

    const statusMessage = `
📊 *Bot Status*

*Target:* @${targetUsername}
*Total Snapshots:* ${snapshots.length}
*Last Updated:* ${snapshots.length > 0 ? new Date(snapshots[snapshots.length - 1].date).toLocaleString() : 'Never'}

*Notifications:*
${process.env.ENABLE_TWITTER_NOTIFICATIONS === 'true' ? '✅' : '❌'} Twitter
${process.env.ENABLE_DISCORD_NOTIFICATIONS === 'true' ? '✅' : '❌'} Discord
${process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' ? '✅' : '❌'} Email
${process.env.ENABLE_SLACK_NOTIFICATIONS === 'true' ? '✅' : '❌'} Slack
${process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true' ? '✅' : '❌'} Telegram

*Export:*
${process.env.ENABLE_CSV_EXPORT === 'true' ? '✅' : '❌'} CSV
${process.env.ENABLE_EXCEL_EXPORT === 'true' ? '✅' : '❌'} Excel

*Dashboard:* ${process.env.ENABLE_DASHBOARD === 'true' ? `http://localhost:${process.env.DASHBOARD_PORT || 3000}` : 'Disabled'}
    `.trim();

    await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /stats command
   */
  private async handleStats(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const targetUsername = config.instagram.targetUsername;
    const snapshots = this.storage.getAllSnapshots(targetUsername);

    if (snapshots.length === 0) {
      await this.bot.sendMessage(
        chatId,
        '❌ No snapshots found. Run the bot first to collect data.'
      );
      return;
    }

    const first = snapshots[0];
    const latest = snapshots[snapshots.length - 1];
    const netChange = latest.followingCount - first.followingCount;

    // Calculate total changes
    let totalNewFollows = 0;
    let totalUnfollows = 0;

    for (let i = 1; i < snapshots.length; i++) {
      const diff = this.diffDetector.calculateDiff(snapshots[i - 1], snapshots[i]);
      totalNewFollows += diff.newFollows.length;
      totalUnfollows += diff.unfollows.length;
    }

    const statsMessage = `
📈 *Statistics for @${targetUsername}*

*Total Snapshots:* ${snapshots.length}
*First Snapshot:* ${new Date(first.date).toLocaleDateString()}
*Latest Snapshot:* ${new Date(latest.date).toLocaleString()}

*Following Count:*
• Initial: ${first.followingCount}
• Current: ${latest.followingCount}
• Net Change: ${netChange >= 0 ? '+' : ''}${netChange}

*All-Time Changes:*
• New Follows: ${totalNewFollows}
• Unfollows: ${totalUnfollows}
• Net: ${totalNewFollows - totalUnfollows >= 0 ? '+' : ''}${totalNewFollows - totalUnfollows}

*Tracking Duration:* ${this.formatDuration(new Date(first.date), new Date(latest.date))}
    `.trim();

    await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /latest command
   */
  private async handleLatest(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const targetUsername = config.instagram.targetUsername;
    const snapshots = this.storage.getAllSnapshots(targetUsername);

    if (snapshots.length < 2) {
      await this.bot.sendMessage(
        chatId,
        '❌ Need at least 2 snapshots to detect changes. Run the bot again later.'
      );
      return;
    }

    const latest = snapshots[snapshots.length - 1];
    const previous = snapshots[snapshots.length - 2];
    const diff = this.diffDetector.calculateDiff(previous, latest);

    if (!this.diffDetector.hasChanges(diff)) {
      await this.bot.sendMessage(
        chatId,
        `✅ No changes detected in the last update.\n\nLast checked: ${new Date(latest.date).toLocaleString()}`
      );
      return;
    }

    let changesMessage = `🔔 *Latest Changes for @${targetUsername}*\n\n`;
    changesMessage += `*Date:* ${new Date(latest.date).toLocaleString()}\n\n`;

    if (diff.newFollows.length > 0) {
      changesMessage += `✅ *New Follows (${diff.newFollows.length}):*\n`;
      diff.newFollows.slice(0, 10).forEach((user) => {
        changesMessage += `• @${user.username}${user.fullName ? ` (${user.fullName})` : ''}\n`;
      });

      if (diff.newFollows.length > 10) {
        changesMessage += `... and ${diff.newFollows.length - 10} more\n`;
      }
      changesMessage += '\n';
    }

    if (diff.unfollows.length > 0) {
      changesMessage += `❌ *Unfollows (${diff.unfollows.length}):*\n`;
      diff.unfollows.slice(0, 10).forEach((user) => {
        changesMessage += `• @${user.username}${user.fullName ? ` (${user.fullName})` : ''}\n`;
      });

      if (diff.unfollows.length > 10) {
        changesMessage += `... and ${diff.unfollows.length - 10} more\n`;
      }
    }

    changesMessage += `\n*Net Change:* ${diff.currentCount - diff.previousCount >= 0 ? '+' : ''}${diff.currentCount - diff.previousCount}`;

    await this.bot.sendMessage(chatId, changesMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Handle /snapshot command
   */
  private async handleSnapshot(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    if (!this.isAuthorized(chatId)) {
      await this.bot.sendMessage(
        chatId,
        '❌ Unauthorized. Contact the bot administrator.'
      );
      return;
    }

    const targetUsername = config.instagram.targetUsername;
    const snapshot = this.storage.getLatestSnapshot(targetUsername);

    if (!snapshot) {
      await this.bot.sendMessage(
        chatId,
        '❌ No snapshots found. Run the bot first to collect data.'
      );
      return;
    }

    const snapshotMessage = `
📸 *Latest Snapshot*

*Target:* @${snapshot.targetUsername}
*Date:* ${new Date(snapshot.date).toLocaleString()}
*Following Count:* ${snapshot.followingCount}
*Users Tracked:* ${snapshot.users.length}

*Sample Users (first 5):*
${snapshot.users
  .slice(0, 5)
  .map((u) => `• @${u.username}${u.fullName ? ` - ${u.fullName}` : ''}${u.isVerified ? ' ✓' : ''}`)
  .join('\n')}

${snapshot.users.length > 5 ? `... and ${snapshot.users.length - 5} more` : ''}
    `.trim();

    await this.bot.sendMessage(chatId, snapshotMessage, { parse_mode: 'Markdown' });
  }

  /**
   * Format duration between two dates
   */
  private formatDuration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return 'Less than an hour';
    }
  }

  /**
   * Stop the bot
   */
  public stop() {
    this.bot.stopPolling();
    logger.info('Telegram Bot CLI stopped');
  }
}

// Run bot if this file is executed directly
if (require.main === module) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    logger.error('TELEGRAM_BOT_TOKEN is required');
    logger.error('Set it in .env file and try again');
    process.exit(1);
  }

  logger.info('Starting Telegram Bot CLI...');
  logger.info('Press Ctrl+C to stop');

  const bot = new TelegramBotCLI();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('\nShutting down...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('\nShutting down...');
    bot.stop();
    process.exit(0);
  });
}
