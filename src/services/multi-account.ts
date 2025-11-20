import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Target account configuration
 */
export interface TargetAccount {
  username: string;
  notifications?: {
    twitter?: boolean;
    discord?: boolean;
    email?: boolean;
    slack?: boolean;
    telegram?: boolean;
  };
  export?: {
    csv?: boolean;
    excel?: boolean;
  };
}

/**
 * Multi-account configuration manager
 */
export class MultiAccountManager {
  private targets: TargetAccount[] = [];
  private targetsFile: string;

  constructor(targetsFile?: string) {
    this.targetsFile = targetsFile || process.env.TARGET_ACCOUNTS_FILE || './targets.json';
  }

  /**
   * Check if multi-account mode is enabled
   */
  isEnabled(): boolean {
    return process.env.ENABLE_MULTI_ACCOUNT === 'true';
  }

  /**
   * Load target accounts from JSON file
   */
  loadTargets(): TargetAccount[] {
    try {
      if (!fs.existsSync(this.targetsFile)) {
        logger.warn(`Targets file not found: ${this.targetsFile}`);
        logger.info('Falling back to single account mode');
        return [];
      }

      const fileContent = fs.readFileSync(this.targetsFile, 'utf-8');
      const targets = JSON.parse(fileContent) as TargetAccount[];

      // Validate targets
      if (!Array.isArray(targets)) {
        throw new Error('Targets file must contain an array');
      }

      if (targets.length === 0) {
        logger.warn('No targets found in file');
        return [];
      }

      // Validate each target
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        if (!target.username) {
          throw new Error(`Target at index ${i} missing username`);
        }
      }

      this.targets = targets;
      logger.info(`Loaded ${targets.length} target accounts from ${this.targetsFile}`);

      return targets;
    } catch (error: any) {
      logger.error('Failed to load targets file:', error);
      throw new Error(`Failed to load targets: ${error.message}`);
    }
  }

  /**
   * Get all target accounts
   */
  getTargets(): TargetAccount[] {
    return this.targets;
  }

  /**
   * Check if parallel scraping is enabled
   */
  isParallelEnabled(): boolean {
    return process.env.PARALLEL_SCRAPING === 'true';
  }

  /**
   * Get delay between accounts (in milliseconds)
   */
  getDelayBetweenAccounts(): number {
    const delay = parseInt(process.env.DELAY_BETWEEN_ACCOUNTS || '60000', 10);
    return Math.max(0, delay); // Ensure non-negative
  }

  /**
   * Apply target-specific notification overrides
   */
  applyNotificationOverrides(target: TargetAccount): void {
    if (!target.notifications) {
      return;
    }

    // Store original values
    const originalValues: { [key: string]: string | undefined } = {};

    // Twitter
    if (target.notifications.twitter !== undefined) {
      originalValues.ENABLE_TWITTER_NOTIFICATIONS = process.env.ENABLE_TWITTER_NOTIFICATIONS;
      process.env.ENABLE_TWITTER_NOTIFICATIONS = target.notifications.twitter.toString();
    }

    // Discord
    if (target.notifications.discord !== undefined) {
      originalValues.ENABLE_DISCORD_NOTIFICATIONS = process.env.ENABLE_DISCORD_NOTIFICATIONS;
      process.env.ENABLE_DISCORD_NOTIFICATIONS = target.notifications.discord.toString();
    }

    // Email
    if (target.notifications.email !== undefined) {
      originalValues.ENABLE_EMAIL_NOTIFICATIONS = process.env.ENABLE_EMAIL_NOTIFICATIONS;
      process.env.ENABLE_EMAIL_NOTIFICATIONS = target.notifications.email.toString();
    }

    // Slack
    if (target.notifications.slack !== undefined) {
      originalValues.ENABLE_SLACK_NOTIFICATIONS = process.env.ENABLE_SLACK_NOTIFICATIONS;
      process.env.ENABLE_SLACK_NOTIFICATIONS = target.notifications.slack.toString();
    }

    // Telegram
    if (target.notifications.telegram !== undefined) {
      originalValues.ENABLE_TELEGRAM_NOTIFICATIONS = process.env.ENABLE_TELEGRAM_NOTIFICATIONS;
      process.env.ENABLE_TELEGRAM_NOTIFICATIONS = target.notifications.telegram.toString();
    }

    logger.debug(`Applied notification overrides for @${target.username}`);
  }

  /**
   * Apply target-specific export overrides
   */
  applyExportOverrides(target: TargetAccount): void {
    if (!target.export) {
      return;
    }

    // CSV
    if (target.export.csv !== undefined) {
      process.env.AUTO_EXPORT_CSV = target.export.csv.toString();
    }

    // Excel
    if (target.export.excel !== undefined) {
      process.env.AUTO_EXPORT_EXCEL = target.export.excel.toString();
    }

    logger.debug(`Applied export overrides for @${target.username}`);
  }

  /**
   * Restore original environment variables
   */
  restoreEnvironment(originalEnv: { [key: string]: string | undefined }): void {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}
