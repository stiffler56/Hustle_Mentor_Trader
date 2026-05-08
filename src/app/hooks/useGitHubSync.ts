import { useState, useCallback, useRef } from 'react';
import type { Trade } from '../data/types';

// ── Config ────────────────────────────────────────────────────────────────────
export interface GitHubConfig {
  token: string;
  owner: string;
  repo:  string;
  file:  string; // e.g. "hustle-trading/trades.json"
}

const CONFIG_KEY = 'hustle_github_cfg_v1';
const BASE       = 'https://api.github.com';

export type GitHubSyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

function b64Encode(str: string): string {
  // handles Unicode (emojis, etc. in notes)
  return btoa(unescape(encodeURIComponent(str)));
}
function b64Decode(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGitHubSync() {
  const [config, setConfigState] = useState<GitHubConfig>(() => {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null') ?? { token: '', owner: '', repo: '', file: 'trades.json' }; }
    catch { return { token: '', owner: '', repo: '', file: 'trades.json' }; }
  });

  const [status,    setStatus]    = useState<GitHubSyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [errorMsg,  setErrorMsg]  = useState('');
  const [testMsg,   setTestMsg]   = useState('');
  const isBusy = useRef(false);

  const isConfigured = !!(config.token && config.owner && config.repo && config.file);

  // ── Save config ──────────────────────────────────────────────────────────
  const saveConfig = useCallback((updates: Partial<GitHubConfig>) => {
    setConfigState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
      return next;
    });
    setTestMsg('');
    setErrorMsg('');
    setStatus('idle');
  }, []);

  const clearConfig = useCallback(() => {
    const blank = { token: '', owner: '', repo: '', file: 'trades.json' };
    setConfigState(blank);
    localStorage.removeItem(CONFIG_KEY);
    setStatus('idle');
    setLastSynced(null);
    setTestMsg('');
    setErrorMsg('');
  }, []);

  // ── Shared headers ────────────────────────────────────────────────────────
  const headers = (cfg: GitHubConfig) => ({
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  });

  // ── Get current file SHA (needed for updates) ─────────────────────────────
  const getCurrentSha = async (cfg: GitHubConfig): Promise<string | null> => {
    const res = await fetch(
      `${BASE}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.file}`,
      { headers: headers(cfg) },
    );
    if (res.status === 404) return null; // file doesn't exist yet
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || `GitHub API error: ${res.status}`);
    }
    const data = await res.json();
    return data.sha ?? null;
  };

  // ── Test connection ───────────────────────────────────────────────────────
  const testConnection = useCallback(async (): Promise<boolean> => {
    setTestMsg('');
    setErrorMsg('');
    if (!config.token || !config.owner || !config.repo) {
      setErrorMsg('Fill in all fields first.');
      return false;
    }
    try {
      const res = await fetch(
        `${BASE}/repos/${config.owner}/${config.repo}`,
        { headers: headers(config) },
      );
      if (res.status === 401) throw new Error('Invalid token — check your PAT');
      if (res.status === 404) throw new Error(`Repo "${config.owner}/${config.repo}" not found, or token has no access`);
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `HTTP ${res.status}`); }
      const repo = await res.json();
      setTestMsg(`✓ Connected to "${repo.full_name}" (${repo.private ? 'private' : 'public'})`);
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed');
      return false;
    }
  }, [config]);

  // ── Push trades to GitHub ─────────────────────────────────────────────────
  const push = useCallback(async (trades: Trade[]): Promise<boolean> => {
    if (!isConfigured || isBusy.current) return false;
    isBusy.current = true;
    setStatus('syncing');
    setErrorMsg('');
    try {
      const sha = await getCurrentSha(config);
      const content = b64Encode(JSON.stringify(trades, null, 2));
      const now = new Date().toISOString().slice(0, 10);
      const body: Record<string, any> = {
        message: `HU$TLE TRADING: sync ${trades.length} trades · ${now}`,
        content,
      };
      if (sha) body.sha = sha; // required for updates

      const res = await fetch(
        `${BASE}/repos/${config.owner}/${config.repo}/contents/${config.file}`,
        { method: 'PUT', headers: headers(config), body: JSON.stringify(body) },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Push failed: ${res.status}`);
      }
      setStatus('synced');
      setLastSynced(new Date());
      return true;
    } catch (err: any) {
      const msg = err.message?.includes('fetch') ? 'No internet connection' : err.message || 'Push failed';
      setErrorMsg(msg);
      setStatus('error');
      return false;
    } finally {
      isBusy.current = false;
    }
  }, [config, isConfigured]);

  // ── Pull trades from GitHub ───────────────────────────────────────────────
  const pull = useCallback(async (): Promise<Trade[] | null> => {
    if (!isConfigured) return null;
    setStatus('syncing');
    setErrorMsg('');
    try {
      const res = await fetch(
        `${BASE}/repos/${config.owner}/${config.repo}/contents/${config.file}`,
        { headers: headers(config) },
      );
      if (res.status === 404) {
        setErrorMsg('No trades file found in this repo yet. Push first to create it.');
        setStatus('idle');
        return null;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Pull failed: ${res.status}`);
      }
      const data = await res.json();
      const decoded = b64Decode(data.content.replace(/\n/g, ''));
      const trades: Trade[] = JSON.parse(decoded);
      setStatus('synced');
      setLastSynced(new Date());
      return trades;
    } catch (err: any) {
      const msg = err.message?.includes('fetch') ? 'No internet connection' : err.message || 'Pull failed';
      setErrorMsg(msg);
      setStatus('error');
      return null;
    }
  }, [config, isConfigured]);

  return {
    config, saveConfig, clearConfig, isConfigured,
    status, lastSynced, errorMsg, testMsg,
    testConnection, push, pull,
  };
}
