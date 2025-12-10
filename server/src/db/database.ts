import path from 'path';
import fs from 'fs';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import { ScrapedJob, ScrapeTask, AppSettings, JobStatus } from '../scrapers/types';

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'jobs.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    is_remote INTEGER DEFAULT 0,
    salary TEXT,
    source TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    posted_at TEXT,
    discovered_at TEXT,
    status TEXT DEFAULT 'discovered',
    tags TEXT,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_discovered_at ON jobs(discovered_at);
  CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);

  CREATE TABLE IF NOT EXISTS scrape_tasks (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    boards TEXT NOT NULL,
    keywords TEXT NOT NULL,
    location TEXT,
    jobs_found INTEGER DEFAULT 0,
    logs TEXT,
    started_at TEXT,
    completed_at TEXT,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Default settings
const defaultSettings: AppSettings = {
  headless: true,
  stealth: true,
  proxyUrl: '',
  requestDelayMs: 1500,
  maxJobsPerBoard: 25,
  companyBlacklist: ['Revature', 'CyberCoders', 'Jobot'],
};

// Seed sample initial jobs if empty
const countRow = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
if (!countRow || countRow.count === 0) {
  const initialJobs: ScrapedJob[] = [
    {
      id: 'seed-1',
      title: 'Senior Full Stack Engineer (React & Node.js)',
      company: 'Vercel',
      location: 'San Francisco, CA',
      isRemote: true,
      salary: '$165,000 - $210,000',
      source: 'linkedin',
      url: 'https://www.linkedin.com/jobs/view/senior-full-stack-engineer-vercel',
      description: 'Join the Next.js and Vercel platform team building next-generation frontend developer infrastructure. Experience with TypeScript, React Server Components, and distributed systems required.',
      postedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      discoveredAt: new Date().toISOString(),
      status: 'saved',
      tags: ['LinkedIn', 'Remote', 'React', 'Node.js', 'Next.js'],
      notes: 'Applied through team referral on LinkedIn.',
    },
    {
      id: 'seed-2',
      title: 'Founding AI & Python Systems Engineer',
      company: 'Cursor (Anysphere)',
      location: 'San Francisco, CA',
      isRemote: true,
      salary: '$180,000 - $240,000 • 0.25% - 0.75%',
      source: 'wellfound',
      url: 'https://wellfound.com/company/cursor/jobs/founding-ai-engineer',
      description: 'Building the AI-first code editor. Working on low-latency inference streaming, tree-sitter AST transformations, and custom language model fine-tuning.',
      postedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      discoveredAt: new Date().toISOString(),
      status: 'interviewing',
      tags: ['Wellfound', 'Startup', 'AI', 'Python', 'Remote'],
      notes: 'Technical screen scheduled for Thursday 2 PM.',
    },
    {
      id: 'seed-3',
      title: 'Staff Backend Infrastructure Architect',
      company: 'Stripe',
      location: 'Seattle, WA',
      isRemote: false,
      salary: '$215,000 - $275,000',
      source: 'indeed',
      url: 'https://www.indeed.com/viewjob?jk=stripe-staff-infra',
      description: 'Design and operate the global financial transactions gateway handling billions of dollars daily. Deep knowledge of high-throughput distributed databases and fault-tolerant architecture.',
      postedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      discoveredAt: new Date(Date.now() - 3600000 * 20).toISOString(),
      status: 'applied',
      tags: ['Indeed', 'Staff', 'Distributed Systems', 'Salary Listed'],
    },
    {
      id: 'seed-4',
      title: 'Principal Distributed Systems Engineer',
      company: 'Supabase',
      location: 'Remote Worldwide',
      isRemote: true,
      salary: '$170,000 - $220,000',
      source: 'remoteok',
      url: 'https://remoteok.com/remote-jobs/supabase-principal-engineer',
      description: 'Building the open-source Firebase alternative. Working on Postgres clustering, Realtime Elixir replication, and edge runtime workers.',
      postedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      discoveredAt: new Date(Date.now() - 3600000 * 40).toISOString(),
      status: 'discovered',
      tags: ['RemoteOK', 'Remote', 'Postgres', 'Elixir', 'Open Source'],
    },
  ];

  for (const j of initialJobs) {
    db.prepare(`
      INSERT INTO jobs (id, title, company, location, is_remote, salary, source, url, description, posted_at, discovered_at, status, tags, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      j.id,
      j.title,
      j.company,
      j.location,
      j.isRemote ? 1 : 0,
      j.salary || null,
      j.source,
      j.url,
      j.description,
      j.postedAt,
      j.discoveredAt,
      j.status,
      JSON.stringify(j.tags),
      j.notes || null
    );
  }
}

export class JobDatabase {
  /**
   * Insert or update a job (deduplicated by URL or exact Title+Company)
   */
  static upsertJob(job: ScrapedJob): boolean {
    const existing = db
      .prepare('SELECT id FROM jobs WHERE url = ? OR (LOWER(title) = LOWER(?) AND LOWER(company) = LOWER(?))')
      .get(job.url, job.title, job.company) as { id: string } | undefined;

    const tagsJson = JSON.stringify(job.tags || []);

    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE jobs
        SET title = ?, company = ?, location = ?, is_remote = ?, salary = COALESCE(?, salary),
            description = ?, tags = ?
        WHERE id = ?
      `).run(
        job.title,
        job.company,
        job.location,
        job.isRemote ? 1 : 0,
        job.salary || null,
        job.description,
        tagsJson,
        existing.id
      );
      return false; // Not a new insertion
    } else {
      // Insert new
      db.prepare(`
        INSERT INTO jobs (id, title, company, location, is_remote, salary, source, url, description, posted_at, discovered_at, status, tags, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        job.id,
        job.title,
        job.company,
        job.location,
        job.isRemote ? 1 : 0,
        job.salary || null,
        job.source,
        job.url,
        job.description,
        job.postedAt,
        job.discoveredAt,
        job.status || 'discovered',
        tagsJson,
        job.notes || ''
      );
      return true; // Newly added
    }
  }

  /**
   * Filter and query jobs
   */
  static getJobs(filters: {
    search?: string;
    boards?: string[];
    status?: JobStatus;
    isRemote?: boolean;
    dateFrom?: string;
    hasSalary?: boolean;
    excludeBlacklist?: boolean;
    limit?: number;
    offset?: number;
  }): { jobs: ScrapedJob[]; total: number } {
    let whereClauses: string[] = [];
    const params: any[] = [];

    if (filters.search) {
      whereClauses.push('(title LIKE ? OR company LIKE ? OR description LIKE ? OR tags LIKE ?)');
      const searchParam = `%${filters.search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (filters.boards && filters.boards.length > 0) {
      const placeholders = filters.boards.map(() => '?').join(',');
      whereClauses.push(`source IN (${placeholders})`);
      params.push(...filters.boards);
    }

    if (filters.status) {
      whereClauses.push('status = ?');
      params.push(filters.status);
    }

    if (filters.isRemote !== undefined) {
      whereClauses.push('is_remote = ?');
      params.push(filters.isRemote ? 1 : 0);
    }

    if (filters.hasSalary) {
      whereClauses.push("salary IS NOT NULL AND salary != ''");
    }

    if (filters.dateFrom) {
      whereClauses.push('discovered_at >= ?');
      params.push(filters.dateFrom);
    }

    if (filters.excludeBlacklist) {
      const settings = this.getSettings();
      if (settings.companyBlacklist && settings.companyBlacklist.length > 0) {
        for (const blocked of settings.companyBlacklist) {
          whereClauses.push('LOWER(company) NOT LIKE ?');
          params.push(`%${blocked.toLowerCase()}%`);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM jobs ${whereSql}`).get(...params) as { count: number };
    const total = countRow ? countRow.count : 0;

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const rows = db
      .prepare(`SELECT * FROM jobs ${whereSql} ORDER BY discovered_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as any[];

    const jobs: ScrapedJob[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      company: r.company,
      location: r.location,
      isRemote: Boolean(r.is_remote),
      salary: r.salary || undefined,
      source: r.source,
      url: r.url,
      description: r.description,
      postedAt: r.posted_at,
      discoveredAt: r.discovered_at,
      status: r.status,
      tags: r.tags ? JSON.parse(r.tags) : [],
      notes: r.notes || '',
    }));

    return { jobs, total };
  }

  static getJobById(id: string): ScrapedJob | null {
    const r = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      company: r.company,
      location: r.location,
      isRemote: Boolean(r.is_remote),
      salary: r.salary || undefined,
      source: r.source,
      url: r.url,
      description: r.description,
      postedAt: r.posted_at,
      discoveredAt: r.discovered_at,
      status: r.status,
      tags: r.tags ? JSON.parse(r.tags) : [],
      notes: r.notes || '',
    };
  }

  static updateJobStatus(id: string, status: JobStatus, notes?: string): boolean {
    const res = db.prepare(`
      UPDATE jobs
      SET status = ?, notes = COALESCE(?, notes)
      WHERE id = ?
    `).run(status, notes !== undefined ? notes : null, id) as { changes: number };
    return res.changes > 0;
  }

  static deleteJob(id: string): boolean {
    const res = db.prepare('DELETE FROM jobs WHERE id = ?').run(id) as { changes: number };
    return res.changes > 0;
  }

  static getStats(): {
    totalJobs: number;
    byBoard: Record<string, number>;
    byStatus: Record<string, number>;
    remoteCount: number;
    withSalaryCount: number;
  } {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number };
    const remoteRow = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_remote = 1').get() as { count: number };
    const salaryRow = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE salary IS NOT NULL AND salary != ''").get() as { count: number };

    const boardRows = db.prepare('SELECT source, COUNT(*) as count FROM jobs GROUP BY source').all() as { source: string; count: number }[];
    const statusRows = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status').all() as { status: string; count: number }[];

    const byBoard: Record<string, number> = {
      linkedin: 0,
      indeed: 0,
      wellfound: 0,
      remoteok: 0,
    };
    for (const b of boardRows) {
      byBoard[b.source] = b.count;
    }

    const byStatus: Record<string, number> = {
      discovered: 0,
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      archived: 0,
    };
    for (const s of statusRows) {
      byStatus[s.status] = s.count;
    }

    return {
      totalJobs: totalRow ? totalRow.count : 0,
      byBoard,
      byStatus,
      remoteCount: remoteRow ? remoteRow.count : 0,
      withSalaryCount: salaryRow ? salaryRow.count : 0,
    };
  }

  // Scrape tasks management
  static createScrapeTask(task: ScrapeTask): void {
    db.prepare(`
      INSERT INTO scrape_tasks (id, status, boards, keywords, location, jobs_found, logs, started_at, completed_at, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id,
      task.status,
      JSON.stringify(task.boards),
      task.keywords,
      task.location || null,
      task.jobsFound,
      JSON.stringify(task.logs),
      task.startedAt,
      task.completedAt || null,
      task.error || null
    );
  }

  static updateScrapeTask(task: Partial<ScrapeTask> & { id: string }): void {
    const existing = db.prepare('SELECT * FROM scrape_tasks WHERE id = ?').get(task.id) as any;
    if (!existing) return;

    db.prepare(`
      UPDATE scrape_tasks
      SET status = COALESCE(?, status),
          jobs_found = COALESCE(?, jobs_found),
          logs = COALESCE(?, logs),
          completed_at = COALESCE(?, completed_at),
          error = COALESCE(?, error)
      WHERE id = ?
    `).run(
      task.status || null,
      task.jobsFound !== undefined ? task.jobsFound : null,
      task.logs ? JSON.stringify(task.logs) : null,
      task.completedAt || null,
      task.error || null,
      task.id
    );
  }

  static getScrapeTasks(limit: number = 10): ScrapeTask[] {
    const rows = db.prepare('SELECT * FROM scrape_tasks ORDER BY started_at DESC LIMIT ?').all(limit) as any[];
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      boards: JSON.parse(r.boards),
      keywords: r.keywords,
      location: r.location,
      jobsFound: r.jobs_found,
      logs: r.logs ? JSON.parse(r.logs) : [],
      startedAt: r.started_at,
      completedAt: r.completed_at,
      error: r.error,
    }));
  }

  // Settings
  static getSettings(): AppSettings {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get() as { value: string } | undefined;
    if (!row) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_config', ?)").run(
        JSON.stringify(defaultSettings)
      );
      return defaultSettings;
    }
    try {
      return { ...defaultSettings, ...JSON.parse(row.value) };
    } catch {
      return defaultSettings;
    }
  }

  static saveSettings(settings: Partial<AppSettings>): AppSettings {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'app_config'").get() as { value: string } | undefined;
    let current = defaultSettings;
    if (row) {
      try {
        current = { ...defaultSettings, ...JSON.parse(row.value) };
      } catch {}
    }
    const updated = { ...current, ...settings };
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_config', ?)").run(
      JSON.stringify(updated)
    );
    return updated;
  }
}
