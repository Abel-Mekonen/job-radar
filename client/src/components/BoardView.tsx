import React from 'react';
import { Briefcase, MapPin, DollarSign, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';
import { ScrapedJob, JobStatus, JobBoard } from '../types';

interface BoardViewProps {
  jobs: ScrapedJob[];
  onSelectJob: (job: ScrapedJob) => void;
  onUpdateStatus: (id: string, status: JobStatus) => void;
}

const COLUMNS: { id: JobStatus; title: string; color: string; bg: string }[] = [
  { id: 'discovered', title: 'Discovered', color: 'text-gray-700', bg: 'bg-gray-100' },
  { id: 'saved', title: 'Saved / Starred', color: 'text-purple-700', bg: 'bg-purple-100' },
  { id: 'applied', title: 'Applied', color: 'text-blue-700', bg: 'bg-blue-100' },
  { id: 'interviewing', title: 'Interviewing', color: 'text-amber-700', bg: 'bg-amber-100' },
  { id: 'offer', title: 'Offers Received', color: 'text-emerald-700', bg: 'bg-emerald-100' },
];

export const BoardView: React.FC<BoardViewProps> = ({
  jobs,
  onSelectJob,
  onUpdateStatus,
}) => {
  const getBorderColor = (source: JobBoard) => {
    switch (source) {
      case 'linkedin':
        return 'border-t-[#1a73e8]';
      case 'wellfound':
        return 'border-t-[#137333]';
      case 'indeed':
        return 'border-t-[#c5221f]';
      case 'remoteok':
        return 'border-t-[#8430ce]';
      default:
        return 'border-t-google-blue';
    }
  };

  const nextStatus = (curr: JobStatus): JobStatus | null => {
    const order: JobStatus[] = ['discovered', 'saved', 'applied', 'interviewing', 'offer'];
    const idx = order.indexOf(curr);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  const prevStatus = (curr: JobStatus): JobStatus | null => {
    const order: JobStatus[] = ['discovered', 'saved', 'applied', 'interviewing', 'offer'];
    const idx = order.indexOf(curr);
    return idx > 0 ? order[idx - 1] : null;
  };

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 select-none">
      <div className="flex gap-4 h-full min-w-max items-start">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.id);

          return (
            <div
              key={col.id}
              className="w-80 flex flex-col max-h-full bg-[#f8fafd] border border-google-border rounded-xl p-3 shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-google-border mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.bg.replace('100', '500')}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-google-heading">
                    {col.title}
                  </h3>
                </div>
                <span className="text-xs text-google-muted font-medium bg-white px-2 py-0.5 rounded-full border border-google-border">
                  {colJobs.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {colJobs.length === 0 ? (
                  <div className="p-4 text-center text-xs text-google-muted border border-dashed border-google-border rounded-lg bg-white/50">
                    No jobs in this stage
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`group bg-white hover:bg-google-surface p-3.5 rounded-lg border border-google-border border-t-4 ${getBorderColor(
                        job.source
                      )} shadow-sm hover:shadow-google-card transition-all cursor-pointer`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-semibold text-google-heading group-hover:text-google-blue line-clamp-2 leading-snug">
                          {job.title}
                        </h4>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-google-muted hover:text-google-blue shrink-0 p-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="space-y-1 text-xs text-google-muted mb-3">
                        <div className="flex items-center gap-1 font-medium text-google-text">
                          <Briefcase className="w-3.5 h-3.5 text-google-muted shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-google-muted shrink-0" />
                          <span className="truncate">{job.location}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <DollarSign className="w-3 h-3 shrink-0" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer with Quick Shift Buttons */}
                      <div
                        className="flex items-center justify-between pt-2 border-t border-google-border text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-google-muted uppercase font-medium">
                          {job.source}
                        </span>

                        <div className="flex items-center gap-1">
                          {prevStatus(job.status) && (
                            <button
                              onClick={() => onUpdateStatus(job.id, prevStatus(job.status)!)}
                              className="p-1 hover:bg-google-hover rounded text-google-muted hover:text-google-heading"
                              title={`Move back to ${prevStatus(job.status)}`}
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {nextStatus(job.status) && (
                            <button
                              onClick={() => onUpdateStatus(job.id, nextStatus(job.status)!)}
                              className="p-1 hover:bg-google-hover rounded text-google-blue font-medium flex items-center gap-0.5"
                              title={`Advance to ${nextStatus(job.status)}`}
                            >
                              <span className="text-[10px]">Next</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
