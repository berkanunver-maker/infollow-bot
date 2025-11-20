import { NotificationProvider, FollowEvent, NotificationResult } from '../../types/notifications';
import { logger } from '../../utils/logger';
import axios from 'axios';

/**
 * Slack webhook notification provider
 */
export class SlackProvider implements NotificationProvider {
  name = 'Slack';

  isEnabled(): boolean {
    return process.env.ENABLE_SLACK_NOTIFICATIONS === 'true';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!process.env.SLACK_WEBHOOK_URL) {
      errors.push('SLACK_WEBHOOK_URL not configured');
    } else if (!process.env.SLACK_WEBHOOK_URL.startsWith('https://hooks.slack.com/')) {
      errors.push('Invalid Slack webhook URL format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(event: FollowEvent): Promise<NotificationResult> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL!;

      logger.info('Posting to Slack...');

      const message = this.createMessage(event);

      await axios.post(webhookUrl, message);

      return {
        provider: this.name,
        success: true,
      };
    } catch (error: any) {
      logger.error('Slack error:', error.response?.data || error.message);
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  private createMessage(event: FollowEvent) {
    const { diff, targetUsername } = event;
    const netChange = diff.currentCount - diff.previousCount;
    const changeEmoji = netChange > 0 ? ':chart_with_upwards_trend:' : netChange < 0 ? ':chart_with_downwards_trend:' : ':left_right_arrow:';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📊 Instagram Follow Update - @${targetUsername}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Following Count:*\n${diff.previousCount} → ${diff.currentCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*Net Change:*\n${changeEmoji} ${netChange >= 0 ? '+' : ''}${netChange}`,
          },
        ],
      },
    ];

    // New follows
    if (diff.newFollows.length > 0) {
      const usersList = diff.newFollows
        .slice(0, 5)
        .map((u) => `• <https://instagram.com/${u.username}|@${u.username}>${u.isVerified ? ' :white_check_mark:' : ''}`)
        .join('\n');

      const more =
        diff.newFollows.length > 5
          ? `\n_... and ${diff.newFollows.length - 5} more_`
          : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*✅ New Follows (${diff.newFollows.length}):*\n${usersList}${more}`,
        },
      });
    }

    // Unfollows
    if (diff.unfollows.length > 0) {
      const usersList = diff.unfollows
        .slice(0, 5)
        .map((u) => `• <https://instagram.com/${u.username}|@${u.username}>${u.isVerified ? ' :white_check_mark:' : ''}`)
        .join('\n');

      const more =
        diff.unfollows.length > 5
          ? `\n_... and ${diff.unfollows.length - 5} more_`
          : '';

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*❌ Unfollowed (${diff.unfollows.length}):*\n${usersList}${more}`,
        },
      });
    }

    // Divider and footer
    blocks.push({
      type: 'divider',
    });

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `<!date^${Math.floor(event.timestamp / 1000)}^{date_num} {time_secs}|${new Date(event.timestamp).toLocaleString()}>`,
        },
      ],
    });

    const username = process.env.SLACK_USERNAME || 'Instagram Bot';
    const iconEmoji = process.env.SLACK_ICON_EMOJI || ':camera:';

    return {
      username,
      icon_emoji: iconEmoji,
      blocks,
    };
  }
}
