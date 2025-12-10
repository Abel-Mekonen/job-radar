import { v4 as uuidv4 } from 'uuid';
import { BaseBoardScraper } from './base';
import { JobScrapeQuery, ScrapedJob, ScrapeProgressEvent } from './types';

export class IndeedScraper extends BaseBoardScraper {
  name = 'indeed';

  async scrape(
    query: JobScrapeQuery,
    onProgress?: (event: Partial<ScrapeProgressEvent>) => void
  ): Promise<ScrapedJob[]> {
    const results: ScrapedJob[] = [];
    const maxJobs = query.maxJobsPerBoard || 25;

    onProgress?.({
      board: 'indeed',
      stage: 'navigating',
      message: `Starting Indeed scrape for "${query.keywords}"...`,
      jobsFound: 0,
    });

    const { context, page } = await this.createStealthContext(query, 'indeed');

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('q', query.keywords);
      if (query.location) {
        searchParams.set('l', query.location);
      }
      if (query.postedWithinDays) {
        searchParams.set('fromage', String(query.postedWithinDays));
      }

      const searchUrl = `https://www.indeed.com/jobs?${searchParams.toString()}`;

      onProgress?.({
        board: 'indeed',
        stage: 'navigating',
        message: `Navigating to Indeed: ${searchUrl}`,
        jobsFound: 0,
      });

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      await this.randomDelay(2000, 3500);

      // Check anti-bot / Cloudflare
      const cfCleared = await this.detectAndMitigateCloudflare(page, onProgress);
      if (!cfCleared) {
        onProgress?.({
          board: 'indeed',
          stage: 'bypassing_checks',
          message: 'Indeed challenged with verification. Trying to extract from DOM snapshot...',
        });
      }

      // Close email subscription popup if any
      try {
        const closePopup = await page.$('button[aria-label="close"], button.icl-CloseButton');
        if (closePopup) {
          await closePopup.click();
          await this.randomDelay(500, 1000);
        }
      } catch {}

      await this.humanScroll(page, 3);
      await this.randomDelay(1500, 2500);

      // Extract job cards
      const jobCards = await page.$$(
        'div.job_seen_beacon, div.cardOutline, td.resultContent, div[data-jk]'
      );

      onProgress?.({
        board: 'indeed',
        stage: 'extracting',
        message: `Found ${jobCards.length} potential listings on Indeed. Parsing listings...`,
        jobsFound: 0,
      });

      for (const card of jobCards) {
        if (results.length >= maxJobs) break;

        try {
          // Title
          const titleEl = await card.$(
            'h2.jobTitle span, a.jcs-JobTitle span, h2.jobTitle a, [data-testid="job-title"]'
          );
          const title = this.cleanText(await titleEl?.innerText());
          if (!title || title.toLowerCase() === 'new') continue;

          // Company
          const companyEl = await card.$(
            '[data-testid="company-name"], span.companyName, span.css-63koeb'
          );
          const company = this.cleanText(await companyEl?.innerText()) || 'Unknown Employer';

          // Location
          const locationEl = await card.$(
            '[data-testid="text-location"], div.companyLocation, div.css-1p0sjhy'
          );
          const location = this.cleanText(await locationEl?.innerText()) || query.location || 'United States';

          // Salary
          const salaryEl = await card.$(
            '.salary-snippet-container, [data-testid="attribute_snippet_testid"], div.metadata'
          );
          const salary = this.cleanText(await salaryEl?.innerText()) || undefined;

          // Snippet
          const snippetEl = await card.$('.job-snippet, table.jobCardShelfContainer, ul.css-9446fg');
          const snippet = this.cleanText(await snippetEl?.innerText()) || `${title} position at ${company}.`;

          // Link & JK
          const linkEl = await card.$('a.jcs-JobTitle, a[data-jk]');
          const jk = (await linkEl?.getAttribute('data-jk')) || (await card.getAttribute('data-jk'));
          const href = await linkEl?.getAttribute('href');

          let url = searchUrl;
          if (jk) {
            url = `https://www.indeed.com/viewjob?jk=${jk}`;
          } else if (href) {
            url = href.startsWith('http') ? href : `https://www.indeed.com${href}`;
          }

          const isRemote =
            Boolean(query.isRemoteOnly) ||
            title.toLowerCase().includes('remote') ||
            location.toLowerCase().includes('remote') ||
            snippet.toLowerCase().includes('remote');

          const tags: string[] = ['Indeed'];
          if (isRemote) tags.push('Remote');
          if (salary) tags.push('Salary Listed');

          results.push({
            id: uuidv4(),
            title,
            company,
            location,
            isRemote,
            salary,
            source: 'indeed',
            url,
            description: snippet,
            postedAt: new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            status: 'discovered',
            tags,
          });

          onProgress?.({
            board: 'indeed',
            stage: 'extracting',
            message: `Extracted Indeed: ${title} @ ${company}`,
            jobsFound: results.length,
          });
        } catch {
          // Skip card parsing error
        }
      }

      onProgress?.({
        board: 'indeed',
        stage: 'finished',
        message: `Completed Indeed scrape: ${results.length} jobs retrieved.`,
        jobsFound: results.length,
      });

      return results;
    } catch (err: any) {
      onProgress?.({
        board: 'indeed',
        stage: 'error',
        message: `Indeed scrape error: ${err.message}`,
        jobsFound: results.length,
      });
      return results;
    } finally {
      await context.close().catch(() => {});
    }
  }
}
