import { v4 as uuidv4 } from 'uuid';
import { WebSocket } from 'ws';
import { JobScrapeQuery, ScrapedJob, ScrapeProgressEvent, ScrapeTask, JobBoard } from '../scrapers/types';
import { JobDatabase } from '../db/database';
import { LinkedInScraper } from '../scrapers/linkedin';
import { IndeedScraper } from '../scrapers/indeed';
import { WellfoundScraper } from '../scrapers/wellfound';
import { RemoteOKScraper } from '../scrapers/remoteok';

export class ScraperManager {
  private static instance: ScraperManager;
  private wsClients: Set<WebSocket> = new Set();
  private activeTask: ScrapeTask | null = null;
  private abortController: AbortController | null = null;

  private scrapers: Record<JobBoard, any> = {
    linkedin: new LinkedInScraper(),
    indeed: new IndeedScraper(),
    wellfound: new WellfoundScraper(),
    remoteok: new RemoteOKScraper(),
  };

  static getInstance(): ScraperManager {
    if (!ScraperManager.instance) {
      ScraperManager.instance = new ScraperManager();
    }
    return ScraperManager.instance;
  }

  registerWsClient(ws: WebSocket): void {
    this.wsClients.add(ws);
    // Send current active task if running
    if (this.activeTask) {
      ws.send(
        JSON.stringify({
          type: 'active_task',
          task: this.activeTask,
        })
      );
    }
  }

  unregisterWsClient(ws: WebSocket): void {
    this.wsClients.delete(ws);
  }

  broadcast(data: any): void {
    const payload = JSON.stringify(data);
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  getActiveTask(): ScrapeTask | null {
    return this.activeTask;
  }

  stopCurrentTask(): boolean {
    if (this.activeTask && this.activeTask.status === 'running') {
      if (this.abortController) {
        this.abortController.abort();
      }
      this.activeTask.status = 'stopped';
      this.activeTask.completedAt = new Date().toISOString();
      this.activeTask.logs.push('[SYSTEM] Scrape cancelled by user.');
      JobDatabase.updateScrapeTask(this.activeTask);
      this.broadcast({
        type: 'task_stopped',
        task: this.activeTask,
      });
      this.activeTask = null;
      return true;
    }
    return false;
  }

  async startScrape(query: JobScrapeQuery): Promise<ScrapeTask> {
    if (this.activeTask && this.activeTask.status === 'running') {
      throw new Error('A scraping task is already actively running. Please wait or stop it first.');
    }

    const taskId = uuidv4();
    this.abortController = new AbortController();

    const task: ScrapeTask = {
      id: taskId,
      status: 'running',
      boards: query.boards,
      keywords: query.keywords,
      location: query.location,
      jobsFound: 0,
      logs: [
        `[${new Date().toLocaleTimeString()}] Task initialized. Target boards: ${query.boards.join(', ')}`,
        `[${new Date().toLocaleTimeString()}] Search query: "${query.keywords}"${query.location ? ` in "${query.location}"` : ''}`,
      ],
      startedAt: new Date().toISOString(),
    };

    this.activeTask = task;
    JobDatabase.createScrapeTask(task);

    this.broadcast({
      type: 'task_started',
      task,
    });

    // Execute in background
    this.executeScrapeWorkflow(task, query).catch((err) => {
      console.error('Unhandled scrape execution error:', err);
    });

    return task;
  }

  private async executeScrapeWorkflow(task: ScrapeTask, query: JobScrapeQuery): Promise<void> {
    const settings = JobDatabase.getSettings();
    const effectiveQuery: JobScrapeQuery = {
      ...query,
      headless: query.headless !== undefined ? query.headless : settings.headless,
      proxyUrl: query.proxyUrl || settings.proxyUrl || undefined,
      maxJobsPerBoard: query.maxJobsPerBoard || settings.maxJobsPerBoard || 20,
    };

    let totalNewJobs = 0;

    const onProgress = (event: Partial<ScrapeProgressEvent>) => {
      const timeStr = new Date().toLocaleTimeString();
      const logLine = `[${timeStr}] [${event.board?.toUpperCase() || 'INFO'}] ${event.message}`;
      task.logs.push(logLine);
      if (task.logs.length > 500) {
        task.logs.shift();
      }

      this.broadcast({
        type: 'scrape_progress',
        taskId: task.id,
        event: {
          ...event,
          taskId: task.id,
          timestamp: new Date().toISOString(),
        },
        logs: task.logs.slice(-20), // Last 20 lines
      });
    };

    try {
      for (const board of query.boards) {
        if (this.abortController?.signal.aborted) {
          break;
        }

        const scraper = this.scrapers[board];
        if (!scraper) {
          onProgress({
            board,
            stage: 'error',
            message: `Unsupported board "${board}". Skipping.`,
          });
          continue;
        }

        onProgress({
          board,
          stage: 'navigating',
          message: `Launching stealth browser automation for ${board.toUpperCase()}...`,
        });

        try {
          const jobs: ScrapedJob[] = await scraper.scrape(effectiveQuery, onProgress);

          let newFromBoard = 0;
          for (const job of jobs) {
            const isNew = JobDatabase.upsertJob(job);
            if (isNew) {
              newFromBoard++;
              totalNewJobs++;
              this.broadcast({
                type: 'job_added',
                job,
              });
            }
          }

          task.jobsFound = totalNewJobs;
          JobDatabase.updateScrapeTask(task);

          onProgress({
            board,
            stage: 'finished',
            message: `Board complete. ${jobs.length} total found, ${newFromBoard} new unique jobs stored.`,
            jobsFound: task.jobsFound,
          });

          // Respect delay between boards
          if (settings.requestDelayMs) {
            await new Promise((res) => setTimeout(res, settings.requestDelayMs));
          }
        } catch (boardErr: any) {
          onProgress({
            board,
            stage: 'error',
            message: `Error scraping ${board}: ${boardErr.message}`,
          });
        }
      }

      task.status = this.abortController?.signal.aborted ? 'stopped' : 'completed';
      task.completedAt = new Date().toISOString();
      task.jobsFound = totalNewJobs;
      JobDatabase.updateScrapeTask(task);

      this.broadcast({
        type: 'task_completed',
        task,
        stats: JobDatabase.getStats(),
      });
    } catch (globalErr: any) {
      task.status = 'failed';
      task.error = globalErr.message;
      task.completedAt = new Date().toISOString();
      JobDatabase.updateScrapeTask(task);

      this.broadcast({
        type: 'task_failed',
        task,
        error: globalErr.message,
      });
    } finally {
      this.activeTask = null;
      this.abortController = null;
    }
  }
}
