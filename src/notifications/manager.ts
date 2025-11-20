import { NotificationProvider, FollowEvent, NotificationResult } from '../types/notifications';
import { logger } from '../utils/logger';

/**
 * Centralized notification manager
 * Manages all notification providers and handles graceful degradation
 */
export class NotificationManager {
  private providers: NotificationProvider[] = [];

  /**
   * Register a notification provider
   */
  register(provider: NotificationProvider): void {
    this.providers.push(provider);
    logger.info(`Registered notification provider: ${provider.name}`);
  }

  /**
   * Get all registered providers
   */
  getProviders(): NotificationProvider[] {
    return this.providers;
  }

  /**
   * Get enabled providers
   */
  getEnabledProviders(): NotificationProvider[] {
    return this.providers.filter((p) => p.isEnabled());
  }

  /**
   * Validate all enabled providers
   */
  validateAll(): { valid: boolean; errors: string[] } {
    const allErrors: string[] = [];

    for (const provider of this.providers) {
      if (provider.isEnabled()) {
        const validation = provider.validateConfig();
        if (!validation.valid) {
          allErrors.push(`${provider.name}: ${validation.errors.join(', ')}`);
        }
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Send notification to all enabled providers
   * Uses graceful degradation - if one fails, others continue
   */
  async sendToAll(event: FollowEvent): Promise<NotificationResult[]> {
    const enabledProviders = this.getEnabledProviders();

    if (enabledProviders.length === 0) {
      logger.warn('No notification providers enabled');
      return [];
    }

    logger.info(
      `Sending notification to ${enabledProviders.length} provider(s): ${enabledProviders.map((p) => p.name).join(', ')}`
    );

    const results: NotificationResult[] = [];

    // Send to all providers in parallel
    const promises = enabledProviders.map(async (provider) => {
      try {
        const result = await provider.send(event);
        logger.info(`${provider.name}: ${result.success ? 'Success' : 'Failed'}`);
        return result;
      } catch (error: any) {
        logger.error(`${provider.name} failed:`, error);
        return {
          provider: provider.name,
          success: false,
          error: error.message || 'Unknown error',
        };
      }
    });

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          provider: 'Unknown',
          success: false,
          error: result.reason?.message || 'Promise rejected',
        });
      }
    }

    // Log summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    logger.info(
      `Notification summary: ${successCount} succeeded, ${failCount} failed out of ${results.length}`
    );

    return results;
  }

  /**
   * Send to specific provider
   */
  async sendToProvider(
    providerName: string,
    event: FollowEvent
  ): Promise<NotificationResult | null> {
    const provider = this.providers.find((p) => p.name === providerName);

    if (!provider) {
      logger.error(`Provider not found: ${providerName}`);
      return null;
    }

    if (!provider.isEnabled()) {
      logger.warn(`Provider disabled: ${providerName}`);
      return {
        provider: providerName,
        success: false,
        error: 'Provider is disabled',
      };
    }

    try {
      return await provider.send(event);
    } catch (error: any) {
      logger.error(`${providerName} failed:`, error);
      return {
        provider: providerName,
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
