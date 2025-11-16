import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { logger } from '../utils/logger';
import { config } from '../config';
import { InstagramUser, FollowingSnapshot, ScraperResult } from '../types';
import { format } from 'date-fns';
import path from 'path';
import fs from 'fs';

export class InstagramScraper {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    logger.info('Initializing Instagram scraper...');

    this.browser = await chromium.launch({
      headless: config.browser.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    this.page = await this.context.newPage();
    logger.info('Browser initialized successfully');
  }

  async login(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    logger.info('Logging into Instagram...');

    await this.page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle',
      timeout: config.browser.timeout,
    });

    await this.page.waitForTimeout(2000);

    // Accept cookies if present
    try {
      const cookieButton = this.page.locator('button:has-text("Allow all cookies"), button:has-text("Accept")').first();
      if (await cookieButton.isVisible({ timeout: 5000 })) {
        await cookieButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (e) {
      logger.debug('No cookie banner found');
    }

    // Enter credentials
    await this.page.fill('input[name="username"]', config.instagram.username);
    await this.page.waitForTimeout(500);
    await this.page.fill('input[name="password"]', config.instagram.password);
    await this.page.waitForTimeout(500);

    // Click login button
    await this.page.click('button[type="submit"]');

    // Wait for navigation
    await this.page.waitForURL(/instagram.com\/(?!accounts\/login)/, {
      timeout: config.browser.timeout
    });

    logger.info('Login successful');
    await this.page.waitForTimeout(3000);

    // Handle "Save Your Login Info?" popup
    try {
      const notNowButton = this.page.locator('button:has-text("Not now"), button:has-text("Not Now")').first();
      if (await notNowButton.isVisible({ timeout: 5000 })) {
        await notNowButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (e) {
      logger.debug('No save login info prompt');
    }

    // Handle notifications popup
    try {
      const notifButton = this.page.locator('button:has-text("Not Now")').first();
      if (await notifButton.isVisible({ timeout: 5000 })) {
        await notifButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (e) {
      logger.debug('No notifications prompt');
    }
  }

  async scrapeFollowing(username: string): Promise<ScraperResult> {
    if (!this.page) {
      return { success: false, error: 'Page not initialized' };
    }

    try {
      logger.info(`Scraping following list for @${username}...`);

      // Navigate to profile
      await this.page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: 'networkidle',
        timeout: config.browser.timeout,
      });

      await this.page.waitForTimeout(2000);

      // Click on "following" link
      const followingLink = this.page.locator(`a[href="/${username}/following/"]`).first();
      await followingLink.click();

      await this.page.waitForTimeout(3000);

      // Wait for the dialog to appear
      const dialog = this.page.locator('div[role="dialog"]').first();
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
    } catch (error) {
      logger.error('Error scraping following list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async scrollAndExtractUsers(dialog: any): Promise<InstagramUser[]> {
    if (!this.page) throw new Error('Page not initialized');

    const users: Map<string, InstagramUser> = new Map();
    let previousCount = 0;
    let stableCount = 0;
    const maxStableIterations = 5;

    while (stableCount < maxStableIterations) {
      // Scroll within the dialog
      await dialog.evaluate((el: any) => {
        el.scrollTo(0, el.scrollHeight);
      });

      await this.page.waitForTimeout(1500);

      // Extract user data
      const userElements = await this.page.locator('div[role="dialog"] a[role="link"]').all();

      for (const element of userElements) {
        try {
          const href = await element.getAttribute('href');
          if (!href || !href.includes('instagram.com')) continue;

          const username = href.replace(/^\//, '').replace(/\/$/, '');
          if (!username || username === '' || users.has(username)) continue;

          // Get full name and verified status from the link's parent structure
          const parent = element.locator('xpath=ancestor::div[contains(@class, "x9f619")]').first();

          let fullName = '';
          let isVerified = false;

          try {
            const nameSpan = parent.locator('span').first();
            fullName = await nameSpan.textContent() || '';

            // Check for verified badge
            const verifiedBadge = parent.locator('svg[aria-label*="Verified"]');
            isVerified = await verifiedBadge.count() > 0;
          } catch (e) {
            // Fallback to username if we can't get full name
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

    try {
      logger.info(`Taking screenshot of @${username} profile...`);

      await this.page.goto(`https://www.instagram.com/${username}/`, {
        waitUntil: 'networkidle',
        timeout: config.browser.timeout,
      });

      await this.page.waitForTimeout(2000);

      const timestamp = Date.now();
      const filename = `${username}_${timestamp}.png`;
      const filepath = path.join(config.paths.screenshotsDir, filename);

      // Ensure screenshots directory exists
      if (!fs.existsSync(config.paths.screenshotsDir)) {
        fs.mkdirSync(config.paths.screenshotsDir, { recursive: true });
      }

      await this.page.screenshot({
        path: filepath,
        fullPage: false,
      });

      logger.info(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Error taking screenshot for @${username}:`, error);
      return null;
    }
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
