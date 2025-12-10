import { Router, Request, Response } from 'express';
import { JobDatabase } from '../db/database';

export const statsRouter = Router();

// GET /api/stats
statsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const stats = JobDatabase.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
