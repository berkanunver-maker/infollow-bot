import { BotConfig } from '../types';

export class ConfigValidator {
  private static readonly ERRORS: string[] = [];

  static validate(config: BotConfig): { valid: boolean; errors: string[] } {
    this.ERRORS.length = 0;

    // Validate Instagram credentials
    this.validateInstagramCredentials(config);

    // Validate Twitter credentials
    this.validateTwitterCredentials(config);

    // Validate target username
    this.validateTargetUsername(config);

    // Validate cron schedule
    this.validateCronSchedule(config);

    // Validate proxy config
    this.validateProxyConfig(config);

    // Validate security settings
    this.validateSecuritySettings(config);

    // Check for common mistakes
    this.checkCommonMistakes(config);

    return {
      valid: this.ERRORS.length === 0,
      errors: [...this.ERRORS],
    };
  }

  private static validateInstagramCredentials(config: BotConfig): void {
    const { username, password } = config.instagram;

    // Check for placeholder values
    if (this.isPlaceholder(username)) {
      this.ERRORS.push('INSTAGRAM_USERNAME contains placeholder value');
    }

    if (this.isPlaceholder(password)) {
      this.ERRORS.push('INSTAGRAM_PASSWORD contains placeholder value');
    }

    // Validate username format
    if (username && !this.isValidInstagramUsername(username)) {
      this.ERRORS.push(
        'INSTAGRAM_USERNAME invalid format (alphanumeric, dots, underscores only)'
      );
    }

    // Password strength check
    if (password && password.length < 6) {
      this.ERRORS.push('INSTAGRAM_PASSWORD too short (minimum 6 characters)');
    }

    // Check for exposed credentials
    if (username && this.containsSensitiveKeywords(username)) {
      this.ERRORS.push('INSTAGRAM_USERNAME appears to contain sensitive data');
    }
  }

  private static validateTwitterCredentials(config: BotConfig): void {
    const { apiKey, apiSecret, accessToken, accessSecret } = config.twitter;

    const credentials = [
      { name: 'TWITTER_API_KEY', value: apiKey },
      { name: 'TWITTER_API_SECRET', value: apiSecret },
      { name: 'TWITTER_ACCESS_TOKEN', value: accessToken },
      { name: 'TWITTER_ACCESS_SECRET', value: accessSecret },
    ];

    for (const cred of credentials) {
      if (this.isPlaceholder(cred.value)) {
        this.ERRORS.push(`${cred.name} contains placeholder value`);
      }

      // Twitter API keys should be alphanumeric
      if (cred.value && !this.isValidApiKey(cred.value)) {
        this.ERRORS.push(`${cred.name} has invalid format`);
      }

      // Check minimum length
      if (cred.value && cred.value.length < 20) {
        this.ERRORS.push(`${cred.name} too short (likely invalid)`);
      }
    }
  }

  private static validateTargetUsername(config: BotConfig): void {
    const { targetUsername } = config.instagram;

    if (this.isPlaceholder(targetUsername)) {
      this.ERRORS.push('TARGET_INSTAGRAM_USERNAME contains placeholder value');
    }

    if (targetUsername && !this.isValidInstagramUsername(targetUsername)) {
      this.ERRORS.push(
        'TARGET_INSTAGRAM_USERNAME invalid format (alphanumeric, dots, underscores only)'
      );
    }

    // Prevent self-tracking
    if (
      targetUsername &&
      config.instagram.username &&
      targetUsername.toLowerCase() === config.instagram.username.toLowerCase()
    ) {
      this.ERRORS.push(
        'TARGET_INSTAGRAM_USERNAME cannot be the same as INSTAGRAM_USERNAME'
      );
    }
  }

  private static validateCronSchedule(config: BotConfig): void {
    const schedule = config.cron.schedule;

    // Basic cron format validation (5 or 6 fields)
    const parts = schedule.split(' ');
    if (parts.length !== 5 && parts.length !== 6) {
      this.ERRORS.push('CRON_SCHEDULE invalid format (should be 5 or 6 fields)');
    }

    // Warn about aggressive schedules
    if (this.isAggressiveSchedule(schedule)) {
      this.ERRORS.push(
        'WARNING: CRON_SCHEDULE is very frequent (high ban risk). Consider running less often.'
      );
    }
  }

