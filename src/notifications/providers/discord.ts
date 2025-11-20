import { NotificationProvider, FollowEvent, NotificationResult } from '../../types/notifications';
import { logger } from '../../utils/logger';
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

/**
 * Discord webhook notification provider
 */
export class DiscordProvider implements NotificationProvider {
  name = 'Discord';

  isEnabled(): boolean {
    return process.env.ENABLE_DISCORD_NOTIFICATIONS === 'true';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.DISCORD_WEBHOOK_URL) {
      errors.push('DISCORD_WEBHOOK_URL not configured');
    } else if (!process.env.DISCORD_WEBHOOK_URL.startsWith('https://discord.com/api/webhooks/')) {
      errors.push('Invalid Discord webhook URL format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(event: FollowEvent): Promise<NotificationResult> {
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;
      const mentionRole = process.env.DISCORD_MENTION_ROLE || '';
      const color = parseInt(process.env.DISCORD_COLOR || '3447003', 10); // Default blue

      logger.info('Posting to Discord...');

      const embed = this.createEmbed(event, color);
      const content = mentionRole ? `${mentionRole}` : '';

      // If there's a screenshot, upload it
      if (event.screenshotPath && fs.existsSync(event.screenshotPath)) {
        await this.sendWithAttachment(webhookUrl, content, embed, event.screenshotPath);
      } else {
        await this.sendWithoutAttachment(webhookUrl, content, embed);
      }

      return {
        provider: this.name,
        success: true,
      };
    } catch (error: any) {
      logger.error('Discord error:', error.response?.data || error.message);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private createEmbed(event: FollowEvent, color: number) {
    const { diff, targetUsername } = event;
    const netChange = diff.currentCount - diff.previousCount;
    const changeEmoji = netChange > 0 ? '📈' : netChange < 0 ? '📉' : '➡️';

    const fields = [];

    // Following count field
    fields.push({
      name: `${changeEmoji} Following Count`,
      value: `${diff.previousCount} → ${diff.currentCount} (${netChange >= 0 ? '+' : ''}${netChange})`,
      inline: true,
    });

    // New follows
    if (diff.newFollows.length > 0) {
      const displayCount = Math.min(diff.newFollows.length, 5);
      const usersList = diff.newFollows
        .slice(0, displayCount)
        .map((u) => `• [@${u.username}](https://instagram.com/${u.username})${u.isVerified ? ' ✓' : ''}`)
        .join('\n');

      const more =
        diff.newFollows.length > displayCount
          ? `\n... and ${diff.newFollows.length - displayCount} more`
          : '';

      fields.push({
        name: `✅ New Follows (${diff.newFollows.length})`,
        value: usersList + more,
        inline: false,
      });
    }

    // Unfollows
    if (diff.unfollows.length > 0) {
      const displayCount = Math.min(diff.unfollows.length, 5);
      const usersList = diff.unfollows
        .slice(0, displayCount)
        .map((u) => `• [@${u.username}](https://instagram.com/${u.username})${u.isVerified ? ' ✓' : ''}`)
        .join('\n');

      const more =
        diff.unfollows.length > displayCount
          ? `\n... and ${diff.unfollows.length - displayCount} more`
          : '';

      fields.push({
        name: `❌ Unfollowed (${diff.unfollows.length})`,
        value: usersList + more,
        inline: false,
      });
    }

    return {
      title: `📊 Instagram Follow Update - @${targetUsername}`,
      description: `Activity detected on [@${targetUsername}](https://instagram.com/${targetUsername})`,
      color,
      fields,
      timestamp: new Date(event.timestamp).toISOString(),
      footer: {
        text: 'Instagram Follow Tracker Bot',
      },
    };
  }

  private async sendWithoutAttachment(webhookUrl: string, content: string, embed: any) {
    await axios.post(webhookUrl, {
      content: content || undefined,
      embeds: [embed],
    });
  }

  private async sendWithAttachment(
    webhookUrl: string,
    content: string,
    embed: any,
    screenshotPath: string
  ) {
    const form = new FormData();

    if (content) {
      form.append('content', content);
    }

    form.append('embeds', JSON.stringify([embed]));

    // Attach screenshot
    const fileBuffer = fs.readFileSync(screenshotPath);
    const fileName = screenshotPath.split('/').pop() || 'screenshot.png';
    form.append('file', fileBuffer, { filename: fileName });

    // Set thumbnail to uploaded file
    embed.thumbnail = {
      url: `attachment://${fileName}`,
    };

    await axios.post(webhookUrl, form, {
      headers: form.getHeaders(),
    });
  }
}
