import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Briefcase,
  Globe,
  Trash2,
  ArrowUpDown,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ScrapedJob, JobBoard, JobStatus } from '../types';

interface JobFeedViewProps {
  jobs: ScrapedJob[];
  loading: boolean;
  onSelectJob: (job: ScrapedJob) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
  onDeleteJob: (id: string) => void;
  onOpenScrapeModal: () => void;
}

export const JobFeedView: React.FC<JobFeedViewProps> = ({
  jobs,
  loading,
  onSelectJob,
  onUpdateStatus,
  onDeleteJob,
  onOpenScrapeModal,
}) => {
  const [sortBy, setSortBy] = useState<'recent' | 'company' | 'title'>('recent');

  const sortedJobs = useMemo(() => {
    const list = [...jobs];
    if (sortBy === 'company') {
      return list.sort((a, b) => a.company.localeCompare(b.company));
    }
    if (sortBy === 'title') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    // Default: recent
    return list.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());
  }, [jobs, sortBy]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-google-blue border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-google-muted font-medium">Loading job feed...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
        <div className="w-16 h-16 bg-google-surface border border-google-border rounded-2xl flex items-center justify-center mb-4 text-google-blue shadow-sm">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-google-heading mb-1">No jobs match your filters</h3>
        <p className="text-xs text-google-muted max-w-sm mb-6">
          Try expanding your search query or launch a new scrape to discover fresh listings across LinkedIn, Indeed, Wellfound, and RemoteOK.
        </p>
        <button
          onClick={onOpenScrapeModal}
          className="px-5 py-2.5 bg-google-blue hover:bg-google-blue-hover text-white rounded-full text-xs font-semibold shadow-google-btn transition-colors cursor-pointer"
        >
          + Scrape New Jobs
        </button>
      </div>
    );
  }

  const getBorderColor = (source: JobBoard) => {
    switch (source) {
      case 'linkedin':
        return 'border-l-[#1a73e8]';
      case 'wellfound':
        return 'border-l-[#137333]';
      case 'indeed':
        return 'border-l-[#c5221f]';
      case 'remoteok':
        return 'border-l-[#8430ce]';
      default:
        return 'border-l-google-blue';
    }
  };

  const getSourceBadge = (source: JobBoard) => {
    switch (source) {
      case 'linkedin':
        return <span className="bg-[#e8f0fe] text-[#1a73e8] px-2 py-0.5 rounded text-[10px] font-semibold uppercase">LinkedIn</span>;
      case 'wellfound':
        return <span className="bg-[#ceead6] text-[#137333] px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Wellfound</span>;
      case 'indeed':
        return <span className="bg-[#fce8e6] text-[#c5221f] px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Indeed</span>;
      case 'remoteok':
        return <span className="bg-[#f3e8fd] text-[#8430ce] px-2 py-0.5 rounded text-[10px] font-semibold uppercase">RemoteOK</span>;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'saved':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'interviewing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'offer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'archived':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 max-w-5xl mx-auto w-full select-none">
      {/* Feed Sub-Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-google-border">
        <div>
          <h2 className="text-base font-semibold text-google-heading leading-tight">
            Job Listings Feed
          </h2>
          <span className="text-xs text-google-muted">
            Showing {sortedJobs.length} {sortedJobs.length === 1 ? 'position' : 'positions'}
          </span>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-google-muted" />
          <span className="text-google-muted">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-google-border rounded-lg px-2.5 py-1 bg-white text-google-heading font-medium outline-none focus:border-google-blue"
          >
            <option value="recent">Most Recent</option>
            <option value="company">Company (A-Z)</option>
            <option value="title">Job Title (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Job Cards Stream */}
      <div className="space-y-3">
        {sortedJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => onSelectJob(job)}
            className={`group bg-white hover:bg-google-surface border border-google-border rounded-xl pl-5 pr-4 py-4 shadow-xs hover:shadow-google-card transition-all duration-150 cursor-pointer border-l-4 ${getBorderColor(
              job.source
            )} flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            {/* Left: Role Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {getSourceBadge(job.source)}
                <h3 className="text-sm md:text-base font-semibold text-google-heading group-hover:text-google-blue transition-colors truncate">
                  {job.title}
                </h3>
                {job.isRemote && (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Remote
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-google-muted flex-wrap mb-2">
                <span className="font-semibold text-google-heading flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-google-muted" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-google-muted" />
                  {job.location}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                    {job.salary}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-google-muted">
                  <Clock className="w-3 h-3" />
                  {timeAgo(job.discoveredAt || job.postedAt)}
                </span>
              </div>

              {/* Tags / Snippet */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {job.tags?.slice(0, 4).map((tag, i) => (
                  <span
                    key={i}
                    className="bg-google-hover text-google-text text-[10px] font-medium px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Pipeline Status & Quick Actions */}
            <div
              className="flex items-center gap-2 shrink-0 self-end md:self-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pipeline Status Selector */}
              <select
                value={job.status}
                onChange={(e) => onUpdateStatus(job.id, e.target.value as JobStatus)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer capitalize focus:outline-none focus:ring-1 focus:ring-google-blue ${getStatusColor(
                  job.status
                )}`}
              >
                <option value="discovered">Discovered</option>
                <option value="saved">Saved</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="archived">Archived</option>
              </select>

              {/* Open external link */}
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-google-muted hover:text-google-blue hover:bg-google-hover rounded-full transition-colors"
                title="Apply on original board"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Delete listing */}
              <button
                onClick={() => onDeleteJob(job.id)}
                className="p-2 text-google-muted hover:text-google-red hover:bg-google-hover rounded-full transition-colors"
                title="Delete listing"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
