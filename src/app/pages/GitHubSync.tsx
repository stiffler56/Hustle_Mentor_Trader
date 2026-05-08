import React, { useState, useRef } from 'react';
import {
  Github, Cloud, CloudOff, RefreshCw, Download, Upload,
  CheckCircle2, AlertTriangle, ExternalLink, Eye, EyeOff,
  Settings, Trash2, ChevronDown, Info, GitBranch, Lock,
  History, X,
} from 'lucide-react';
import { useTheme } from '../data/ThemeContext';
import { useTradesContext } from '../data/TradesContext';
import { useGitHubSync } from '../hooks/useGitHubSync';

// ── Auto-sync debounce (ms) ───────────────────────────────────────────────────
const DEBOUNCE_MS = 5000;

export default function GitHubSyncPage() {
  const { colors } = useTheme();
  const { trades, importTrades } = useTradesContext();
  const {
    config, saveConfig, clearConfig, isConfigured,
    status, lastSynced, errorMsg, testMsg,
    testConnection, push, pull,
  } = useGitHubSync();

  const [showToken, setShowToken]   = useState(false);
  const [showGuide, setShowGuide]   = useState(false);
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [testing, setTesting]       = useState(false);
  const [pushing, setPushing]       = useState(false);
  const [pulling, setPulling]       = useState(false);
  const [pullResult, setPullResult] = useState('');
  const [pushResult, setPushResult] = useState('');
  const [pullMode, setPullMode]     = useState<'merge' | 'replace'>('merge');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const autoSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-push when trades change (once configured) ────────────────────────
  React.useEffect(() => {
    if (!isConfigured) return;
    if (autoSyncRef.current) clearTimeout(autoSyncRef.current);
    autoSyncRef.current = setTimeout(() => push(trades), DEBOUNCE_MS);
    return () => { if (autoSyncRef.current) clearTimeout(autoSyncRef.current); };
  }, [trades, isConfigured, push]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const handleTest = async () => {
    setTesting(true);
    await testConnection();
    setTesting(false);
  };

  const handlePush = async () => {
    setPushing(true);
    setPushResult('');
    const ok = await push(trades);
    setPushResult(ok ? `✓ ${trades.length} trades pushed successfully` : '');
    setPushing(false);
  };

  const handlePull = async () => {
    if (pullMode === 'replace' && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    setPulling(true);
    setPullResult('');
    setConfirmReplace(false);
    const cloudTrades = await pull();
    if (cloudTrades) {
      const count = importTrades(cloudTrades, pullMode);
      setPullResult(
        pullMode === 'replace'
          ? `✓ Replaced all data — ${cloudTrades.length} trades loaded`
          : `✓ Merged — ${count} new trades added (${cloudTrades.length - count} already existed)`,
      );
    }
    setPulling(false);
  };

  const formatRelative = (d: Date | null) => {
    if (!d) return 'Never';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 10) return 'Just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const statusColor  = status === 'synced' ? '#10b981' : status === 'syncing' ? '#f59e0b' : status === 'error' ? '#f87171' : colors.textFaint as string;
  const statusLabel  = status === 'synced' ? 'Synced to GitHub' : status === 'syncing' ? 'Syncing…' : status === 'error' ? 'Sync error' : 'Not synced yet';

  const inputStyle = { background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' };

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Github size={20} style={{ color: colors.text }} />
            <h1 className="text-xl" style={{ color: colors.text }}>GitHub Sync</h1>
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Store your trades as a JSON file in your own GitHub repo — fully yours, with version history.
          </p>
        </div>
        {isConfigured && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: `${statusColor}18`, border: `1px solid ${statusColor}30` }}>
            <div className={`w-2 h-2 rounded-full ${status === 'syncing' ? 'animate-pulse' : ''}`}
              style={{ background: statusColor }} />
            <span className="text-xs" style={{ color: statusColor }}>{statusLabel}</span>
            {lastSynced && (
              <span className="text-xs" style={{ color: colors.textFaint }}>· {formatRelative(lastSynced)}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Why GitHub ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Lock, title: 'Private & Yours', body: 'Your trades live in your own GitHub repo. No third-party has access.' },
          { icon: History, title: 'Version History', body: 'Every sync creates a Git commit. Roll back to any previous version.' },
          { icon: Cloud, title: 'Any Device', body: 'Push from one device, pull on another. Works anywhere GitHub works.' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl p-4 flex gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Icon size={15} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <p className="text-xs mb-0.5" style={{ color: colors.text }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Setup Guide ───────────────────────────────────────────────────── */}
      <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <button onClick={() => setShowGuide(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-sm"
          style={{ color: colors.textSub }}>
          <div className="flex items-center gap-2">
            <ExternalLink size={13} style={{ color: '#f59e0b' }} />
            How to set up (5 minutes)
          </div>
          <ChevronDown size={14} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
        {showGuide && (
          <div className="px-5 pb-5" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="pt-4 space-y-4">
              {[
                {
                  n: '1', title: 'Create a private GitHub repository',
                  body: 'Go to github.com → New repository → set visibility to Private → name it anything (e.g. "my-trades") → Create repository.',
                  link: { url: 'https://github.com/new', label: 'github.com/new ↗' },
                },
                {
                  n: '2', title: 'Generate a Personal Access Token',
                  body: 'Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token. Set expiration to "No expiration" and check the "repo" scope.',
                  link: { url: 'https://github.com/settings/tokens/new?scopes=repo&description=HUSTLE+TRADING', label: 'Generate token ↗' },
                },
                {
                  n: '3', title: 'Enter your details below',
                  body: 'Paste your username, repo name, and token into the fields below. Hit "Test Connection" to verify, then "Push Now" to upload your trades.',
                },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', marginTop: 1 }}>
                    {s.n}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs mb-1" style={{ color: colors.text }}>{s.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{s.body}</p>
                    {s.link && (
                      <a href={s.link.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs mt-1.5 hover:opacity-80"
                        style={{ color: '#f59e0b', textDecoration: 'none' }}>
                        {s.link.label}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Configuration ─────────────────────────────────────────────────── */}
      <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <button onClick={() => setShowSettings(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5"
          style={{ color: colors.textSub }}>
          <div className="flex items-center gap-2">
            <Settings size={13} style={{ color: isConfigured ? '#10b981' : '#f59e0b' }} />
            <span className="text-sm" style={{ color: colors.text }}>
              {isConfigured ? `Connected: ${config.owner}/${config.repo}` : 'Connect your GitHub repo'}
            </span>
            {isConfigured && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                Configured
              </span>
            )}
          </div>
          <ChevronDown size={14} className={`transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>

        {showSettings && (
          <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                  GitHub Username
                </label>
                <input type="text" placeholder="your-username"
                  value={config.owner}
                  onChange={e => saveConfig({ owner: e.target.value.trim() })}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                  Repository Name
                </label>
                <input type="text" placeholder="my-trades"
                  value={config.repo}
                  onChange={e => saveConfig({ repo: e.target.value.trim() })}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                  Personal Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={config.token}
                    onChange={e => saveConfig({ token: e.target.value.trim() })}
                    className="w-full rounded-lg px-3 py-2.5 text-sm pr-10"
                    style={inputStyle}
                  />
                  <button type="button" onClick={() => setShowToken(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                    {showToken ? <EyeOff size={14} style={{ color: colors.text }} /> : <Eye size={14} style={{ color: colors.text }} />}
                  </button>
                </div>
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: colors.textFaint }}>
                  <Lock size={10} /> Stored only in your browser's local storage — never sent anywhere except GitHub.
                </p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                  File Path in Repo
                </label>
                <input type="text" placeholder="trades.json"
                  value={config.file}
                  onChange={e => saveConfig({ file: e.target.value.trim() || 'trades.json' })}
                  className="w-full rounded-lg px-3 py-2.5 text-sm" style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: colors.textFaint }}>
                  e.g. trades.json or data/hustle-trades.json
                </p>
              </div>
            </div>

            {/* Messages */}
            {testMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                <p className="text-xs" style={{ color: '#10b981' }}>{testMsg}</p>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                <p className="text-xs" style={{ color: '#f87171' }}>{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button onClick={handleTest} disabled={testing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ border: `1px solid ${colors.border}`, color: colors.textSub, background: 'transparent' }}>
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              {isConfigured && (
                <button onClick={clearConfig}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-80 transition-all"
                  style={{ border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', background: 'transparent' }}>
                  <Trash2 size={13} /> Disconnect
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Push / Pull ───────────────────────────────────────────────────── */}
      {isConfigured && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Push */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>Push to GitHub</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                Upload your {trades.length} local trades to your repo as a commit.
              </p>
            </div>
            <div className="rounded-lg p-3" style={{ background: colors.inputBg }}>
              <div className="flex items-center gap-2 mb-1">
                <GitBranch size={11} style={{ color: colors.textMuted }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Target</span>
              </div>
              <p className="text-xs font-mono" style={{ color: colors.text }}>
                {config.owner}/{config.repo} → {config.file}
              </p>
            </div>
            {pushResult && (
              <p className="text-xs" style={{ color: '#10b981' }}>{pushResult}</p>
            )}
            <button onClick={handlePush} disabled={pushing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
              <Upload size={14} className={pushing ? 'animate-bounce' : ''} />
              {pushing ? 'Pushing…' : `Push ${trades.length} Trades`}
            </button>
            <p className="text-xs flex items-center gap-1" style={{ color: colors.textFaint }}>
              <Info size={10} /> Also auto-pushes 5s after any change.
            </p>
          </div>

          {/* Pull */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>Pull from GitHub</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                Load trades from your repo into this device.
              </p>
            </div>
            {/* Mode selector */}
            <div>
              <p className="text-xs mb-2" style={{ color: colors.textMuted }}>Import mode:</p>
              <div className="flex gap-2">
                {(['merge', 'replace'] as const).map(m => (
                  <button key={m} onClick={() => { setPullMode(m); setConfirmReplace(false); }}
                    className="flex-1 py-2 rounded-lg text-xs transition-all capitalize"
                    style={{
                      background: pullMode === m ? 'rgba(245,158,11,0.12)' : 'transparent',
                      border: `1px solid ${pullMode === m ? 'rgba(245,158,11,0.3)' : colors.border}`,
                      color: pullMode === m ? '#f59e0b' : colors.textMuted,
                    }}>
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: colors.textFaint }}>
                {pullMode === 'merge'
                  ? 'Adds only trades that don\'t already exist locally.'
                  : 'Replaces ALL local trades with the GitHub version.'}
              </p>
            </div>

            {pullResult && (
              <p className="text-xs" style={{ color: '#10b981' }}>{pullResult}</p>
            )}

            {confirmReplace && (
              <div className="rounded-lg p-3 space-y-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs" style={{ color: '#f87171' }}>
                  ⚠️ This will delete all local trades and replace with GitHub data. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmReplace(false)}
                    className="flex-1 py-1.5 rounded-lg text-xs"
                    style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                    Cancel
                  </button>
                  <button onClick={handlePull}
                    className="flex-1 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                    Yes, Replace
                  </button>
                </div>
              </div>
            )}

            {!confirmReplace && (
              <button onClick={handlePull} disabled={pulling}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ border: `1px solid ${colors.border}`, color: colors.textSub, background: 'transparent' }}>
                <Download size={14} className={pulling ? 'animate-bounce' : ''} />
                {pulling ? 'Pulling…' : 'Pull from GitHub'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Not configured prompt ──────────────────────────────────────────── */}
      {!isConfigured && (
        <div className="rounded-xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ background: colors.surface, border: `2px dashed ${colors.border}` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Github size={26} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p className="text-sm mb-1" style={{ color: colors.text }}>Connect your GitHub repo</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Fill in your username, repo name, and PAT above to start syncing.
              Read the setup guide if you need help.
            </p>
          </div>
          <button onClick={() => { setShowGuide(true); setShowSettings(true); }}
            className="px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
            Show Setup Guide
          </button>
        </div>
      )}

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      {isConfigured && (
        <div className="rounded-xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>How it works</p>
          {[
            { q: 'Where is my data stored?', a: `In your private GitHub repo at ${config.owner}/${config.repo}/${config.file} — only you can access it with your PAT.` },
            { q: 'How do I use it on another device?', a: 'Install the app, go to GitHub Sync, enter the same username/repo/token, then click "Pull from GitHub".' },
            { q: 'Can I see my trade history in GitHub?', a: 'Yes! Each push creates a Git commit with a timestamp. Click "History" on the file in GitHub to see every version.' },
            { q: 'Is my token safe?', a: 'Your token is stored only in your browser localStorage — it never goes through any server. Only GitHub.com receives it directly.' },
          ].map(({ q, a }) => (
            <div key={q} className="pb-3" style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
              <p className="text-xs mb-1" style={{ color: colors.text }}>{q}</p>
              <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
