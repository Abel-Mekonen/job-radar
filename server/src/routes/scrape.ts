import { Router, Request, Response } from 'express';
import { ScraperManager } from '../services/scraperManager';
import { JobDatabase } from '../db/database';
import { JobScrapeQuery } from '../scrapers/types';

export const scrapeRouter = Router();
const manager = ScraperManager.getInstance();

// POST /api/scrape/start
scrapeRouter.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      keywords,
      location,
      isRemoteOnly,
      postedWithinDays,
      experienceLevel,
      boards,
      maxJobsPerBoard,
      headless,
      proxyUrl,
    } = req.body;

    if (!keywords || typeof keywords !== 'string') {
      res.status(400).json({ error: 'Keywords are required to start a scrape.' });
      return;
    }

    const selectedBoards = Array.isArray(boards) && boards.length > 0 ? boards : ['linkedin', 'indeed', 'wellfound', 'remoteok'];

    const query: JobScrapeQuery = {
      keywords: keywords.trim(),
      location: location ? location.trim() : undefined,
      isRemoteOnly: Boolean(isRemoteOnly),
      postedWithinDays: postedWithinDays ? Number(postedWithinDays) : undefined,
      experienceLevel: experienceLevel || 'all',
      boards: selectedBoards,
      maxJobsPerBoard: maxJobsPerBoard ? Number(maxJobsPerBoard) : 20,
      headless: headless !== undefined ? Boolean(headless) : undefined,
      proxyUrl: proxyUrl ? String(proxyUrl).trim() : undefined,
    };

    const task = await manager.startScrape(query);
    res.json({ success: true, task });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/scrape/stop
scrapeRouter.post('/stop', (req: Request, res: Response) => {
  try {
    const stopped = manager.stopCurrentTask();
    res.json({ success: stopped, message: stopped ? 'Scraping task stopped.' : 'No active task to stop.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scrape/status
scrapeRouter.get('/status', (req: Request, res: Response) => {
  const activeTask = manager.getActiveTask();
  res.json({
    isRunning: Boolean(activeTask && activeTask.status === 'running'),
    task: activeTask,
  });
});

// GET /api/scrape/history
scrapeRouter.get('/history', (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const history = JobDatabase.getScrapeTasks(limit);
  res.json(history);
});

// GET /api/scrape/settings
scrapeRouter.get('/settings', (req: Request, res: Response) => {
  const settings = JobDatabase.getSettings();
  res.json(settings);
});

// POST /api/scrape/settings
scrapeRouter.post('/settings', (req: Request, res: Response) => {
  try {
    const updated = JobDatabase.saveSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
