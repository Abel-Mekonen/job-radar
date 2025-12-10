import { Router, Request, Response } from 'express';
import { JobDatabase } from '../db/database';
import { JobStatus } from '../scrapers/types';

export const jobsRouter = Router();

// GET /api/jobs with filtering
jobsRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      boards,
      status,
      isRemote,
      hasSalary,
      dateFrom,
      excludeBlacklist,
      limit,
      offset,
    } = req.query;

    const boardList = typeof boards === 'string' && boards ? boards.split(',') : undefined;

    const result = JobDatabase.getJobs({
      search: typeof search === 'string' ? search : undefined,
      boards: boardList,
      status: typeof status === 'string' && status !== 'all' ? (status as JobStatus) : undefined,
      isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
      hasSalary: hasSalary === 'true',
      dateFrom: typeof dateFrom === 'string' ? dateFrom : undefined,
      excludeBlacklist: excludeBlacklist === 'true',
      limit: limit ? parseInt(limit as string, 10) : 50,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/:id
jobsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const job = JobDatabase.getJobById(id);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json(job);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id
jobsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;
    const success = JobDatabase.updateJobStatus(id, status, notes);
    if (!success) {
      res.status(404).json({ error: 'Job not found or update failed' });
      return;
    }
    const updated = JobDatabase.getJobById(id);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/jobs/:id
jobsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const success = JobDatabase.deleteJob(id);
    if (!success) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    res.json({ success: true, message: 'Job deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/export/csv
jobsRouter.get('/export/csv', (req: Request, res: Response) => {
  try {
    const { jobs } = JobDatabase.getJobs({ limit: 1000 });
    const headers = ['ID', 'Title', 'Company', 'Location', 'Remote', 'Salary', 'Source', 'URL', 'Status', 'Posted At'];
    const rows = jobs.map((j) => [
      j.id,
      `"${j.title.replace(/"/g, '""')}"`,
      `"${j.company.replace(/"/g, '""')}"`,
      `"${j.location.replace(/"/g, '""')}"`,
      j.isRemote ? 'Yes' : 'No',
      `"${(j.salary || '').replace(/"/g, '""')}"`,
      j.source,
      `"${j.url.replace(/"/g, '""')}"`,
      j.status,
      j.postedAt,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=jobs-export.csv');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/jobs/export/json
jobsRouter.get('/export/json', (req: Request, res: Response) => {
  try {
    const { jobs } = JobDatabase.getJobs({ limit: 1000 });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=jobs-export.json');
    res.send(JSON.stringify(jobs, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