  private static validateProxyConfig(config: BotConfig): void {
    if (!config.proxy.enabled) return;

    if (!config.proxy.server) {
      this.ERRORS.push('USE_PROXY is true but PROXY_SERVER is not set');
    }

    if (config.proxy.server && !this.isValidProxyUrl(config.proxy.server)) {
      this.ERRORS.push('PROXY_SERVER has invalid format');
    }

    // If username is set, password should be too
    if (config.proxy.username && !config.proxy.password) {
      this.ERRORS.push('PROXY_USERNAME is set but PROXY_PASSWORD is missing');
    }
  }

  private static validateSecuritySettings(config: BotConfig): void {
    const { minDelay, maxDelay } = config.security;

    if (minDelay < 0) {
      this.ERRORS.push('MIN_DELAY cannot be negative');
    }

    if (maxDelay < minDelay) {
      this.ERRORS.push('MAX_DELAY must be greater than MIN_DELAY');
    }

    // Warn about very short delays (high detection risk)
    if (minDelay < 500) {
      this.ERRORS.push(
        'WARNING: MIN_DELAY is very short (<500ms). This increases bot detection risk.'
      );
    }

    if (config.browser.timeout < 10000) {
      this.ERRORS.push(
        'WARNING: BROWSER_TIMEOUT is very short (<10s). This may cause failures.'
      );
    }
  }

  private static checkCommonMistakes(config: BotConfig): void {
    // Check for example/test values
    const commonTestValues = [
      'test',
      'example',
      'demo',
      'sample',
      'placeholder',
      'your_',
      'my_',
    ];

    const allValues = [
      config.instagram.username,
      config.instagram.password,
      config.instagram.targetUsername,
      config.twitter.apiKey,
      config.twitter.apiSecret,
      config.twitter.accessToken,
      config.twitter.accessSecret,
    ];

    for (const value of allValues) {
      if (value) {
        const lowerValue = value.toLowerCase();
        for (const testValue of commonTestValues) {
          if (lowerValue.includes(testValue)) {
            this.ERRORS.push(
              `Found test/placeholder value containing "${testValue}". Please use real credentials.`
            );
            break;
          }
        }
      }
    }
  }

  // Helper methods
  private static isPlaceholder(value: string): boolean {
    if (!value) return true;

    const placeholders = [
      'your_',
      'my_',
      'placeholder',
      'example',
      'test',
      'demo',
      'sample',
      'xxx',
      'change_me',
      'replace_me',
      'todo',
    ];

    const lowerValue = value.toLowerCase();
    return placeholders.some((p) => lowerValue.includes(p));
  }

  private static isValidInstagramUsername(username: string): boolean {
    // Instagram usernames: alphanumeric, dots, underscores, 1-30 chars
    return /^[a-zA-Z0-9._]{1,30}$/.test(username);
  }

  private static isValidApiKey(key: string): boolean {
    // API keys are typically alphanumeric with possible dashes/underscores
    return /^[a-zA-Z0-9_-]{20,}$/.test(key);
  }

  private static isValidProxyUrl(url: string): boolean {
    // Basic proxy URL validation
    return /^(http|https|socks4|socks5):\/\/.+:\d+$/.test(url);
  }

  private static containsSensitiveKeywords(value: string): boolean {
    const sensitive = ['password', 'secret', 'key', 'token', 'api'];
    const lowerValue = value.toLowerCase();
    return sensitive.some((s) => lowerValue.includes(s));
  }

  private static isAggressiveSchedule(schedule: string): boolean {
    // Check if schedule runs more than once per hour
    // Simple heuristic: if first field (minutes) contains */X where X < 60
    // or second field (hours) contains */1 or */2
    const parts = schedule.split(' ');

    // Check minute field
    if (parts[0].includes('*/')) {
      const interval = parseInt(parts[0].split('*/')[1]);
      if (interval < 60) return true;
    }

    // Check hour field
    if (parts[1].includes('*/')) {
      const interval = parseInt(parts[1].split('*/')[1]);
      if (interval <= 2) return true;
    }

    return false;
  }
}
