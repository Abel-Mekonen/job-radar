import { ScrapedJob, JobFilters, ScrapeTask, AppSettings, AppStats, JobStatus } from '../types';

const API_BASE = '/api';

export async function fetchJobs(filters: JobFilters, limit = 100, offset = 0): Promise<{ jobs: ScrapedJob[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.boards.length > 0) params.set('boards', filters.boards.join(','));
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.isRemote !== undefined) params.set('isRemote', String(filters.isRemote));
  if (filters.hasSalary) params.set('hasSalary', 'true');
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.excludeBlacklist) params.set('excludeBlacklist', 'true');
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const res = await fetch(`${API_BASE}/jobs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
}

export async function fetchJobById(id: string): Promise<ScrapedJob> {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error('Job not found');
  return res.json();
}

export async function updateJob(id: string, status: JobStatus, notes?: string): Promise<ScrapedJob> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update job');
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete job');
}

export async function startScrape(query: {
  keywords: string;
  location?: string;
  isRemoteOnly?: boolean;
  postedWithinDays?: number;
  experienceLevel?: string;
  boards: string[];
  maxJobsPerBoard?: number;
  headless?: boolean;
}): Promise<{ success: boolean; task: ScrapeTask }> {
  const res = await fetch(`${API_BASE}/scrape/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to start scraping');
  }
  return res.json();
}

export async function stopScrape(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/scrape/stop`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to stop scraping');
  return res.json();
}

export async function fetchScrapeStatus(): Promise<{ isRunning: boolean; task: ScrapeTask | null }> {
  const res = await fetch(`${API_BASE}/scrape/status`);
  if (!res.ok) throw new Error('Failed to fetch scrape status');
  return res.json();
}

export async function fetchStats(): Promise<AppStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/scrape/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/scrape/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to save settings');
  return res.json();
}
