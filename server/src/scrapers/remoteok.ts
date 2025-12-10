import { v4 as uuidv4 } from 'uuid';
import { BaseBoardScraper } from './base';
import { JobScrapeQuery, ScrapedJob, ScrapeProgressEvent } from './types';

export class RemoteOKScraper extends BaseBoardScraper {
  name = 'remoteok';

  async scrape(
    query: JobScrapeQuery,
    onProgress?: (event: Partial<ScrapeProgressEvent>) => void
  ): Promise<ScrapedJob[]> {
    const results: ScrapedJob[] = [];
    const maxJobs = query.maxJobsPerBoard || 25;

    onProgress?.({
      board: 'remoteok',
      stage: 'navigating',
      message: `Starting RemoteOK scrape for "${query.keywords}"...`,
      jobsFound: 0,
    });

    const { context, page } = await this.createStealthContext(query, 'remoteok');

    try {
      const searchUrl = `https://remoteok.com/remote-${encodeURIComponent(query.keywords.toLowerCase().replace(/\s+/g, '-'))}-jobs`;

      onProgress?.({
        board: 'remoteok',
        stage: 'navigating',
        message: `Navigating to RemoteOK: ${searchUrl}`,
        jobsFound: 0,
      });

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 40000,
      });

      await this.randomDelay(2000, 3000);
      await this.detectAndMitigateCloudflare(page, onProgress);
      await this.humanScroll(page, 2);

      // Extract job rows
      const rows = await page.$$('tr.job, table#jobsboard tr[data-id]');

      onProgress?.({
        board: 'remoteok',
        stage: 'extracting',
        message: `Found ${rows.length} listings on RemoteOK. Extracting details...`,
        jobsFound: 0,
      });

      for (const row of rows) {
        if (results.length >= maxJobs) break;

        try {
          // Check if expandable/closed
          const titleEl = await row.$('h2[itemprop="title"], h2');
          const title = this.cleanText(await titleEl?.innerText());
          if (!title) continue;

          const companyEl = await row.$('h3[itemprop="name"], h3');
          const company = this.cleanText(await companyEl?.innerText()) || 'Remote Company';

          const locationEl = await row.$('.location');
          const location = this.cleanText(await locationEl?.innerText()) || 'Remote / Worldwide';

          // Extract tags
          const tagEls = await row.$$('.action-tag h3, .tag h3, .tag');
          const tags: string[] = ['RemoteOK', 'Remote'];
          for (const t of tagEls) {
            const tagText = this.cleanText(await t.innerText());
            if (tagText && !tags.includes(tagText) && tags.length < 6) {
              tags.push(tagText);
            }
          }

          // Extract salary
          const salaryMatch = location.match(/\$[\d,kK]+(?:\s*-\s*\$[\d,kK]+)?/);
          const salary = salaryMatch ? salaryMatch[0] : undefined;

          // URL
          const linkEl = await row.$('a[itemprop="url"], a.preventLink');
          let href = await linkEl?.getAttribute('href');
          let jobUrl = searchUrl;
          if (href) {
            jobUrl = href.startsWith('http') ? href : `https://remoteok.com${href}`;
          }

          results.push({
            id: uuidv4(),
            title,
            company,
            location: location.replace(salary || '', '').trim() || 'Worldwide',
            isRemote: true,
            salary,
            source: 'remoteok',
            url: jobUrl,
            description: `${title} at ${company}. 100% Remote position. Tags: ${tags.join(', ')}`,
            postedAt: new Date().toISOString(),
            discoveredAt: new Date().toISOString(),
            status: 'discovered',
            tags,
          });

          onProgress?.({
            board: 'remoteok',
            stage: 'extracting',
            message: `Extracted RemoteOK: ${title} @ ${company}`,
            jobsFound: results.length,
          });
        } catch {}
      }

      // If page had no results, attempt direct RemoteOK JSON API fallback
      if (results.length === 0) {
        onProgress?.({
          board: 'remoteok',
          stage: 'extracting',
          message: 'Trying RemoteOK structured endpoint fallback...',
          jobsFound: 0,
        });

        try {
          const apiResponse = await page.evaluate(async (kw) => {
            const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(kw.toLowerCase())}`, {
              headers: { Accept: 'application/json' },
            });
            if (!res.ok) return [];
            return await res.json();
          }, query.keywords);

          if (Array.isArray(apiResponse)) {
            // First item in RemoteOK API is legal disclaimer object
            const validJobs = apiResponse.filter((item: any) => item.position && item.company);
            for (const item of validJobs) {
              if (results.length >= maxJobs) break;
              results.push({
                id: uuidv4(),
                title: item.position,
                company: item.company,
                location: item.location || 'Remote',
                isRemote: true,
                salary: item.salary_min && item.salary_max ? `$${item.salary_min} - $${item.salary_max}` : undefined,
                source: 'remoteok',
                url: item.url || `https://remoteok.com/remote-jobs/${item.id}`,
                description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 300) : `${item.position} at ${item.company}`,
                postedAt: item.date || new Date().toISOString(),
                discoveredAt: new Date().toISOString(),
                status: 'discovered',
                tags: ['RemoteOK', 'Remote', ...(item.tags ? item.tags.slice(0, 4) : [])],
              });
            }
          }
        } catch (apiErr) {
          // ignore API fallback err
        }
      }

      onProgress?.({
        board: 'remoteok',
        stage: 'finished',
        message: `Completed RemoteOK scrape: ${results.length} jobs retrieved.`,
        jobsFound: results.length,
      });

      return results;
    } catch (err: any) {
      onProgress?.({
        board: 'remoteok',
        stage: 'error',
        message: `RemoteOK scrape error: ${err.message}`,
        jobsFound: results.length,
      });
      return results;
    } finally {
      await context.close().catch(() => {});
    }
  }
}
