import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import { logger } from '../utils/logger';
import { config } from '../config';
import { DiffResult, TwitterPostResult } from '../types';

export class TwitterClient {
  private client: TwitterApi;

  constructor() {
    this.client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });
  }

  async postTweet(text: string, mediaPath?: string): Promise<TwitterPostResult> {
    try {
      logger.info('Posting tweet to Twitter...');

      let mediaId: string | undefined;

      // Upload media if provided
      if (mediaPath && fs.existsSync(mediaPath)) {
        logger.info(`Uploading media: ${mediaPath}`);
        mediaId = await this.client.v1.uploadMedia(mediaPath);
        logger.info(`Media uploaded successfully: ${mediaId}`);
      }

      // Post tweet
      const tweet = await this.client.v2.tweet({
        text,
        ...(mediaId && { media: { media_ids: [mediaId] } }),
      });

      logger.info(`Tweet posted successfully: ${tweet.data.id}`);

      return {
        success: true,
        tweetId: tweet.data.id,
      };
    } catch (error) {
      logger.error('Error posting tweet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  generateTweetText(diff: DiffResult, targetUsername: string): string {
    const lines: string[] = [];

    lines.push(`📊 Instagram Following Update for @${targetUsername}`);
    lines.push('');

    const netChange = diff.currentCount - diff.previousCount;
    if (netChange > 0) {
      lines.push(`📈 Following: ${diff.previousCount} → ${diff.currentCount} (+${netChange})`);
    } else if (netChange < 0) {
      lines.push(`📉 Following: ${diff.previousCount} → ${diff.currentCount} (${netChange})`);
    } else {
      lines.push(`➡️ Following: ${diff.currentCount} (no net change)`);
    }

    lines.push('');

    if (diff.newFollows.length > 0) {
      lines.push(`✅ New Follows (${diff.newFollows.length}):`);
      const displayCount = Math.min(diff.newFollows.length, 5);
      for (let i = 0; i < displayCount; i++) {
        const user = diff.newFollows[i];
        lines.push(`  • @${user.username}${user.isVerified ? ' ✓' : ''}`);
      }
      if (diff.newFollows.length > displayCount) {
        lines.push(`  ... and ${diff.newFollows.length - displayCount} more`);
      }
      lines.push('');
    }

    if (diff.unfollows.length > 0) {
      lines.push(`❌ Unfollowed (${diff.unfollows.length}):`);
      const displayCount = Math.min(diff.unfollows.length, 5);
      for (let i = 0; i < displayCount; i++) {
        const user = diff.unfollows[i];
        lines.push(`  • @${user.username}${user.isVerified ? ' ✓' : ''}`);
      }
      if (diff.unfollows.length > displayCount) {
        lines.push(`  ... and ${diff.unfollows.length - displayCount} more`);
      }
    }

    let tweetText = lines.join('\n');

    // Twitter character limit is 280
    if (tweetText.length > 280) {
      // Truncate and add ellipsis
      tweetText = tweetText.substring(0, 277) + '...';
    }

    return tweetText;
  }

  async postDiffUpdate(
    diff: DiffResult,
    targetUsername: string,
    screenshotPath?: string
  ): Promise<TwitterPostResult> {
    const tweetText = this.generateTweetText(diff, targetUsername);
    logger.info('Generated tweet text:', { text: tweetText });

    return await this.postTweet(tweetText, screenshotPath);
  }
}
