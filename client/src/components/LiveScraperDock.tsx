import React, { useRef, useEffect } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Square,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { ScrapeTask, ScrapeProgressEvent } from '../types';

interface LiveScraperDockProps {
  task: ScrapeTask | null;
  isOpen: boolean;
  onToggle: () => void;
  onStopScrape: () => void;
  latestEvent: ScrapeProgressEvent | null;
}

export const LiveScraperDock: React.FC<LiveScraperDockProps> = ({
  task,
  isOpen,
  onToggle,
  onStopScrape,
  latestEvent,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalRef.current && isOpen) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [task?.logs, isOpen]);

  if (!task && !isOpen) return null;

  const isRunning = task?.status === 'running';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-google-border shadow-2xl transition-all duration-200 select-none">
      {/* Minimized Dock Bar */}
      <div className="h-12 px-6 flex items-center justify-between bg-google-surface hover:bg-[#f1f3f4] cursor-pointer transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-google-blue animate-ping' : 'bg-google-green'
              }`}
            />
            <span className="text-xs font-semibold text-google-heading flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-google-blue" />
              Scraper Execution Monitor
            </span>
          </div>

          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-google-muted pl-3 border-l border-google-border">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-google-blue" />
              <span>{latestEvent?.message || 'Scraper active in background...'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-medium" onClick={(e) => e.stopPropagation()}>
          {task && (
            <span className="bg-google-blue-light text-google-blue px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
              {task.jobsFound} jobs ingested
            </span>
          )}

          {isRunning && (
            <button
              onClick={onStopScrape}
              className="px-3 py-1 bg-google-red/10 hover:bg-google-red/20 text-google-red rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              Stop
            </button>
          )}

          <button
            onClick={onToggle}
            className="p-1 hover:bg-google-border rounded text-google-muted"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Terminal Panel */}
      {isOpen && (
        <div className="h-64 bg-[#1e1e1e] text-[#d4d4d4] flex flex-col font-mono text-xs select-text border-t border-[#333]">
          {/* Terminal Subheader */}
          <div className="px-4 py-2 bg-[#252526] border-b border-[#333] flex items-center justify-between text-[11px] text-[#858585]">
            <div className="flex items-center gap-3">
              <span>PLAYWRIGHT STEALTH CONSOLE</span>
              {latestEvent?.isCloudflareChallenge && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cloudflare Challenge Handled
                </span>
              )}
            </div>
            <span>Status: {task?.status?.toUpperCase() || 'IDLE'}</span>
          </div>

          {/* Log Lines Container */}
          <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-1">
            {(!task || !task.logs || task.logs.length === 0) ? (
              <div className="text-gray-500 italic">No scrape logs yet. Launch a new scraping task to view real-time Playwright actions.</div>
            ) : (
              task.logs.map((log, index) => {
                const isCf = log.includes('Cloudflare') || log.includes('Turnstile');
                const isError = log.includes('error') || log.includes('Error');
                const isSuccess = log.includes('Extracted') || log.includes('Completed') || log.includes('bypassed');

                let lineClass = 'text-gray-300';
                if (isCf) lineClass = 'text-amber-300 font-semibold';
                else if (isError) lineClass = 'text-red-400';
                else if (isSuccess) lineClass = 'text-emerald-400';

                return (
                  <div key={index} className={`leading-relaxed whitespace-pre-wrap ${lineClass}`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
