export type JobBoard = 'linkedin' | 'indeed' | 'wellfound' | 'remoteok';

export type JobStatus = 'discovered' | 'saved' | 'applied' | 'interviewing' | 'offer' | 'archived';

export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  salary?: string;
  source: JobBoard;
  url: string;
  description: string;
  postedAt: string;
  discoveredAt: string;
  status: JobStatus;
  tags: string[];
  notes?: string;
}

export interface JobFilters {
  search: string;
  boards: JobBoard[];
  status: JobStatus | 'all';
  isRemote?: boolean;
  hasSalary?: boolean;
  dateFrom?: string;
  excludeBlacklist?: boolean;
}

export interface ScrapeTask {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
  boards: JobBoard[];
  keywords: string;
  location?: string;
  jobsFound: number;
  logs: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface ScrapeProgressEvent {
  taskId: string;
  board: JobBoard;
  stage: 'navigating' | 'bypassing_checks' | 'extracting' | 'paginating' | 'finished' | 'error';
  message: string;
  jobsFound: number;
  timestamp: string;
  isCloudflareChallenge?: boolean;
}

export interface AppSettings {
  headless: boolean;
  stealth: boolean;
  proxyUrl: string;
  requestDelayMs: number;
  maxJobsPerBoard: number;
  companyBlacklist: string[];
}

export interface AppStats {
  totalJobs: number;
  byBoard: Record<string, number>;
  byStatus: Record<string, number>;
  remoteCount: number;
  withSalaryCount: number;
}
