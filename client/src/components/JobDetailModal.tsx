import React, { useState } from 'react';
import {
  X,
  Trash2,
  ExternalLink,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Globe,
  Tag,
  FileText,
  Save,
} from 'lucide-react';
import { ScrapedJob, JobStatus } from '../types';

interface JobDetailModalProps {
  job: ScrapedJob | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: JobStatus, notes?: string) => void;
  onDeleteJob: (id: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onUpdateStatus,
  onDeleteJob,
}) => {
  if (!job) return null;

  const [notes, setNotes] = useState(job.notes || '');
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [isSavedNotes, setIsSavedNotes] = useState(false);

  const handleSaveNotes = () => {
    onUpdateStatus(job.id, status, notes);
    setIsSavedNotes(true);
    setTimeout(() => setIsSavedNotes(false), 2000);
  };

  const handleStatusChange = (newStatus: JobStatus) => {
    setStatus(newStatus);
    onUpdateStatus(job.id, newStatus, notes);
  };

  const getSourceBadge = () => {
    switch (job.source) {
      case 'linkedin':
        return <span className="bg-[#e8f0fe] text-[#1a73e8] px-2.5 py-1 rounded text-xs font-semibold uppercase">LinkedIn</span>;
      case 'wellfound':
        return <span className="bg-[#ceead6] text-[#137333] px-2.5 py-1 rounded text-xs font-semibold uppercase">Wellfound</span>;
      case 'indeed':
        return <span className="bg-[#fce8e6] text-[#c5221f] px-2.5 py-1 rounded text-xs font-semibold uppercase">Indeed</span>;
      case 'remoteok':
        return <span className="bg-[#f3e8fd] text-[#8430ce] px-2.5 py-1 rounded text-xs font-semibold uppercase">RemoteOK</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-text">
      <div className="bg-white rounded-2xl shadow-google-modal max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-google-border">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-google-border bg-google-surface">
          <div className="flex items-center gap-2">
            {getSourceBadge()}
            <span className="text-xs text-google-muted">
              Discovered {new Date(job.discoveredAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-1 text-google-muted">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-text hover:text-google-blue"
              title="Open posting"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={() => {
                onDeleteJob(job.id);
                onClose();
              }}
              className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-text hover:text-google-red"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-google-hover rounded-full transition-colors text-google-text"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Title & Company */}
          <div>
            <h2 className="text-2xl font-medium text-google-heading tracking-tight mb-2">
              {job.title}
            </h2>
            <div className="flex items-center gap-3 text-sm text-google-muted flex-wrap">
              <span className="font-semibold text-google-heading flex items-center gap-1.5 text-base">
                <Briefcase className="w-4 h-4 text-google-muted" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-google-muted" />
                {job.location}
              </span>
              {job.isRemote && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Remote
                </span>
              )}
            </div>
          </div>

          {/* Salary & Status Row */}
          <div className="flex items-center justify-between gap-4 p-4 bg-google-surface rounded-xl border border-google-border">
            <div>
              <span className="text-[11px] font-semibold text-google-muted uppercase tracking-wider block mb-1">
                Compensation
              </span>
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-base">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>{job.salary || 'Not specified in posting'}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-google-muted uppercase tracking-wider block mb-1">
                Tracking Stage
              </span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-google-border bg-white text-google-heading shadow-xs focus:ring-2 focus:ring-google-blue focus:outline-none capitalize"
              >
                <option value="discovered">Discovered</option>
                <option value="saved">Saved / Starred</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offer">Offer Received</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-google-muted uppercase tracking-wider block mb-2">
                Keywords & Tags
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {job.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-google-hover text-google-text text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <span className="text-xs font-semibold text-google-muted uppercase tracking-wider block mb-2">
              Position Details & Snippet
            </span>
            <div className="text-sm text-google-text leading-relaxed bg-white border border-google-border p-4 rounded-xl whitespace-pre-line">
              {job.description || 'No detailed snippet extracted.'}
            </div>
          </div>

          {/* User Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-google-muted uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Application Notes
              </span>
              {isSavedNotes && (
                <span className="text-xs text-google-green font-medium animate-pulse">Saved!</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your interview notes, recruiter contacts, or referral details..."
              rows={3}
              className="w-full text-xs p-3 border border-google-border rounded-xl focus:border-google-blue focus:ring-1 focus:ring-google-blue outline-none resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-google-surface hover:bg-google-hover text-google-text text-xs font-medium rounded-md border border-google-border transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-google-border bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-google-text hover:bg-google-hover rounded-md transition-colors"
          >
            Close
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-google-blue hover:bg-google-blue-hover text-white rounded-full text-xs font-semibold shadow-google-btn flex items-center gap-2 transition-all hover:shadow-google-hover"
          >
            <span>Apply Directly on {job.source.toUpperCase()}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
