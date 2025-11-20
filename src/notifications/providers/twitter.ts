import { NotificationProvider, FollowEvent, NotificationResult } from '../../types/notifications';
import { TwitterClient } from '../../twitter/client';
import { config } from '../../config';
import { logger } from '../../utils/logger';

/**
 * Twitter notification provider
 */
export class TwitterProvider implements NotificationProvider {
  name = 'Twitter';
  private client: TwitterClient;
  private dryRun: boolean;

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
    this.client = new TwitterClient(dryRun);
  }

  isEnabled(): boolean {
    // Twitter is always enabled unless explicitly disabled
    return process.env.ENABLE_TWITTER_NOTIFICATIONS !== 'false';
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.twitter.apiKey || config.twitter.apiKey.includes('your_')) {
      errors.push('Twitter API Key not configured');
    }

    if (!config.twitter.apiSecret || config.twitter.apiSecret.includes('your_')) {
      errors.push('Twitter API Secret not configured');
    }

    if (!config.twitter.accessToken || config.twitter.accessToken.includes('your_')) {
      errors.push('Twitter Access Token not configured');
    }

    if (!config.twitter.accessSecret || config.twitter.accessSecret.includes('your_')) {
      errors.push('Twitter Access Secret not configured');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async send(event: FollowEvent): Promise<NotificationResult> {
    try {
      logger.info('Posting to Twitter...');

      const result = await this.client.postDiffUpdate(
        event.diff,
        event.targetUsername,
        event.screenshotPath
      );

      return {
        provider: this.name,
        success: result.success,
        error: result.error,
        messageId: result.tweetId,
      };
    } catch (error: any) {
      return {
        provider: this.name,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}
