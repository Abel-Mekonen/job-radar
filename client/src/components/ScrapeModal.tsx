import React, { useState } from 'react';
import {
  X,
  Search,
  MapPin,
  Globe,
  Sliders,
  Shield,
  Layers,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { JobBoard } from '../types';

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScrape: (query: {
    keywords: string;
    location?: string;
    isRemoteOnly?: boolean;
    postedWithinDays?: number;
    experienceLevel?: string;
    boards: JobBoard[];
    maxJobsPerBoard?: number;
    headless?: boolean;
  }) => void;
  isScrapingActive: boolean;
}

export const ScrapeModal: React.FC<ScrapeModalProps> = ({
  isOpen,
  onClose,
  onStartScrape,
  isScrapingActive,
}) => {
  if (!isOpen) return null;

  const [keywords, setKeywords] = useState('Full Stack Developer');
  const [location, setLocation] = useState('United States');
  const [isRemoteOnly, setIsRemoteOnly] = useState(true);
  const [postedDays, setPostedDays] = useState(7);
  const [experienceLevel, setExperienceLevel] = useState('all');
  const [selectedBoards, setSelectedBoards] = useState<JobBoard[]>([
    'linkedin',
    'indeed',
    'wellfound',
    'remoteok',
  ]);
  const [maxJobs, setMaxJobs] = useState(20);
  const [headless, setHeadless] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleBoard = (b: JobBoard) => {
    setSelectedBoards((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || selectedBoards.length === 0) return;

    onStartScrape({
      keywords: keywords.trim(),
      location: location.trim() || undefined,
      isRemoteOnly,
      postedWithinDays: postedDays,
      experienceLevel,
      boards: selectedBoards,
      maxJobsPerBoard: maxJobs,
      headless,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-google-modal max-w-lg w-full flex flex-col overflow-hidden animate-fade-in border border-google-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-border bg-google-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-google-blue-light text-google-blue flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-google-heading leading-tight">
                New Job Scraping Task
              </h3>
              <p className="text-[11px] text-google-muted">
                Playwright stealth crawler with anti-bot challenge mitigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-google-hover rounded-full text-google-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Keywords Input */}
          <div>
            <label className="text-xs font-semibold text-google-heading block mb-1">
              Job Title / Keywords <span className="text-google-red">*</span>
            </label>
            <div className="flex items-center border border-google-border rounded-lg px-3 py-2 focus-within:border-google-blue focus-within:ring-1 focus-within:ring-google-blue bg-white">
              <Search className="w-4 h-4 text-google-muted mr-2" />
              <input
                type="text"
                required
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, AI Engineer, Python"
                className="w-full text-sm outline-none text-google-heading"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-google-heading block mb-1">
                Location
              </label>
              <div className="flex items-center border border-google-border rounded-lg px-3 py-2 focus-within:border-google-blue focus-within:ring-1 focus-within:ring-google-blue bg-white">
                <MapPin className="w-4 h-4 text-google-muted mr-2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. United States, SF"
                  className="w-full text-sm outline-none text-google-heading"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-google-heading block mb-1">
                Date Posted
              </label>
              <select
                value={postedDays}
                onChange={(e) => setPostedDays(Number(e.target.value))}
                className="w-full text-sm border border-google-border rounded-lg px-3 py-2 bg-white text-google-heading outline-none focus:border-google-blue"
              >
                <option value={1}>Past 24 Hours</option>
                <option value={3}>Past 3 Days</option>
                <option value={7}>Past Week</option>
                <option value={14}>Past 2 Weeks</option>
                <option value={30}>Past Month</option>
              </select>
            </div>
          </div>

          {/* Remote Only Toggle */}
          <div className="flex items-center justify-between p-3 bg-google-surface rounded-xl border border-google-border">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-google-blue" />
              <div>
                <span className="text-xs font-medium text-google-heading block">Remote Positions Only</span>
                <span className="text-[11px] text-google-muted block">Filter specifically for telecommute / remote jobs</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRemoteOnly}
              onChange={(e) => setIsRemoteOnly(e.target.checked)}
              className="w-4 h-4 accent-google-blue rounded cursor-pointer"
            />
          </div>

          {/* Target Boards */}
          <div>
            <label className="text-xs font-semibold text-google-heading block mb-1.5">
              Select Job Boards to Scrape <span className="text-google-red">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'linkedin', label: 'LinkedIn', color: 'border-l-[#1a73e8]', dot: 'bg-[#1a73e8]' },
                { id: 'indeed', label: 'Indeed', color: 'border-l-[#c5221f]', dot: 'bg-[#c5221f]' },
                { id: 'wellfound', label: 'Wellfound (AngelList)', color: 'border-l-[#137333]', dot: 'bg-[#137333]' },
                { id: 'remoteok', label: 'RemoteOK', color: 'border-l-[#8430ce]', dot: 'bg-[#8430ce]' },
              ].map((b) => (
                <label
                  key={b.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border border-google-border cursor-pointer transition-all border-l-4 ${b.color} ${
                    selectedBoards.includes(b.id as JobBoard)
                      ? 'bg-google-blue-light/30 border-google-blue'
                      : 'bg-white hover:bg-google-surface'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBoards.includes(b.id as JobBoard)}
                    onChange={() => toggleBoard(b.id as JobBoard)}
                    className="w-4 h-4 rounded accent-google-blue"
                  />
                  <span className="text-xs font-medium text-google-text">{b.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Anti-Bot & Execution Options */}
          <div className="border-t border-google-border pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-google-blue hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced & Stealth Settings' : 'Advanced & Stealth Options'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-google-surface rounded-xl border border-google-border text-xs">
                {/* Max jobs slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-google-text font-medium">Max listings per board</span>
                    <span className="font-semibold text-google-heading">{maxJobs}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={maxJobs}
                    onChange={(e) => setMaxJobs(Number(e.target.value))}
                    className="w-full accent-google-blue"
                  />
                </div>

                {/* Headless vs Headful Mode */}
                <div className="flex items-center justify-between pt-2 border-t border-google-border">
                  <div>
                    <span className="font-medium text-google-heading block">Run Headless (Background)</span>
                    <span className="text-[10px] text-google-muted">
                      Uncheck to watch the browser in headful mode (helpful to visually verify Cloudflare)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeadless(!headless)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${
                      headless
                        ? 'bg-google-blue text-white border-google-blue'
                        : 'bg-white text-google-text border-google-border'
                    }`}
                  >
                    {headless ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{headless ? 'Headless' : 'Visible Window'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-google-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-google-text hover:bg-google-hover rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isScrapingActive || selectedBoards.length === 0}
              className="px-6 py-2.5 bg-google-blue hover:bg-google-blue-hover disabled:bg-gray-300 text-white rounded-full text-xs font-semibold shadow-google-btn flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Playwright Scraper</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
