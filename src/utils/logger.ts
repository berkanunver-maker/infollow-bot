import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../config';

let _loggerInstance: winston.Logger | null = null;

const createLogger = (): winston.Logger => {
  const config = getConfig();

  // Ensure log directory exists
  if (!fs.existsSync(config.paths.logDir)) {
    fs.mkdirSync(config.paths.logDir, { recursive: true });
  }

  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  );

  return winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports: [
      new winston.transports.File({
        filename: path.join(config.paths.logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(config.paths.logDir, 'combined.log'),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
      }),
      new winston.transports.Console({
        format: consoleFormat,
      }),
    ],
  });
};

// Lazy-loading logger instance
export const getLogger = (): winston.Logger => {
  if (!_loggerInstance) {
    _loggerInstance = createLogger();
  }
  return _loggerInstance;
};

// Export logger using Proxy for lazy loading while maintaining TypeScript compatibility
export const logger = new Proxy({} as winston.Logger, {
  get: (target, prop) => {
    const loggerInstance = getLogger();
    const value = (loggerInstance as any)[prop];
    return typeof value === 'function' ? value.bind(loggerInstance) : value;
  }
});

export default logger;
