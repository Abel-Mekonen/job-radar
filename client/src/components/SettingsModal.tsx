import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Globe, Sliders, Building, Plus, Trash2 } from 'lucide-react';
import { AppSettings } from '../types';
import { fetchSettings, saveSettings } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newBlockedCompany, setNewBlockedCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings', err));
  }, [isOpen]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addBlacklistedCompany = () => {
    if (!newBlockedCompany.trim() || !settings) return;
    if (!settings.companyBlacklist.includes(newBlockedCompany.trim())) {
      setSettings({
        ...settings,
        companyBlacklist: [...settings.companyBlacklist, newBlockedCompany.trim()],
      });
    }
    setNewBlockedCompany('');
  };

  const removeBlacklistedCompany = (name: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      companyBlacklist: settings.companyBlacklist.filter((c) => c !== name),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div className="bg-white rounded-2xl shadow-google-modal max-w-lg w-full flex flex-col overflow-hidden animate-fade-in border border-google-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-google-border bg-google-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-google-blue text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-google-heading leading-tight">
                Scraper & Anti-Bot Settings
              </h3>
              <p className="text-[11px] text-google-muted">
                Configure Playwright stealth evasions, proxies, and filtering rules
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

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {settings ? (
            <>
              {/* Stealth & Headless */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-google-heading uppercase tracking-wider block">
                  Stealth & Browser Parameters
                </span>

                <div className="flex items-center justify-between p-3 bg-google-surface rounded-xl border border-google-border">
                  <div>
                    <span className="text-xs font-medium text-google-heading block">
                      Stealth Plugin & Fingerprint Spoofing
                    </span>
                    <span className="text-[11px] text-google-muted block">
                      Masks navigator.webdriver, WebGL, Chrome runtime and audio context
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.stealth}
                    onChange={(e) => setSettings({ ...settings, stealth: e.target.checked })}
                    className="w-4 h-4 accent-google-blue rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-google-surface rounded-xl border border-google-border">
                  <div>
                    <span className="text-xs font-medium text-google-heading block">
                      Default Headless Execution
                    </span>
                    <span className="text-[11px] text-google-muted block">
                      Runs browser in background without popping windows
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.headless}
                    onChange={(e) => setSettings({ ...settings, headless: e.target.checked })}
                    className="w-4 h-4 accent-google-blue rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-google-heading font-medium">Inter-board Cooldown Delay</span>
                    <span className="font-semibold text-google-blue">{settings.requestDelayMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={250}
                    value={settings.requestDelayMs}
                    onChange={(e) => setSettings({ ...settings, requestDelayMs: Number(e.target.value) })}
                    className="w-full accent-google-blue"
                  />
                </div>
              </div>

              {/* Proxy Settings */}
              <div className="border-t border-google-border pt-4 space-y-2">
                <span className="text-xs font-semibold text-google-heading uppercase tracking-wider block">
                  Proxy Configuration
                </span>
                <p className="text-[11px] text-google-muted">
                  Use residential or datacenter proxies for rotating IP addresses to prevent rate limits.
                </p>
                <input
                  type="text"
                  placeholder="e.g. http://username:password@proxy.example.com:8080"
                  value={settings.proxyUrl || ''}
                  onChange={(e) => setSettings({ ...settings, proxyUrl: e.target.value })}
                  className="w-full text-xs p-2.5 border border-google-border rounded-lg outline-none focus:border-google-blue focus:ring-1 focus:ring-google-blue"
                />
              </div>

              {/* Company Blacklist */}
              <div className="border-t border-google-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-google-heading uppercase tracking-wider block">
                    Staffing Agency & Company Blacklist
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add employer to exclude (e.g. CyberCoders)"
                    value={newBlockedCompany}
                    onChange={(e) => setNewBlockedCompany(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBlacklistedCompany())}
                    className="flex-1 text-xs p-2 border border-google-border rounded-lg outline-none focus:border-google-blue"
                  />
                  <button
                    type="button"
                    onClick={addBlacklistedCompany}
                    className="px-3 py-2 bg-google-surface hover:bg-google-hover text-google-heading border border-google-border rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {settings.companyBlacklist.map((c) => (
                    <span
                      key={c}
                      className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    >
                      <span>{c}</span>
                      <button
                        onClick={() => removeBlacklistedCompany(c)}
                        className="hover:text-red-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-xs text-google-muted">Loading settings...</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-google-border bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-google-text hover:bg-google-hover rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-google-blue hover:bg-google-blue-hover text-white rounded-full text-xs font-semibold shadow-google-btn transition-colors"
          >
            {saving ? 'Saving...' : savedSuccess ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
