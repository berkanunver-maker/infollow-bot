import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { logger } from '../utils/logger';
import { config } from '../config';
import { InstagramUser, FollowingSnapshot, ScraperResult } from '../types';
import { SessionManager } from '../utils/session';
import { randomDelay, delay, withRetry } from '../utils/retry';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

export class InstagramSecureScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private sessionManager: SessionManager;

  constructor() {
    this.sessionManager = new SessionManager();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Instagram scraper with security features...');

    this.browser = await chromium.launch({
      headless: config.browser.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
      ],
    });

    // Create context with realistic browser fingerprint
    const contextOptions: any = {
      viewport: { width: 1920, height: 1080 },
      userAgent: this.getRandomUserAgent(),
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: [],
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    };

    // Add proxy if enabled
    if (config.proxy.enabled && config.proxy.server) {
      logger.info(`Using proxy: ${config.proxy.server}`);
      contextOptions.proxy = {
        server: config.proxy.server,
        ...(config.proxy.username && config.proxy.password && {
          username: config.proxy.username,
          password: config.proxy.password,
        }),
      };
    }

    this.context = await this.browser.newContext(contextOptions);

    // Add stealth scripts to hide automation
    await this.context.addInitScript(`
      // Override navigator.webdriver
      Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
        get: () => undefined,
      });

      // Override plugins
      Object.defineProperty(Object.getPrototypeOf(navigator), 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(Object.getPrototypeOf(navigator), 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Remove automation hints
      window.chrome = {
        runtime: {},
      };
    `);

    this.page = await this.context.newPage();
    logger.info('Browser initialized with stealth mode');
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async login(): Promise<void> {
    if (!this.page || !this.context) throw new Error('Browser not initialized');

    logger.info('Attempting to login to Instagram...');

    // Try to load existing session first
    const sessionLoaded = await this.sessionManager.loadSession(this.context);

    if (sessionLoaded) {
      logger.info('Checking if session is still valid...');

      await this.page.goto('https://www.instagram.com/', {
        waitUntil: 'networkidle',
        timeout: config.browser.timeout,
      });

      await randomDelay(2000, 4000);

      // Check if we're logged in by looking for profile elements
      const isLoggedIn = await this.isLoggedIn();

      if (isLoggedIn) {
        logger.info('Session is valid, skipping login');
        return;
      } else {
        logger.warn('Session expired, performing fresh login');
        this.sessionManager.clearSession();
      }
    }

    // Perform fresh login
    await this.performLogin();

    // Save session for next time
    await this.sessionManager.saveSession(this.context);
  }

  private async isLoggedIn(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Check for common logged-in elements
      const profileButton = this.page.locator('svg[aria-label="Settings"]').or(
        this.page.locator('a[href*="/accounts/edit/"]')
      );

      return await profileButton.isVisible({ timeout: 5000 });
    } catch {
      return false;
    }
  }

  private async performLogin(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    logger.info('Performing fresh login to Instagram...');

    await this.page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
      timeout: config.browser.timeout,
    });

    await randomDelay(2000, 4000);

    // Accept cookies if present
    try {
      const cookieButton = this.page
        .locator('button:has-text("Allow all cookies"), button:has-text("Accept")')
        .first();
      if (await cookieButton.isVisible({ timeout: 5000 })) {
        await cookieButton.click();
        await randomDelay(1000, 2000);
      }
    } catch (e) {
      logger.debug('No cookie banner found');
    }

    // Wait for login form
    await this.page.waitForSelector('input[name="username"]', {
      timeout: 10000,
    });

    // Type username with human-like delays
    await this.humanType('input[name="username"]', config.instagram.username);
    await randomDelay(500, 1500);

    // Type password with human-like delays
    await this.humanType('input[name="password"]', config.instagram.password);
    await randomDelay(500, 1500);

    // Click login button
    await this.page.click('button[type="submit"]');
    logger.info('Login credentials submitted');

    // Wait for navigation or error
    await randomDelay(3000, 5000);

    // Check for 2FA challenge
    if (await this.check2FA()) {
      throw new Error(
        '2FA/Security challenge detected! Please disable 2FA or handle manually.'
      );
    }

    // Check for error messages
    const errorMessage = await this.page
      .locator('p[data-testid="login-error-message"]')
      .textContent()
      .catch(() => null);

    if (errorMessage) {
      logger.error(`Login error: ${errorMessage}`);
      throw new Error(`Login failed: ${errorMessage}`);
    }

    // Wait for successful login
    try {
      await this.page.waitForURL(/instagram.com\/(?!accounts\/login)/, {
        timeout: config.browser.timeout,
      });
    } catch (error) {
      // Check if we're actually logged in despite timeout
      if (!(await this.isLoggedIn())) {
        throw new Error('Login failed - could not verify successful login');
      }
    }

    logger.info('Login successful');
    await randomDelay(2000, 4000);

    // Handle post-login popups
    await this.handlePostLoginPopups();
  }

  private async check2FA(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Check for various 2FA indicators
      const twoFactorInputs = [
        'input[name="verificationCode"]',
        'input[aria-label*="Security Code"]',
        'input[placeholder*="Security Code"]',
      ];

      for (const selector of twoFactorInputs) {
        if (await this.page.locator(selector).isVisible({ timeout: 2000 })) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private async handlePostLoginPopups(): Promise<void> {
    if (!this.page) return;

    // Handle "Save Your Login Info?" popup
    try {
      const notNowButton = this.page
        .locator('button:has-text("Not now"), button:has-text("Not Now")')
        .first();
      if (await notNowButton.isVisible({ timeout: 5000 })) {
        await notNowButton.click();
        await randomDelay(1000, 2000);
      }
    } catch (e) {
      logger.debug('No save login info prompt');
    }

    // Handle notifications popup
    try {
      const notifButton = this.page
        .locator('button:has-text("Not Now")')
        .first();
      if (await notifButton.isVisible({ timeout: 5000 })) {
        await notifButton.click();
        await randomDelay(1000, 2000);
      }
    } catch (e) {
      logger.debug('No notifications prompt');
    }
  }

  private async humanType(selector: string, text: string): Promise<void> {
    if (!this.page) return;

    const element = this.page.locator(selector);
    await element.click();
    await delay(100);

    // Type with random delays between keystrokes
    for (const char of text) {
      await element.pressSequentially(char, { delay: Math.random() * 100 + 50 });
    }
  }

  async scrapeFollowing(username: string): Promise<ScraperResult> {
    if (!this.page) {
      return { success: false, error: 'Page not initialized' };
    }

    return withRetry(
      async () => {
        logger.info(`Scraping following list for @${username}...`);

        // Navigate to profile
        await this.page!.goto(`https://www.instagram.com/${username}/`, {
          waitUntil: 'networkidle',
          timeout: config.browser.timeout,
        });

        await randomDelay(2000, 4000);

        // Check if profile exists
        if (await this.page!.locator('text=Sorry, this page').isVisible({ timeout: 3000 })) {
          throw new Error(`Profile @${username} not found`);
        }

        // Click on "following" link
        const followingLink = this.page!.locator(`a[href="/${username}/following/"]`).first();

        if (!(await followingLink.isVisible({ timeout: 5000 }))) {
          throw new Error('Following link not found - profile might be private');
        }

        await followingLink.click();
        await randomDelay(2000, 4000);

        // Wait for the dialog to appear
        const dialog = this.page!.locator('div[role="dialog"]').first();
        await dialog.waitFor({ state: 'visible', timeout: 10000 });

        logger.info('Following dialog opened, starting to scroll...');

        // Scroll to load all users
        const users = await this.scrollAndExtractUsers(dialog);

        logger.info(`Successfully scraped ${users.length} following users`);

        const snapshot: FollowingSnapshot = {
          timestamp: Date.now(),
          date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          targetUsername: username,
          followingCount: users.length,
          users,
        };

        return { success: true, snapshot };
      },
      { retries: 2, minTimeout: 3000, maxTimeout: 10000 },
      'Instagram scraping'
    ).catch((error) => {
      logger.error('Error scraping following list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    });
  }

  private async scrollAndExtractUsers(dialog: any): Promise<InstagramUser[]> {
    if (!this.page) throw new Error('Page not initialized');

    const users: Map<string, InstagramUser> = new Map();
    let previousCount = 0;
    let stableCount = 0;
    const maxStableIterations = 5;

    while (stableCount < maxStableIterations) {
      // Scroll within the dialog with random human-like scrolling
      await dialog.evaluate((el: any) => {
        el.scrollTo(0, el.scrollHeight);
      });

      // Random delay to avoid detection
      await randomDelay(1500, 3000);

      // Extract user data
      const userElements = await this.page.locator('div[role="dialog"] a[role="link"]').all();

      for (const element of userElements) {
        try {
          const href = await element.getAttribute('href');
          if (!href || !href.includes('instagram.com')) continue;

          const username = href.replace(/^\//, '').replace(/\/$/, '');
          if (!username || username === '' || users.has(username)) continue;

          const parent = element.locator('xpath=ancestor::div[contains(@class, "x9f619")]').first();

          let fullName = '';
          let isVerified = false;

          try {
            const nameSpan = parent.locator('span').first();
            fullName = (await nameSpan.textContent()) || '';

            const verifiedBadge = parent.locator('svg[aria-label*="Verified"]');
            isVerified = (await verifiedBadge.count()) > 0;
          } catch (e) {
            fullName = username;
          }

          users.set(username, {
            username,
            fullName: fullName || username,
            isVerified,
          });
        } catch (e) {
          logger.debug('Error extracting user data:', e);
        }
      }

      const currentCount = users.size;
      logger.info(`Loaded ${currentCount} users...`);

      if (currentCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      previousCount = currentCount;
    }

    return Array.from(users.values());
  }

  async takeProfileScreenshot(username: string): Promise<string | null> {
    if (!this.page) {
      logger.error('Page not initialized');
      return null;
    }

    return withRetry(
      async () => {
        logger.info(`Taking screenshot of @${username} profile...`);

        await this.page!.goto(`https://www.instagram.com/${username}/`, {
          waitUntil: 'networkidle',
          timeout: config.browser.timeout,
        });

        await randomDelay(2000, 4000);

        const timestamp = Date.now();
        const filename = `${username}_${timestamp}.png`;
        const filepath = path.join(config.paths.screenshotsDir, filename);

        if (!fs.existsSync(config.paths.screenshotsDir)) {
          fs.mkdirSync(config.paths.screenshotsDir, { recursive: true });
        }

        await this.page!.screenshot({
          path: filepath,
          fullPage: false,
        });

        logger.info(`Screenshot saved: ${filepath}`);
        return filepath;
      },
      { retries: 2 },
      'Screenshot capture'
    ).catch((error) => {
      logger.error(`Error taking screenshot for @${username}:`, error);
      return null;
    });
  }

  async close(): Promise<void> {
    logger.info('Closing Instagram scraper...');

    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();

    this.page = null;
    this.context = null;
    this.browser = null;

    logger.info('Scraper closed');
  }
}
