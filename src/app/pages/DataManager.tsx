import React, { useRef, useState } from 'react';
import {
  Trash2, Download, Upload, CheckCircle2, AlertTriangle,
  HardDrive, RefreshCw, ShieldCheck, Info, ChevronRight,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade } from '../data/types';

type ImportMode = 'replace' | 'merge';

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function DataManager() {
  const { trades, clearTrades, importTrades } = useTradesContext();
  const { colors } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [importPreview, setImportPreview] = useState<Trade[] | null>(null);
  const [importError, setImportError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Stats ────────────────────────────────────────────────────────────────
  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);
  const open = trades.filter(t => t.status === 'OPEN');
  const wins = closed.filter(t => t.result === 'WIN').length;
  const totalPnL = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const withScreenshots = trades.filter(t => t.screenshotBefore || t.screenshotAfter).length;
  const withVideos = trades.filter(t => t.reviewVideoUrl).length;

  // Rough size estimate (base64 images make it larger)
  const sizeKb = Math.round(JSON.stringify(trades).length / 1024);

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hustle-trades-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${trades.length} trades to JSON`);
  };

  // ── Import file picker ───────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('File must contain a JSON array of trades.');
        // Basic validation — each item must have an id and a date
        const valid = parsed.filter((t: any) => t?.id && t?.date);
        if (valid.length === 0) throw new Error('No valid trades found in this file.');
        setImportPreview(valid as Trade[]);
        setImportError('');
      } catch (err: any) {
        setImportError(err.message || 'Could not read file. Make sure it is a valid HU$TLE JSON backup.');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreview) return;
    const count = importTrades(importPreview, importMode);
    setImportPreview(null);
    showToast(
      importMode === 'replace'
        ? `Replaced all data with ${count} trades`
        : `Merged — up to ${count} trades added`,
    );
  };

  // ── Clear ────────────────────────────────────────────────────────────────
  const handleClear = () => {
    clearTrades();
    setConfirmClear(false);
    showToast('All trades cleared. Dashboard is now empty.', true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm transition-all"
          style={{
            background: toast.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: toast.ok ? '#10b981' : '#f87171',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HardDrive size={20} style={{ color: '#f59e0b' }} />
          <h1 className="text-xl" style={{ color: colors.text }}>Data Manager</h1>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Your trades are saved in your browser. Export a backup, clear demo data, or import your real trades.
        </p>
      </div>

      {/* Storage info banner */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <Info size={15} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
        <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>
          <span style={{ color: '#f59e0b' }}>Where is my data stored?</span>
          {' '}All trades live in your <strong style={{ color: colors.text }}>browser's localStorage</strong> on this device.
          They persist across sessions but are tied to this browser. Use <strong style={{ color: colors.text }}>Export</strong> below to back them up —
          if you clear browser data or switch devices, you'll need to re-import your backup.
        </p>
      </div>

      {/* Current data snapshot */}
      <Section title="Current Data Snapshot" colors={colors}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Trades', value: trades.length, color: colors.text },
            { label: 'Closed', value: closed.length, color: colors.textSub },
            { label: 'Open', value: open.length, color: '#f59e0b' },
            { label: 'Wins', value: wins, color: '#10b981' },
            { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL}`, color: totalPnL >= 0 ? '#10b981' : '#f87171' },
            { label: 'Storage', value: `~${sizeKb} KB`, color: colors.textSub },
          ].map(s => (
            <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
              <p className="text-xs mb-1" style={{ color: colors.textMuted }}>{s.label}</p>
              <p className="text-lg" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        {withScreenshots > 0 || withVideos > 0 ? (
          <p className="text-xs mt-3" style={{ color: colors.textFaint }}>
            {withScreenshots} trades with screenshots · {withVideos} with review videos
          </p>
        ) : null}
      </Section>

      {/* STEP 1 — Clear demo data */}
      <Section title="Step 1 — Clear Demo / Fake Data" colors={colors}>
        <p className="text-sm mb-4" style={{ color: colors.textSub }}>
          The app ships with 20 sample trades so the charts aren't empty. Delete them all to start with a clean slate.
        </p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            disabled={trades.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            <Trash2 size={14} />
            {trades.length === 0 ? 'No trades to clear' : `Clear all ${trades.length} trades`}
          </button>
        ) : (
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <p className="text-sm" style={{ color: '#f87171' }}>
              ⚠️ This will permanently delete all {trades.length} trades from this browser. Are you sure?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)}
                className="px-4 py-2 rounded-lg text-sm" style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                Cancel
              </button>
              <button onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-90"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}>
                <Trash2 size={13} /> Yes, delete everything
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* STEP 2 — Export backup */}
      <Section title="Step 2 — Export Your Trades (Backup)" colors={colors}>
        <p className="text-sm mb-4" style={{ color: colors.textSub }}>
          Download all your trades as a <code className="px-1 py-0.5 rounded text-xs" style={{ background: colors.inputBg, color: '#f59e0b' }}>.json</code> file.
          Keep it safe — it's your only backup outside the browser.
          Screenshots are embedded as base64, so the file may be large if you have many images.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handleExport}
            disabled={trades.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Download size={14} />
            Export {trades.length} trades as JSON
          </button>
          <p className="text-xs" style={{ color: colors.textMuted }}>
            File size: ~{sizeKb} KB
          </p>
        </div>
      </Section>

      {/* STEP 3 — Import */}
      <Section title="Step 3 — Import Your Real Trades" colors={colors}>
        <p className="text-sm mb-5" style={{ color: colors.textSub }}>
          Upload a <code className="px-1 py-0.5 rounded text-xs" style={{ background: colors.inputBg, color: '#f59e0b' }}>.json</code> backup
          file exported from this app. Choose how to handle existing data:
        </p>

        {/* Mode picker */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {([
            { mode: 'merge' as ImportMode, label: 'Merge', desc: 'Add new trades, keep existing ones' },
            { mode: 'replace' as ImportMode, label: 'Replace', desc: 'Wipe current data, load from file' },
          ]).map(o => (
            <button
              key={o.mode}
              onClick={() => setImportMode(o.mode)}
              className="flex-1 min-w-[140px] text-left rounded-xl p-3 transition-all"
              style={{
                background: importMode === o.mode ? 'rgba(245,158,11,0.12)' : colors.inputBg,
                border: `1px solid ${importMode === o.mode ? 'rgba(245,158,11,0.4)' : colors.border}`,
              }}
            >
              <p className="text-sm mb-0.5" style={{ color: importMode === o.mode ? '#f59e0b' : colors.text }}>
                {importMode === o.mode ? '● ' : '○ '}{o.label}
              </p>
              <p className="text-xs" style={{ color: colors.textMuted }}>{o.desc}</p>
            </button>
          ))}
        </div>

        {/* File picker */}
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
          style={{ border: `1px solid ${colors.border}`, color: colors.textSub, background: colors.inputBg }}
        >
          <Upload size={14} /> Choose backup file (.json)
        </button>

        {/* Error */}
        {importError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{importError}</p>
          </div>
        )}

        {/* Preview */}
        {importPreview && (
          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: colors.inputBg, borderBottom: `1px solid ${colors.border}` }}>
              <div>
                <p className="text-sm" style={{ color: colors.text }}>
                  Preview — {importPreview.length} trades found
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                  Mode: <span style={{ color: '#f59e0b' }}>{importMode === 'replace' ? 'Replace all existing data' : 'Merge with existing trades'}</span>
                </p>
              </div>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
              >
                <CheckCircle2 size={13} /> Import Now
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Date', 'Pair', 'Session', 'Score', 'Result', 'P&L'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 10).map((t, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                      <td className="px-4 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.date}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: colors.text }}>{t.pair}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.session}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: (t.score ?? 0) >= 75 ? '#10b981' : (t.score ?? 0) >= 55 ? '#eab308' : '#f87171' }}>
                        {t.score ?? '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: t.result === 'WIN' ? '#10b981' : t.result === 'LOSS' ? '#f87171' : colors.textSub }}>
                        {t.result || 'Open'}
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                        {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 10 && (
                <p className="px-4 py-2 text-xs" style={{ color: colors.textMuted, borderTop: `1px solid ${colors.border}` }}>
                  …and {importPreview.length - 10} more trades
                </p>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* How it works guide */}
      <Section title="How It All Works" colors={colors}>
        <div className="space-y-4">
          {[
            {
              num: '1',
              title: 'Clear the demo data',
              body: 'Hit "Clear all trades" above. The sample trades will disappear and everything resets to zero.',
            },
            {
              num: '2',
              title: 'Log your first real trade',
              body: 'Go to Trade Scorer → fill in your setup → score it → click "Log This Trade". It saves instantly.',
            },
            {
              num: '3',
              title: 'Log the result when you close',
              body: 'In the Journal, find your open trade, click "Log Result", enter WIN / LOSS / BE and your P&L.',
            },
            {
              num: '4',
              title: 'Back up regularly',
              body: 'Export your JSON once a week. If you ever clear your browser or switch devices, re-import it here.',
            },
          ].map(s => (
            <div key={s.num} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                {s.num}
              </div>
              <div>
                <p className="text-sm mb-0.5" style={{ color: colors.text }}>{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <ShieldCheck size={14} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
          <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>
            <span style={{ color: '#10b981' }}>Privacy:</span> All your data stays on your device. Nothing is sent to any server.
            Screenshots and notes never leave your browser.
          </p>
        </div>
      </Section>

    </div>
  );
}
