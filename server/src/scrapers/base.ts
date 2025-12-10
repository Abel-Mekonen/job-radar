import path from 'path';
import fs from 'fs';
import { BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import { JobScrapeQuery, ScrapeProgressEvent } from './types';

// Register the stealth plugin with playwright-extra
chromium.use(stealthPlugin());

export abstract class BaseBoardScraper {
  abstract name: string;
  protected profileDir: string;

  constructor() {
    this.profileDir = path.resolve(__dirname, '../../data/profiles');
    if (!fs.existsSync(this.profileDir)) {
      fs.mkdirSync(this.profileDir, { recursive: true });
    }
  }

  /**
   * Creates a hardened, stealth-enabled persistent Playwright context
   */
  async createStealthContext(query: JobScrapeQuery, boardName: string): Promise<{ context: BrowserContext; page: Page }> {
    const boardProfileDir = path.join(this.profileDir, boardName);
    if (!fs.existsSync(boardProfileDir)) {
      fs.mkdirSync(boardProfileDir, { recursive: true });
    }

    const isHeadless = query.headless !== undefined ? query.headless : true;

    const launchArgs = [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-infobars',
      '--window-position=0,0',
      '--window-size=1440,900',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--lang=en-US,en',
    ];

    const proxy = query.proxyUrl
      ? {
          server: query.proxyUrl,
        }
      : undefined;

    const context = await chromium.launchPersistentContext(boardProfileDir, {
      headless: isHeadless,
      args: launchArgs,
      proxy,
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
      colorScheme: 'light',
      acceptDownloads: false,
    });

    // Extra runtime evasion scripts
    await context.addInitScript(() => {
      // Hide navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // Emulate window.chrome
      // @ts-ignore
      window.chrome = {
        runtime: {},
        loadTimes: () => {},
        csi: () => {},
        app: {},
      };

      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });

      // Mock plugins length
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Upgrade-Insecure-Requests': '1',
    });

    return { context, page };
  }

  /**
   * Generates a realistic humanized delay with slight jitter
   */
  async randomDelay(minMs: number = 800, maxMs: number = 2200): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Humanized mouse scroll with gradual wheel steps and micro-pauses
   */
  async humanScroll(page: Page, totalScrolls: number = 3): Promise<void> {
    for (let i = 0; i < totalScrolls; i++) {
      const scrollAmount = Math.floor(Math.random() * 350) + 250;
      await page.mouse.wheel(0, scrollAmount);
      await this.randomDelay(400, 900);
    }
  }

  /**
   * Detects Cloudflare Turnstile, Bot Management, or Datadome challenge blocks
   */
  async detectAndMitigateCloudflare(
    page: Page,
    onProgress?: (event: Partial<ScrapeProgressEvent>) => void
  ): Promise<boolean> {
    try {
      const title = (await page.title()).toLowerCase();
      const content = await page.content();

      const isChallenge =
        title.includes('just a moment') ||
        title.includes('cloudflare') ||
        title.includes('attention required') ||
        content.includes('cf-turnstile') ||
        content.includes('challenges.cloudflare.com') ||
        content.includes('challenge-platform') ||
        content.includes('Verify you are human');

      if (isChallenge) {
        onProgress?.({
          stage: 'bypassing_checks',
          message: 'Cloudflare / Bot challenge detected. Engaging stealth solver heuristics...',
          isCloudflareChallenge: true,
        });

        // 1. Wait a moment for automated JS verification challenges to resolve themselves
        await this.randomDelay(3000, 5000);

        // 2. Check for Turnstile checkbox iframes
        const turnstileFrame = page.frames().find(
          (f) => f.url().includes('cloudflare.com') || f.url().includes('turnstile')
        );

        if (turnstileFrame) {
          try {
            const checkbox = await turnstileFrame.$('input[type="checkbox"], .ctp-checkbox-label');
            if (checkbox) {
              await this.randomDelay(1000, 2000);
              await checkbox.click({ delay: Math.floor(Math.random() * 100) + 50 });
              onProgress?.({
                stage: 'bypassing_checks',
                message: 'Turnstile checkbox targeted and clicked with natural timing.',
              });
            }
          } catch {
            // Checkbox interaction might be guarded or shadow DOM; proceed to wait
          }
        }

        // Wait up to 10 seconds for clearance
        for (let i = 0; i < 5; i++) {
          await this.randomDelay(1500, 2000);
          const currentTitle = (await page.title()).toLowerCase();
          if (!currentTitle.includes('just a moment') && !currentTitle.includes('attention required')) {
            onProgress?.({
              stage: 'bypassing_checks',
              message: 'Successfully bypassed Cloudflare challenge! Session token cached.',
            });
            return true;
          }
        }

        onProgress?.({
          stage: 'bypassing_checks',
          message: 'Challenge still active. Proceeding with best-effort content extraction.',
        });
        return false;
      }

      return true;
    } catch (err: any) {
      return false;
    }
  }

  /**
   * Helper to clean and format extracted text
   */
  cleanText(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }
}
