import { DiffResult } from './index';

/**
 * Follow event that triggers notifications
 */
export interface FollowEvent {
  type: 'change' | 'summary';
  targetUsername: string;
  diff: DiffResult;
  timestamp: number;
  screenshotPath?: string;
}

/**
 * Notification result
 */
export interface NotificationResult {
  provider: string;
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Base notification provider interface
 */
export interface NotificationProvider {
  name: string;
  isEnabled(): boolean;
  validateConfig(): { valid: boolean; errors: string[] };
  send(event: FollowEvent): Promise<NotificationResult>;
}

/**
 * Notification configuration for all providers
 */
export interface NotificationConfig {
  enabled: boolean;
  providers: {
    twitter: {
      enabled: boolean;
    };
    discord: {
      enabled: boolean;
      webhookUrl: string;
      mentionRole?: string;
      color?: string;
    };
    email: {
      enabled: boolean;
      provider: 'gmail' | 'outlook' | 'smtp';
      from: string;
      to: string;
      smtp?: {
        host: string;
        port: number;
        secure: boolean;
        username: string;
        password: string;
      };
      instantAlerts: boolean;
      dailySummary: boolean;
      dailySummaryTime: string;
      weeklyReport: boolean;
    };
    slack: {
      enabled: boolean;
      webhookUrl: string;
      channel?: string;
      username?: string;
      iconEmoji?: string;
    };
    telegram: {
      enabled: boolean;
      botToken: string;
      chatId: string;
    };
  };
}

/**
 * Export configuration
 */
export interface ExportConfig {
  enabled: boolean;
  csv: {
    enabled: boolean;
    autoExportOnChange: boolean;
  };
  excel: {
    enabled: boolean;
    autoExportOnChange: boolean;
  };
  exportDir: string;
}

/**
 * Multi-account configuration
 */
export interface MultiAccountConfig {
  enabled: boolean;
  accounts: AccountConfig[];
  parallel: boolean;
  delayBetweenAccounts: number;
}

export interface AccountConfig {
  username: string;
  notifyOn: ('follow' | 'unfollow' | 'both')[];
  tweetEnabled: boolean;
  discordEnabled: boolean;
  emailEnabled: boolean;
  slackEnabled: boolean;
  telegramEnabled: boolean;
}
