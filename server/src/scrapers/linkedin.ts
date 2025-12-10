import { v4 as uuidv4 } from 'uuid';
import { BaseBoardScraper } from './base';
import { JobScrapeQuery, ScrapedJob, ScrapeProgressEvent } from './types';

export class LinkedInScraper extends BaseBoardScraper {
  name = 'linkedin';

  async scrape(
    query: JobScrapeQuery,
    onProgress?: (event: Partial<ScrapeProgressEvent>) => void
  ): Promise<ScrapedJob[]> {
    const results: ScrapedJob[] = [];
    const maxJobs = query.maxJobsPerBoard || 25;

    onProgress?.({
      board: 'linkedin',
      stage: 'navigating',
      message: `Starting LinkedIn scrape for "${query.keywords}"...`,
      jobsFound: 0,
    });

    const { context, page } = await this.createStealthContext(query, 'linkedin');

    try {
      // Build search URL
      const searchParams = new URLSearchParams();
      searchParams.set('keywords', query.keywords);
      if (query.location) {
        searchParams.set('location', query.location);
      }
      if (query.isRemoteOnly) {
        searchParams.set('f_WT', '2'); // LinkedIn remote filter
      }
      if (query.postedWithinDays) {
        // LinkedIn time filter: r86400 (past 24h), r604800 (past week), r2592000 (past month)
        if (query.postedWithinDays <= 1) searchParams.set('f_TPR', 'r86400');
        else if (query.postedWithinDays <= 7) searchParams.set('f_TPR', 'r604800');
        else searchParams.set('f_TPR', 'r2592000');
      }

      const searchUrl = `https://www.linkedin.com/jobs/search?${searchParams.toString()}`;

      onProgress?.({
        board: 'linkedin',
        stage: 'navigating',
        message: `Navigating to LinkedIn Job Search: ${searchUrl}`,
        jobsFound: 0,
      });

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      await this.randomDelay(1500, 2500);

      // Check anti-bot / Cloudflare
      await this.detectAndMitigateCloudflare(page, onProgress);

      // Handle sign-in modal/banner if it appears
      try {
        const dismissBtn = await page.$('button[data-tracking-control-name="public_jobs_contextual-sign-in-modal_modal_dismiss"]');
        if (dismissBtn) {
          await dismissBtn.click();
          await this.randomDelay(500, 1000);
        }
      } catch {}

      onProgress?.({
        board: 'linkedin',
        stage: 'extracting',
        message: 'Parsing LinkedIn search results page...',
        jobsFound: 0,
      });

      // Scroll to trigger lazy loading
      let scrollCycles = 0;
      while (scrollCycles < 4 && results.length < maxJobs) {
        await this.humanScroll(page, 2);
        await this.randomDelay(1000, 1800);

        // Click "See more jobs" if present
        try {
          const showMoreBtn = await page.$('button.infinite-scroller__show-more-button, button[aria-label="See more jobs"]');
          if (showMoreBtn && (await showMoreBtn.isVisible())) {
            await showMoreBtn.click();
            await this.randomDelay(1200, 2000);
          }
        } catch {}

        scrollCycles++;
      }

      // Extract job cards
      const jobCards = await page.$$('ul.jobs-search__results-list > li, div.base-card');

      onProgress?.({
        board: 'linkedin',
        stage: 'extracting',
        message: `Found ${jobCards.length} potential job listings on LinkedIn. Processing cards...`,
        jobsFound: results.length,
      });

      for (const card of jobCards) {
        if (results.length >= maxJobs) break;

        try {
          // Title
          const titleEl = await card.$('.base-search-card__title, .job-search-card__title, h3');
          const title = this.cleanText(await titleEl?.innerText());
          if (!title) continue;

          // Company
          const companyEl = await card.$('.base-search-card__subtitle, .job-search-card__subtitle, h4');
          const company = this.cleanText(await companyEl?.innerText()) || 'Unknown Company';

          // Location
          const locationEl = await card.$('.job-search-card__location');
          const location = this.cleanText(await locationEl?.innerText()) || query.location || 'Remote / Unspecified';

          // Link & URL
          const linkEl = await card.$('a.base-card__full-link, a.job-search-card__url, a[data-tracking-control-name]');
          let rawUrl = (await linkEl?.getAttribute('href')) || '';
          if (rawUrl && !rawUrl.startsWith('http')) {
            rawUrl = `https://www.linkedin.com${rawUrl}`;
          }
          // Strip tracking parameters
          const cleanUrl = rawUrl.split('?')[0] || rawUrl;

          // Date posted
          const dateEl = await card.$('time');
          const postedText = this.cleanText(await dateEl?.innerText()) || 'Recently';
          const postedDatetime = (await dateEl?.getAttribute('datetime')) || new Date().toISOString();

          // Remote check
          const isRemote =
            Boolean(query.isRemoteOnly) ||
            title.toLowerCase().includes('remote') ||
            location.toLowerCase().includes('remote');

          // Snippet / tags
          const tags: string[] = ['LinkedIn'];
          if (isRemote) tags.push('Remote');
          if (title.toLowerCase().includes('senior')) tags.push('Senior');
          if (title.toLowerCase().includes('lead')) tags.push('Lead');
          if (title.toLowerCase().includes('junior') || title.toLowerCase().includes('entry')) tags.push('Entry Level');

          results.push({
            id: uuidv4(),
            title,
            company,
            location,
            isRemote,
            salary: undefined,
            source: 'linkedin',
            url: cleanUrl || searchUrl,
            description: `${title} at ${company} in ${location}. Posted ${postedText}. Apply directly via LinkedIn.`,
            postedAt: postedDatetime,
            discoveredAt: new Date().toISOString(),
            status: 'discovered',
            tags,
          });

          onProgress?.({
            board: 'linkedin',
            stage: 'extracting',
            message: `Extracted: ${title} @ ${company}`,
            jobsFound: results.length,
          });
        } catch {
          // Skip card parsing error
        }
      }

      onProgress?.({
        board: 'linkedin',
        stage: 'finished',
        message: `Completed LinkedIn scrape: ${results.length} jobs retrieved.`,
        jobsFound: results.length,
      });

      return results;
    } catch (err: any) {
      onProgress?.({
        board: 'linkedin',
        stage: 'error',
        message: `LinkedIn scrape error: ${err.message}`,
        jobsFound: results.length,
      });
      return results;
    } finally {
      await context.close().catch(() => {});
    }
  }
}
