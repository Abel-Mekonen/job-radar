import { v4 as uuidv4 } from 'uuid';
import { BaseBoardScraper } from './base';
import { JobScrapeQuery, ScrapedJob, ScrapeProgressEvent } from './types';

export class WellfoundScraper extends BaseBoardScraper {
  name = 'wellfound';

  async scrape(
    query: JobScrapeQuery,
    onProgress?: (event: Partial<ScrapeProgressEvent>) => void
  ): Promise<ScrapedJob[]> {
    const results: ScrapedJob[] = [];
    const maxJobs = query.maxJobsPerBoard || 25;

    onProgress?.({
      board: 'wellfound',
      stage: 'navigating',
      message: `Starting Wellfound (AngelList) scrape for "${query.keywords}"...`,
      jobsFound: 0,
    });

    const { context, page } = await this.createStealthContext(query, 'wellfound');

    try {
      // Wellfound search URL
      const searchUrl = `https://wellfound.com/jobs?role=${encodeURIComponent(query.keywords)}`;

      onProgress?.({
        board: 'wellfound',
        stage: 'navigating',
        message: `Navigating to Wellfound: ${searchUrl}`,
        jobsFound: 0,
      });

      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      await this.randomDelay(2500, 4000);

      // Cloudflare check
      await this.detectAndMitigateCloudflare(page, onProgress);

      await this.humanScroll(page, 3);
      await this.randomDelay(1500, 2500);

      // Check if __NEXT_DATA__ script is present for direct JSON hydration parsing
      try {
        const nextDataScript = await page.$('script#__NEXT_DATA__');
        if (nextDataScript) {
          const jsonText = await nextDataScript.innerText();
          const nextData = JSON.parse(jsonText);
          const rawListings =
            nextData?.props?.pageProps?.jobListings ||
            nextData?.props?.pageProps?.apolloState ||
            nextData?.props?.pageProps?.initialState?.jobListings;

          if (Array.isArray(rawListings) && rawListings.length > 0) {
            onProgress?.({
              board: 'wellfound',
              stage: 'extracting',
              message: `Hydrated ${rawListings.length} jobs directly from Next.js state!`,
              jobsFound: results.length,
            });

            for (const item of rawListings) {
              if (results.length >= maxJobs) break;
              const title = item.title || item.name;
              const company = item.startup?.name || item.companyName || 'Tech Startup';
              if (!title) continue;

              const isRemote = Boolean(item.remote || item.location?.toLowerCase().includes('remote'));
              const salary = item.compensation || item.salary || undefined;
              const jobUrl = item.slug
                ? `https://wellfound.com/jobs/${item.slug}`
                : `https://wellfound.com/company/${item.startup?.slug || 'startup'}/jobs`;

              results.push({
                id: uuidv4(),
                title,
                company,
                location: item.location || (isRemote ? 'Remote' : 'United States'),
                isRemote,
                salary,
                source: 'wellfound',
                url: jobUrl,
                description: item.descriptionSnippet || `${title} at startup ${company}.`,
                postedAt: item.postedAt || new Date().toISOString(),
                discoveredAt: new Date().toISOString(),
                status: 'discovered',
                tags: ['Wellfound', 'Startup', ...(salary ? ['Salary Listed'] : []), ...(isRemote ? ['Remote'] : [])],
              });
            }
          }
        }
      } catch (hydrationErr) {
        // Fall back to DOM parsing
      }

      // If Next.js data extraction didn't yield enough, parse DOM cards
      if (results.length < maxJobs) {
        onProgress?.({
          board: 'wellfound',
          stage: 'extracting',
          message: 'Extracting job cards from Wellfound DOM layout...',
          jobsFound: results.length,
        });

        const cards = await page.$$(
          '[data-test="StartupResult"], div.styles_jobCard__2g_f9, div.styles_component__U8_fH, [data-test="JobListingCard"], div.mb-6'
        );

        for (const card of cards) {
          if (results.length >= maxJobs) break;

          try {
            // Find company name
            const companyEl = await card.$('h2, [data-test="StartupName"], .styles_header__1i2Vw a, h3');
            const company = this.cleanText(await companyEl?.innerText()) || 'Startup';

            // Find job role rows inside card
            const roleRows = await card.$$('a[href*="/jobs/"], div.styles_jobListing__3j9_a, div.styles_row__27_oX');

            if (roleRows.length > 0) {
              for (const roleRow of roleRows) {
                if (results.length >= maxJobs) break;

                const roleTitleEl = await roleRow.$('h4, div.font-semibold, span.font-medium, a');
                const title = this.cleanText(await roleTitleEl?.innerText());
                if (!title || title.length < 3 || title.toLowerCase() === 'view job') continue;

                const href = await roleRow.getAttribute('href');
                const jobUrl = href
                  ? href.startsWith('http')
                    ? href
                    : `https://wellfound.com${href}`
                  : searchUrl;

                const rowText = await roleRow.innerText();
                const isRemote =
                  Boolean(query.isRemoteOnly) ||
                  rowText.toLowerCase().includes('remote') ||
                  title.toLowerCase().includes('remote');

                // Extract salary or equity if mentioned
                const salaryMatch = rowText.match(/(\$[\d,kK]+(?:\s*-\s*\$[\d,kK]+)?|\d+%\s*-\s*\d+%\s*equity)/i);
                const salary = salaryMatch ? salaryMatch[0] : undefined;

                results.push({
                  id: uuidv4(),
                  title,
                  company,
                  location: isRemote ? 'Remote' : (query.location || 'United States'),
                  isRemote,
                  salary,
                  source: 'wellfound',
                  url: jobUrl,
                  description: `${title} role at ${company}. ${rowText.replace(/\n/g, ' • ')}`,
                  postedAt: new Date().toISOString(),
                  discoveredAt: new Date().toISOString(),
                  status: 'discovered',
                  tags: ['Wellfound', 'Startup', ...(isRemote ? ['Remote'] : [])],
                });

                onProgress?.({
                  board: 'wellfound',
                  stage: 'extracting',
                  message: `Extracted Wellfound: ${title} @ ${company}`,
                  jobsFound: results.length,
                });
              }
            }
          } catch {}
        }
      }

      onProgress?.({
        board: 'wellfound',
        stage: 'finished',
        message: `Completed Wellfound scrape: ${results.length} jobs retrieved.`,
        jobsFound: results.length,
      });

      return results;
    } catch (err: any) {
      onProgress?.({
        board: 'wellfound',
        stage: 'error',
        message: `Wellfound scrape error: ${err.message}`,
        jobsFound: results.length,
      });
      return results;
    } finally {
      await context.close().catch(() => {});
    }
  }
}
