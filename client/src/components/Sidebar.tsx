import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building,
  DollarSign,
  Globe,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { JobBoard, JobFilters, AppStats } from '../types';

interface SidebarProps {
  filters: JobFilters;
  setFilters: React.Dispatch<React.SetStateAction<JobFilters>>;
  stats: AppStats | null;
  onOpenScrapeModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filters,
  setFilters,
  stats,
  onOpenScrapeModal,
}) => {
  const [boardsOpen, setBoardsOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(true);

  // Toggle board selection
  const toggleBoard = (board: JobBoard) => {
    setFilters((prev) => {
      const exists = prev.boards.includes(board);
      const newBoards = exists ? prev.boards.filter((b) => b !== board) : [...prev.boards, board];
      return { ...prev, boards: newBoards };
    });
  };

  return (
    <aside className="w-64 border-r border-google-border bg-white flex flex-col h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 select-none shrink-0 text-sm">
      {/* Google-styled "+ Scrape Jobs" Pill Button */}
      <div className="mb-5 px-1">
        <button
          onClick={onOpenScrapeModal}
          className="w-full group flex items-center justify-center gap-3 bg-white hover:bg-[#f8fafd] hover:shadow-google-hover text-google-heading font-medium px-4 py-3 rounded-full border border-google-border shadow-google-btn transition-all duration-200 cursor-pointer"
        >
          {/* Multi-colored Google Plus SVG icon */}
          <svg className="w-7 h-7" viewBox="0 0 36 36">
            <path fill="#4285F4" d="M16 16v14h4V20z" />
            <path fill="#34A853" d="M30 16H20l-4 4h14z" />
            <path fill="#FBBC05" d="M6 16h10l4-4H6z" />
            <path fill="#EA4335" d="M20 16V6h-4v14z" />
            <path fill="none" d="M0 0h36v36H0z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide text-google-heading">
            Scrape New Jobs
          </span>
        </button>
      </div>

      {/* Target Job Boards Filter */}
      <div className="mb-5 border-t border-google-border pt-4">
        <button
          onClick={() => setBoardsOpen(!boardsOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-google-heading tracking-wide uppercase px-2 mb-2 hover:text-google-blue"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-google-muted" />
            Job Boards
          </span>
          {boardsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {boardsOpen && (
          <div className="space-y-1 px-1">
            {/* LinkedIn */}
            <label className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.boards.includes('linkedin')}
                onChange={() => toggleBoard('linkedin')}
                className="w-4 h-4 rounded text-google-blue focus:ring-0 border-google-border cursor-pointer accent-[#1a73e8]"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-google-blue shrink-0" />
              <span className="flex-1 text-xs text-google-text font-medium">LinkedIn</span>
              {stats?.byBoard?.linkedin !== undefined && (
                <span className="text-[11px] text-google-muted font-normal bg-google-hover px-1.5 py-0.5 rounded-full">
                  {stats.byBoard.linkedin}
                </span>
              )}
            </label>

            {/* Wellfound */}
            <label className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.boards.includes('wellfound')}
                onChange={() => toggleBoard('wellfound')}
                className="w-4 h-4 rounded text-google-green focus:ring-0 border-google-border cursor-pointer accent-[#137333]"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-google-green shrink-0" />
              <span className="flex-1 text-xs text-google-text font-medium">Wellfound (AngelList)</span>
              {stats?.byBoard?.wellfound !== undefined && (
                <span className="text-[11px] text-google-muted font-normal bg-google-hover px-1.5 py-0.5 rounded-full">
                  {stats.byBoard.wellfound}
                </span>
              )}
            </label>

            {/* Indeed */}
            <label className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.boards.includes('indeed')}
                onChange={() => toggleBoard('indeed')}
                className="w-4 h-4 rounded text-google-red focus:ring-0 border-google-border cursor-pointer accent-[#c5221f]"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-google-red shrink-0" />
              <span className="flex-1 text-xs text-google-text font-medium">Indeed</span>
              {stats?.byBoard?.indeed !== undefined && (
                <span className="text-[11px] text-google-muted font-normal bg-google-hover px-1.5 py-0.5 rounded-full">
                  {stats.byBoard.indeed}
                </span>
              )}
            </label>

            {/* RemoteOK */}
            <label className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={filters.boards.includes('remoteok')}
                onChange={() => toggleBoard('remoteok')}
                className="w-4 h-4 rounded text-google-purple focus:ring-0 border-google-border cursor-pointer accent-[#8430ce]"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-google-purple shrink-0" />
              <span className="flex-1 text-xs text-google-text font-medium">RemoteOK</span>
              {stats?.byBoard?.remoteok !== undefined && (
                <span className="text-[11px] text-google-muted font-normal bg-google-hover px-1.5 py-0.5 rounded-full">
                  {stats.byBoard.remoteok}
                </span>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Pipeline Status Filter */}
      <div className="mb-5 border-t border-google-border pt-4">
        <button
          onClick={() => setStatusOpen(!statusOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-google-heading tracking-wide uppercase px-2 mb-2 hover:text-google-blue"
        >
          <span>Pipeline Stage</span>
          {statusOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {statusOpen && (
          <div className="space-y-1 px-1">
            {[
              { id: 'all', label: 'All Jobs', count: stats?.totalJobs },
              { id: 'discovered', label: 'Discovered', count: stats?.byStatus?.discovered },
              { id: 'saved', label: 'Saved / Starred', count: stats?.byStatus?.saved },
              { id: 'applied', label: 'Applied', count: stats?.byStatus?.applied },
              { id: 'interviewing', label: 'Interviewing', count: stats?.byStatus?.interviewing },
              { id: 'offer', label: 'Offers Received', count: stats?.byStatus?.offer },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilters((p) => ({ ...p, status: st.id as any }))}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.status === st.id
                    ? 'bg-google-blue-light text-google-blue font-semibold'
                    : 'text-google-text hover:bg-google-hover'
                }`}
              >
                <span>{st.label}</span>
                {st.count !== undefined && (
                  <span className="text-[11px] text-google-muted font-normal bg-google-hover px-1.5 py-0.5 rounded-full">
                    {st.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workplace & Compensation Filters */}
      <div className="mb-5 border-t border-google-border pt-4">
        <button
          onClick={() => setPreferencesOpen(!preferencesOpen)}
          className="w-full flex items-center justify-between text-xs font-semibold text-google-heading tracking-wide uppercase px-2 mb-2 hover:text-google-blue"
        >
          <span>Preferences & Filters</span>
          {preferencesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {preferencesOpen && (
          <div className="space-y-2 px-1">
            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isRemote === true}
                onChange={(e) => setFilters((p) => ({ ...p, isRemote: e.target.checked ? true : undefined }))}
                className="w-4 h-4 rounded text-google-blue accent-[#1a73e8]"
              />
              <Globe className="w-3.5 h-3.5 text-google-muted" />
              <span className="text-xs text-google-text">Remote Positions Only</span>
            </label>

            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(filters.hasSalary)}
                onChange={(e) => setFilters((p) => ({ ...p, hasSalary: e.target.checked }))}
                className="w-4 h-4 rounded text-google-blue accent-[#1a73e8]"
              />
              <DollarSign className="w-3.5 h-3.5 text-google-muted" />
              <span className="text-xs text-google-text">Salary Disclosed</span>
            </label>

            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-google-hover cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(filters.excludeBlacklist)}
                onChange={(e) => setFilters((p) => ({ ...p, excludeBlacklist: e.target.checked }))}
                className="w-4 h-4 rounded text-google-blue accent-[#1a73e8]"
              />
              <Building className="w-3.5 h-3.5 text-google-muted" />
              <span className="text-xs text-google-text">Hide Staffing Agencies</span>
            </label>
          </div>
        )}
      </div>

      {/* Anti-Bot & Stealth Status Card */}
      <div className="mt-auto pt-4 border-t border-google-border">
        <div className="p-3 bg-google-surface border border-google-border rounded-xl text-xs shadow-xs">
          <div className="flex items-center gap-1.5 text-google-green font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Anti-Bot Stealth Active</span>
          </div>
          <p className="text-[11px] text-google-muted leading-tight">
            Playwright-Extra browser fingerprint spoofing + Cloudflare Turnstile automated clearance handler armed.
          </p>
        </div>
      </div>
    </aside>
  );
};
