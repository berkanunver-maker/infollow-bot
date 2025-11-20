import { NotificationProvider, FollowEvent, NotificationResult } from '../../types/notifications';
import { logger } from '../../utils/logger';
import TelegramBot from 'node-telegram-bot-api';

/**
 * Telegram bot notification provider
 */
export class TelegramProvider implements NotificationProvider {
  name = 'Telegram';
  private bot: TelegramBot | null = null;

  isEnabled(): boolean {
    return process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      errors.push('TELEGRAM_BOT_TOKEN not configured');
    }

    if (!process.env.TELEGRAM_CHAT_ID) {
      errors.push('TELEGRAM_CHAT_ID not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private getBot(): TelegramBot {
    if (this.bot) {
      return this.bot;
    }

    const token = process.env.TELEGRAM_BOT_TOKEN!;
    this.bot = new TelegramBot(token);
    return this.bot;
  }

  async send(event: FollowEvent): Promise<NotificationResult> {
    try {
      const chatId = process.env.TELEGRAM_CHAT_ID!;
      const bot = this.getBot();

      logger.info('Sending to Telegram...');

      const message = this.createMessage(event);

      const result = await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      });

      return {
        provider: this.name,
        success: true,
        messageId: result.message_id.toString(),
      };
    } catch (error: any) {
      logger.error('Telegram error:', error);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private createMessage(event: FollowEvent): string {
    const { diff, targetUsername } = event;
    const netChange = diff.currentCount - diff.previousCount;
    const changeEmoji = netChange > 0 ? '📈' : netChange < 0 ? '📉' : '➡️';

    const lines: string[] = [];

    lines.push(`*📊 Instagram Following Update*`);
    lines.push(`[@${targetUsername}](https://instagram.com/${targetUsername})`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    lines.push(
      `${changeEmoji} *Following:* ${diff.previousCount} → ${diff.currentCount} (${netChange >= 0 ? '+' : ''}${netChange})`
    );
    lines.push('');

    // New follows
    if (diff.newFollows.length > 0) {
      lines.push(`*✅ New Follows (${diff.newFollows.length}):*`);
      diff.newFollows.slice(0, 5).forEach((user) => {
        const verified = user.isVerified ? ' ✓' : '';
        lines.push(`  • [@${user.username}](https://instagram.com/${user.username})${verified}`);
      });
      if (diff.newFollows.length > 5) {
        lines.push(`  _... and ${diff.newFollows.length - 5} more_`);
      }
      lines.push('');
    }

    // Unfollows
    if (diff.unfollows.length > 0) {
      lines.push(`*❌ Unfollowed (${diff.unfollows.length}):*`);
      diff.unfollows.slice(0, 5).forEach((user) => {
        const verified = user.isVerified ? ' ✓' : '';
        lines.push(`  • [@${user.username}](https://instagram.com/${user.username})${verified}`);
      });
      if (diff.unfollows.length > 5) {
        lines.push(`  _... and ${diff.unfollows.length - 5} more_`);
      }
      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`🕐 ${new Date(event.timestamp).toLocaleString()}`);

    return lines.join('\n');
  }
}
