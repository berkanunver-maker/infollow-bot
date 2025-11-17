import dotenv from 'dotenv';
import path from 'path';
import { BotConfig } from './types';

// Lazy load config to avoid requiring .env for unit tests
let _configCache: BotConfig | null = null;
let _dotenvLoaded = false;

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue!;
};

const loadConfig = (): BotConfig => {
  // Load .env file only once
  if (!_dotenvLoaded) {
    dotenv.config();
    _dotenvLoaded = true;
  }

  return {
    instagram: {
      username: getEnvVar('INSTAGRAM_USERNAME'),
      password: getEnvVar('INSTAGRAM_PASSWORD'),
      targetUsername: getEnvVar('TARGET_INSTAGRAM_USERNAME'),
    },
    twitter: {
      apiKey: getEnvVar('TWITTER_API_KEY'),
      apiSecret: getEnvVar('TWITTER_API_SECRET'),
      accessToken: getEnvVar('TWITTER_ACCESS_TOKEN'),
      accessSecret: getEnvVar('TWITTER_ACCESS_SECRET'),
    },
    cron: {
      schedule: getEnvVar('CRON_SCHEDULE', '0 */6 * * *'),
    },
    paths: {
      dataDir: path.resolve(getEnvVar('DATA_DIR', './data')),
      snapshotsDir: path.resolve(getEnvVar('SNAPSHOTS_DIR', './data/snapshots')),
      screenshotsDir: path.resolve(getEnvVar('SCREENSHOTS_DIR', './data/screenshots')),
      logDir: path.resolve(getEnvVar('LOG_DIR', './logs')),
    },
    browser: {
      headless: getEnvVar('HEADLESS', 'true') === 'true',
      timeout: parseInt(getEnvVar('BROWSER_TIMEOUT', '60000'), 10),
    },
    logging: {
      level: getEnvVar('LOG_LEVEL', 'info'),
    },
    proxy: {
      enabled: getEnvVar('USE_PROXY', 'false') === 'true',
      server: process.env.PROXY_SERVER || '',
      username: process.env.PROXY_USERNAME || '',
      password: process.env.PROXY_PASSWORD || '',
    },
    security: {
      useStealthMode: getEnvVar('USE_STEALTH_MODE', 'true') === 'true',
      useSessionPersistence: getEnvVar('USE_SESSION_PERSISTENCE', 'true') === 'true',
      minDelay: parseInt(getEnvVar('MIN_DELAY', '1000'), 10),
      maxDelay: parseInt(getEnvVar('MAX_DELAY', '3000'), 10),
    },
  };
};

// Lazy-loading getter
export const getConfig = (): BotConfig => {
  if (!_configCache) {
    _configCache = loadConfig();
  }
  return _configCache;
};

// Export config using Proxy for lazy loading while maintaining TypeScript compatibility
export const config = new Proxy({} as BotConfig, {
  get: (target, prop) => {
    const cfg = getConfig();
    return (cfg as any)[prop];
  }
});
