import dotenv from 'dotenv';
import path from 'path';
import { BotConfig } from './types';

dotenv.config();

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue!;
};

export const config: BotConfig = {
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
    server: getEnvVar('PROXY_SERVER', ''),
    username: getEnvVar('PROXY_USERNAME', ''),
    password: getEnvVar('PROXY_PASSWORD', ''),
  },
  security: {
    useStealthMode: getEnvVar('USE_STEALTH_MODE', 'true') === 'true',
    useSessionPersistence: getEnvVar('USE_SESSION_PERSISTENCE', 'true') === 'true',
    minDelay: parseInt(getEnvVar('MIN_DELAY', '1000'), 10),
    maxDelay: parseInt(getEnvVar('MAX_DELAY', '3000'), 10),
  },
};
