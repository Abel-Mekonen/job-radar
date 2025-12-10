import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JobFeedView } from './components/JobFeedView';
import { BoardView } from './components/BoardView';
import { JobDetailModal } from './components/JobDetailModal';
import { ScrapeModal } from './components/ScrapeModal';
import { LiveScraperDock } from './components/LiveScraperDock';
import { SettingsModal } from './components/SettingsModal';
import {
  ScrapedJob,
  JobFilters,
  ScrapeTask,
  ScrapeProgressEvent,
  AppStats,
  JobStatus,
} from './types';
import {
  fetchJobs,
  fetchStats,
  fetchScrapeStatus,
  updateJob,
  deleteJob,
  startScrape,
  stopScrape,
} from './services/api';

export const App: React.FC = () => {
  // Navigation & View Mode
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'feed' | 'board'>('feed');

  // Filter state
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    boards: ['linkedin', 'indeed', 'wellfound', 'remoteok'],
    status: 'all',
    isRemote: undefined,
    hasSalary: false,
    excludeBlacklist: true,
  });

  // Jobs state
  const [jobs, setJobs] = useState<ScrapedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AppStats | null>(null);

  // Modals state
  const [selectedJob, setSelectedJob] = useState<ScrapedJob | null>(null);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // Scraping task & WebSocket state
  const [activeTask, setActiveTask] = useState<ScrapeTask | null>(null);
  const [latestEvent, setLatestEvent] = useState<ScrapeProgressEvent | null>(null);

  // Load jobs and stats
  const reloadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsData, statsData] = await Promise.all([
        fetchJobs(filters),
        fetchStats().catch(() => null),
      ]);
      setJobs(jobsData.jobs);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    reloadJobs();
  }, [reloadJobs]);

  // Initial check for any active background scrape
  useEffect(() => {
    fetchScrapeStatus()
      .then((res) => {
        if (res.task) {
          setActiveTask(res.task);
          if (res.isRunning) {
            setConsoleOpen(true);
          }
        }
      })
      .catch(() => {});
  }, []);

  // WebSocket for real-time scraper progress & streaming logs
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let ws: WebSocket;
    let reconnectTimer: any;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'active_task' || msg.type === 'task_started') {
            setActiveTask(msg.task);
            setConsoleOpen(true);
          } else if (msg.type === 'scrape_progress') {
            setLatestEvent(msg.event);
            setActiveTask((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                jobsFound: msg.event.jobsFound !== undefined ? msg.event.jobsFound : prev.jobsFound,
                logs: msg.logs || prev.logs,
              };
            });
          } else if (msg.type === 'job_added') {
            // Real-time job addition
            setJobs((prev) => {
              const exists = prev.some((j) => j.id === msg.job.id || j.url === msg.job.url);
              if (exists) return prev;
              return [msg.job, ...prev];
            });
            fetchStats().then(setStats).catch(() => {});
          } else if (msg.type === 'task_completed' || msg.type === 'task_stopped' || msg.type === 'task_failed') {
            setActiveTask(msg.task);
            reloadJobs();
          }
        } catch (err) {
          console.error('Error handling WS message', err);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [reloadJobs]);

  // Handle job status updates
  const handleUpdateStatus = async (id: string, newStatus: JobStatus, notes?: string) => {
    try {
      const updated = await updateJob(id, newStatus, notes);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      if (selectedJob && selectedJob.id === id) {
        setSelectedJob(updated);
      }
      fetchStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to update job status', err);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async (id: string) => {
    try {
      await deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      if (selectedJob && selectedJob.id === id) {
        setSelectedJob(null);
      }
      fetchStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  // Start scrape task
  const handleStartScrape = async (query: any) => {
    try {
      const res = await startScrape(query);
      if (res.success) {
        setActiveTask(res.task);
        setConsoleOpen(true);
      }
    } catch (err: any) {
      alert(`Could not start scraping: ${err.message}`);
    }
  };

  // Stop scrape task
  const handleStopScrape = async () => {
    try {
      await stopScrape();
    } catch (err) {
      console.error('Failed to stop scrape', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white text-google-text font-google">
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={filters.search}
        setSearchQuery={(q) => setFilters((prev) => ({ ...prev, search: q }))}
        totalJobs={stats?.totalJobs || jobs.length}
        isLiveScraping={activeTask?.status === 'running'}
        onToggleConsole={() => setConsoleOpen(!consoleOpen)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onRefreshJobs={reloadJobs}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Filter Sidebar */}
        {sidebarOpen && (
          <Sidebar
            filters={filters}
            setFilters={setFilters}
            stats={stats}
            onOpenScrapeModal={() => setScrapeModalOpen(true)}
          />
        )}

        {/* View Switcher Main Stage */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {viewMode === 'feed' && (
            <JobFeedView
              jobs={jobs}
              loading={loading}
              onSelectJob={setSelectedJob}
              onUpdateStatus={handleUpdateStatus}
              onDeleteJob={handleDeleteJob}
              onOpenScrapeModal={() => setScrapeModalOpen(true)}
            />
          )}

          {viewMode === 'board' && (
            <BoardView
              jobs={jobs}
              onSelectJob={setSelectedJob}
              onUpdateStatus={handleUpdateStatus}
            />
          )}
        </main>
      </div>

      {/* Bottom Docked Live Terminal Console */}
      <LiveScraperDock
        task={activeTask}
        isOpen={consoleOpen}
        onToggle={() => setConsoleOpen(!consoleOpen)}
        onStopScrape={handleStopScrape}
        latestEvent={latestEvent}
      />

      {/* Modals */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteJob={handleDeleteJob}
      />

      <ScrapeModal
        isOpen={scrapeModalOpen}
        onClose={() => setScrapeModalOpen(false)}
        onStartScrape={handleStartScrape}
        isScrapingActive={activeTask?.status === 'running'}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};
