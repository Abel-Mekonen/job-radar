import React from 'react';
import {
  Menu,
  Search,
  X,
  Briefcase,
  Download,
  Settings,
  Terminal,
  RefreshCw,
  LayoutList,
  Kanban,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  viewMode: 'feed' | 'board';
  setViewMode: (mode: 'feed' | 'board') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalJobs: number;
  isLiveScraping: boolean;
  onToggleConsole: () => void;
  onOpenSettings: () => void;
  onRefreshJobs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  totalJobs,
  isLiveScraping,
  onToggleConsole,
  onOpenSettings,
  onRefreshJobs,
}) => {
  return (
    <header className="h-16 border-b border-google-border bg-white px-4 flex items-center justify-between select-none z-20">
      {/* Left: Menu & Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-muted"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-google-text" />
        </button>

        <div className="flex items-center gap-2.5 pr-2 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-google-blue text-white flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold tracking-tight text-google-heading leading-tight">
                Job<span className="text-google-blue">Flow</span>
              </span>
              <span className="bg-google-blue-light text-google-blue text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                Radar
              </span>
            </div>
            <span className="text-[11px] text-google-muted leading-none">
              Multi-Board Playwright Scraper
            </span>
          </div>
        </div>

        {/* Total Jobs Pill */}
        <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 bg-google-surface border border-google-border rounded-full text-xs text-google-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-google-heading">{totalJobs}</span>
          <span>jobs tracked</span>
        </div>
      </div>

      {/* Center: Search Box */}
      <div className="flex-1 max-w-xl mx-6">
        <div className="relative flex items-center bg-google-hover hover:bg-[#e9eaec] focus-within:bg-white focus-within:shadow-google-card rounded-full px-4 py-2 border border-transparent focus-within:border-google-border transition-all">
          <Search className="w-4 h-4 text-google-muted mr-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, skill (e.g. React, Python, Remote)"
            className="w-full bg-transparent border-none outline-none text-xs md:text-sm text-google-heading placeholder-google-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:bg-google-border rounded-full text-google-muted"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: View Modes, Actions & Profile */}
      <div className="flex items-center gap-2">
        {/* Refresh Feed */}
        <button
          onClick={onRefreshJobs}
          className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-muted"
          title="Refresh Job Feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Live Scraper Dock Toggle */}
        <button
          onClick={onToggleConsole}
          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
            isLiveScraping
              ? 'bg-google-blue text-white animate-pulse shadow-sm'
              : 'bg-google-hover text-google-text hover:bg-google-border'
          }`}
          title="Toggle Playwright Scraper Terminal"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{isLiveScraping ? 'Live Scraping...' : 'Terminal'}</span>
        </button>

        {/* View Mode Switcher: Feed vs Pipeline */}
        <div className="flex items-center border border-google-border rounded-lg overflow-hidden bg-white text-xs font-medium text-google-text">
          <button
            onClick={() => setViewMode('feed')}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              viewMode === 'feed'
                ? 'bg-google-blue-light text-google-blue font-semibold'
                : 'hover:bg-google-hover'
            }`}
            title="List Feed View"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Feed</span>
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 border-l border-google-border flex items-center gap-1.5 transition-colors ${
              viewMode === 'board'
                ? 'bg-google-blue-light text-google-blue font-semibold'
                : 'hover:bg-google-hover'
            }`}
            title="Pipeline Kanban View"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>
        </div>

        {/* Export Dropdown */}
        <div className="relative group">
          <button
            className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-muted"
            title="Export Jobs"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-google-modal border border-google-border py-1 hidden group-hover:block z-30">
            <a
              href="/api/jobs/export/csv"
              className="block px-4 py-2 text-xs text-google-text hover:bg-google-hover font-medium"
              download
            >
              Export as CSV
            </a>
            <a
              href="/api/jobs/export/json"
              className="block px-4 py-2 text-xs text-google-text hover:bg-google-hover font-medium"
              download
            >
              Export as JSON
            </a>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-muted"
          title="Scraper & Anti-Bot Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-google-blue text-white flex items-center justify-center font-medium text-xs ml-1 cursor-pointer shadow-sm">
          A
        </div>
      </div>
    </header>
  );
};
