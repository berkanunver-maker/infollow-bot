import { ConfigValidator } from '../validator';
import { BotConfig } from '../../types';

describe('ConfigValidator', () => {
  const createMockConfig = (overrides: Partial<BotConfig> = {}): BotConfig => ({
    instagram: {
      username: 'realuser123',
      password: 'secure_password_123',
      targetUsername: 'targetaccount456',
    },
    twitter: {
      apiKey: 'abcdefghijklmnopqrstuvwxyz12345',
      apiSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
      accessToken: 'abcdefghijklmnopqrstuvwxyz1234567890abcdef',
      accessSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
    },
    cron: {
      schedule: '0 */6 * * *',
    },
    paths: {
      dataDir: './data',
      snapshotsDir: './data/snapshots',
      screenshotsDir: './data/screenshots',
      logDir: './logs',
    },
    browser: {
      headless: true,
      timeout: 60000,
    },
    logging: {
      level: 'info',
    },
    proxy: {
      enabled: false,
      server: '',
      username: '',
      password: '',
    },
    security: {
      useStealthMode: true,
      useSessionPersistence: true,
      minDelay: 1000,
      maxDelay: 3000,
    },
    ...overrides,
  });

  describe('validate', () => {
    it('should pass with valid configuration', () => {
      const config = createMockConfig();
      const result = ConfigValidator.validate(config);

      // Debug: log errors if any
      if (!result.valid) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect placeholder Instagram username', () => {
      const config = createMockConfig({
        instagram: {
          username: 'your_instagram_username',
          password: 'password',
          targetUsername: 'target',
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('INSTAGRAM_USERNAME'))).toBe(true);
    });

    it('should detect placeholder Twitter keys', () => {
      const config = createMockConfig({
        twitter: {
          apiKey: 'your_api_key',
          apiSecret: 'your_api_secret',
          accessToken: 'your_access_token',
          accessSecret: 'your_access_secret',
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('TWITTER_API_KEY'))).toBe(true);
    });

    it('should detect invalid cron schedule', () => {
      const config = createMockConfig({
        cron: {
          schedule: 'invalid cron',
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.errors.some((e) => e.includes('cron') || e.includes('CRON'))).toBe(true);
    });

    it('should detect too short API keys', () => {
      const config = createMockConfig({
        twitter: {
          apiKey: 'short',
          apiSecret: 'short',
          accessToken: 'short',
          accessSecret: 'short',
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid log level', () => {
      const config = createMockConfig({
        logging: {
          level: 'invalid',
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.errors.some((e) => e.includes('log level') || e.includes('LOG_LEVEL'))).toBe(
        true
      );
    });

    it('should detect aggressive cron schedule', () => {
      const config = createMockConfig({
        cron: {
          schedule: '* * * * *', // Every minute
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.errors.some((e) => e.includes('aggressive') || e.includes('frequent'))).toBe(
        true
      );
    });

    it('should detect invalid delay configuration', () => {
      const config = createMockConfig({
        security: {
          useStealthMode: true,
          useSessionPersistence: true,
          minDelay: 5000,
          maxDelay: 1000, // Max less than min
        },
      });
      const result = ConfigValidator.validate(config);
      expect(result.errors.some((e) => e.includes('delay') || e.includes('DELAY'))).toBe(true);
    });
  });

  describe('isPlaceholder', () => {
    it('should detect various placeholder patterns', () => {
      const testCases = [
        'your_api_key',
        'my_password',
        'placeholder_value',
        'example_username',
        'test_key',
        'demo_value',
        'sample_data',
      ];

      testCases.forEach((value) => {
        const config = createMockConfig({
          twitter: { apiKey: value, apiSecret: 'x', accessToken: 'x', accessSecret: 'x' },
        });
        const result = ConfigValidator.validate(config);
        expect(result.errors.some((e) => e.toLowerCase().includes('placeholder'))).toBe(true);
      });
    });
  });
});
