import pRetry, { AbortError } from 'p-retry';
import { logger } from './logger';
import { config } from '../config';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  taskName: string = 'Task'
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 2000,
    maxTimeout = 10000,
    factor = 2,
  } = options;

  return pRetry(
    async () => {
      try {
        return await fn();
      } catch (error) {
        logger.warn(`${taskName} failed, will retry...`, { error });

        // Don't retry on certain errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();

          // Authentication errors shouldn't be retried
          if (
            message.includes('authentication') ||
            message.includes('login failed') ||
            message.includes('invalid credentials') ||
            message.includes('2fa') ||
            message.includes('two-factor')
          ) {
            logger.error(`${taskName} failed with auth error, aborting retries`);
            throw new AbortError(error);
          }
        }

        throw error;
      }
    },
    {
      retries,
      minTimeout,
      maxTimeout,
      factor,
      onFailedAttempt: (error) => {
        logger.warn(
          `${taskName} attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      },
    }
  );
}

export function randomDelay(min?: number, max?: number): Promise<void> {
  const minDelay = min ?? config.security.minDelay;
  const maxDelay = max ?? config.security.maxDelay;
  const delayMs = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  logger.debug(`Waiting ${delayMs}ms...`);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export function delay(ms: number): Promise<void> {
  logger.debug(`Waiting ${ms}ms...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
