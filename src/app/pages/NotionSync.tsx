import React, { useState, useRef } from 'react';
import {
  Database, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink,
  ChevronDown, Download, Eye, Plus
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade, Session, Trend, OrderType, Strategy, Decision } from '../data/types';
import { calculateScore } from '../utils/scoring';

interface NotionPage {
  id: string;
  properties: Record<string, any>;
}

// Extract a value from a Notion property object
function extractProp(prop: any): any {
  if (!prop) return undefined;
  switch (prop.type) {
    case 'title':       return prop.title?.[0]?.plain_text ?? '';
    case 'rich_text':   return prop.rich_text?.[0]?.plain_text ?? '';
    case 'select':      return prop.select?.name ?? '';
    case 'multi_select':return prop.multi_select?.map((s: any) => s.name).join(', ') ?? '';
    case 'number':      return prop.number ?? 0;
    case 'date':        return prop.date?.start ?? '';
    case 'checkbox':    return prop.checkbox ?? false;
    case 'formula':     return prop.formula?.number ?? prop.formula?.string ?? '';
    case 'status':      return prop.status?.name ?? '';
    default:            return '';
  }
}

function mapNotionPageToTrade(page: NotionPage, propMap: Record<string, string>): Trade | null {
  try {
    const get = (key: string) => {
      const notionKey = propMap[key];
      if (!notionKey) return undefined;
      return extractProp(page.properties[notionKey]);
    };

    const pair = get('pair') || 'XAUUSD';
    const session = (get('session') || 'New York') as Session;
    const trend = (get('trend') || 'Bullish') as Trend;
    const orderType = (get('orderType') || 'Buy') as OrderType;
    const strategy = (get('strategy') || 'D1/H4 FVG') as Strategy;
    const mentalFocus = Number(get('mentalFocus') ?? 15);
    const confluences = Number(get('confluences') ?? 2);
    const buyLowSellHigh = Number(get('buyLowSellHigh') ?? 15);
    const bias = Number(get('bias') ?? 15);
    const risk = Number(get('risk') ?? 1);
    const rrRatio = Number(get('rrRatio') ?? 2);
    const pnlRaw = get('pnl');
    const pnl = pnlRaw !== undefined && pnlRaw !== '' ? Number(pnlRaw) : undefined;
    const notes = get('notes') || '';
    const bais = get('bais') || '';
    const dateRaw = get('date') || new Date().toISOString().split('T')[0];

    const existingScore = get('score');
    const breakdown = calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk });
    const score = existingScore ? Number(existingScore) : breakdown.total;
    const decision = breakdown.decision as Decision;

    const resultRaw = (get('result') || '').toUpperCase();
    const result = ['WIN', 'LOSS', 'BE'].includes(resultRaw) ? resultRaw as Trade['result'] : undefined;
    const status: Trade['status'] = result ? 'CLOSED' : 'OPEN';

    return {
      id: page.id,
      date: String(dateRaw).slice(0, 10) || new Date().toISOString().split('T')[0],
      pair, trend, orderType, session, strategy, bais,
      mentalFocus, confluences, buyLowSellHigh, bias, risk, rrRatio,
      score, decision, result, pnl, notes, status,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// Default property name mappings (user's actual Notion property names)
const DEFAULT_MAP: Record<string, string> = {
  pair:            'Pair',
  session:         'Session',
  trend:           'Trend',
  orderType:       'Order Type',
  strategy:        'BAIS',
  bais:            'BAIS',
  mentalFocus:     'Mental Focus',
  confluences:     'Confluences',
  buyLowSellHigh:  'Buy Low/Sell High',
  bias:            'Bias',
  risk:            '% Risk',
  rrRatio:         'Reward-to-risk',
  pnl:             'Profit/Loss',
  result:          'Decision',
  score:           'Total Score',
  date:            'Date',
  notes:           'notes',
};

const FIELD_LABELS: Record<string, string> = {
  pair: 'Pair', session: 'Session', trend: 'Trend', orderType: 'Order Type',
  strategy: 'Strategy', bais: 'BAIS', mentalFocus: 'Mental Focus', confluences: 'Confluences',
  buyLowSellHigh: 'Buy Low/Sell High', bias: 'Bias', risk: '% Risk',
  rrRatio: 'R:R Ratio', pnl: 'Profit/Loss', result: 'Result', score: 'Total Score',
  date: 'Date', notes: 'Notes',
};

type SyncStatus = 'idle' | 'connecting' | 'success' | 'error';

export default function NotionSync() {
  const { trades, addTrade } = useTradesContext();
  const { colors } = useTheme();
  const [token, setToken] = useState('');
  const [dbId, setDbId] = useState('');
  const [propMap, setPropMap] = useState<Record<string, string>>(DEFAULT_MAP);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<Trade[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const existingIds = new Set(trades.map(t => t.id));

  const handleFetch = async () => {
    if (!token.trim() || !dbId.trim()) {
      setErrorMsg('Please enter both your API token and database ID.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMsg('');
    setPreview([]);

    // Clean the database ID (remove dashes and extra URL parts)
    const cleanDbId = dbId.replace('https://www.notion.so/', '').replace(/\?.*$/, '').replace(/-/g, '');

    try {
      // Try via CORS proxy
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(`https://api.notion.com/v1/databases/${cleanDbId}/query`)}`;

      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 100 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const pages: NotionPage[] = data.results ?? [];

      const mapped = pages
        .map(p => mapNotionPageToTrade(p, propMap))
        .filter(Boolean) as Trade[];

      setPreview(mapped);
      setSelected(new Set(mapped.filter(t => !existingIds.has(t.id)).map(t => t.id)));
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('Failed to fetch') || err.message?.includes('CORS')
          ? 'CORS blocked — Notion does not allow direct browser requests. Try pasting your Notion data as CSV below.'
          : err.message || 'Connection failed'
      );
      setStatus('error');
    }
  };

  const handleImport = () => {
    let count = 0;
    preview.forEach(t => {
      if (selected.has(t.id) && !existingIds.has(t.id)) {
        addTrade(t);
        count++;
      }
    });
    setImportCount(count);
    setPreview([]);
    setSelected(new Set());
    setStatus('idle');
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // CSV paste import
  const [csvText, setCsvText] = useState('');
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsed' | 'error'>('idle');
  const [csvTrades, setCsvTrades] = useState<Trade[]>([]);
  const [csvSelected, setCsvSelected] = useState<Set<string>>(new Set());

  const handleCsvParse = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('Need at least a header row and one data row');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsed: Trade[] = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });

        const get = (key: string) => row[propMap[key]] ?? '';
        const mentalFocus = Number(get('mentalFocus')) || 15;
        const confluences = Number(get('confluences')) || 2;
        const buyLowSellHigh = Number(get('buyLowSellHigh')) || 15;
        const bias = Number(get('bias')) || 15;
        const risk = Number(get('risk')) || 1;
        const session = (get('session') || 'New York') as Session;
        const breakdown = calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk });

        const resultRaw = get('result').toUpperCase();
        const result = ['WIN', 'LOSS', 'BE'].includes(resultRaw) ? resultRaw as Trade['result'] : undefined;

        const trade: Trade = {
          id: `csv-${i}-${Date.now()}`,
          date: get('date').slice(0, 10) || new Date().toISOString().split('T')[0],
          pair: get('pair') || 'XAUUSD',
          trend: (get('trend') || 'Bullish') as Trend,
          orderType: (get('orderType') || 'Buy') as OrderType,
          session,
          strategy: (get('strategy') || 'D1/H4 FVG') as Strategy,
          bais: get('bais') || '',
          mentalFocus, confluences, buyLowSellHigh, bias, risk,
          rrRatio: Number(get('rrRatio')) || 2,
          score: Number(get('score')) || breakdown.total,
          decision: breakdown.decision,
          result,
          pnl: get('pnl') !== '' ? Number(get('pnl')) : undefined,
          notes: get('notes') || '',
          status: result ? 'CLOSED' : 'OPEN',
          createdAt: new Date().toISOString(),
        };
        parsed.push(trade);
      }

      setCsvTrades(parsed);
      setCsvSelected(new Set(parsed.map(t => t.id)));
      setCsvStatus('parsed');
    } catch (err: any) {
      setCsvStatus('error');
    }
  };

  const handleCsvImport = () => {
    let count = 0;
    csvTrades.forEach(t => {
      if (csvSelected.has(t.id)) { addTrade(t); count++; }
    });
    setImportCount(count);
    setCsvTrades([]);
    setCsvText('');
    setCsvStatus('idle');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database size={20} style={{ color: '#f59e0b' }} />
          <h1 className="text-xl" style={{ color: colors.text }}>Notion Sync</h1>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>Import trades from your HU$TLE TRADING Notion database</p>
      </div>

      {importCount > 0 && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <span className="text-sm" style={{ color: '#10b981' }}>{importCount} trade{importCount !== 1 ? 's' : ''} imported successfully!</span>
        </div>
      )}

      {/* Setup Guide */}
      <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <button
          onClick={() => setShowGuide(s => !s)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm"
          style={{ color: colors.textSub }}
        >
          <div className="flex items-center gap-2">
            <ExternalLink size={14} style={{ color: '#f59e0b' }} />
            How to get your Notion API token
          </div>
          <ChevronDown size={14} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
        </button>
        {showGuide && (
          <div className="px-4 pb-4 space-y-3" style={{ borderTop: `1px solid ${colors.border}` }}>
            <div className="pt-3 space-y-3">
              {[
                { step: '1', text: 'Go to notion.so/my-integrations and click "New integration"' },
                { step: '2', text: 'Name it "HU$TLE TRADING", click Submit, copy the Internal Integration Token' },
                { step: '3', text: 'Open your HU$TLE TRADING database → ⋯ menu → Connections → Add your integration' },
                { step: '4', text: 'Copy the database URL from your browser (or right-click → Copy link)' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                    {s.step}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Connection */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>Direct API Connection</p>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>Notion Integration Token</label>
            <input
              type="password" placeholder="secret_xxxxxxxxxxxxxxxx"
              value={token} onChange={e => setToken(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>Database ID or URL</label>
            <input
              type="text" placeholder="https://www.notion.so/... or just the ID"
              value={dbId} onChange={e => setDbId(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
            />
          </div>
        </div>

        {/* Field mapping toggle */}
        <button
          onClick={() => setShowMapEditor(s => !s)}
          className="flex items-center gap-2 text-xs"
          style={{ color: colors.textMuted }}
        >
          <ChevronDown size={12} className={`transition-transform ${showMapEditor ? 'rotate-180' : ''}`} />
          Customize field mapping (if your column names differ)
        </button>

        {showMapEditor && (
          <div className="rounded-lg p-4" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
            <p className="text-xs mb-3" style={{ color: colors.textMuted }}>Enter the exact Notion column name for each field:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(FIELD_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs w-24 shrink-0" style={{ color: colors.textSub }}>{label}</span>
                  <input
                    type="text"
                    value={propMap[key] ?? ''}
                    onChange={e => setPropMap(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 min-w-0 rounded px-2 py-1 text-xs"
                    style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-xs" style={{ color: '#f87171' }}>{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleFetch}
          disabled={status === 'connecting'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm hover:opacity-90 transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
        >
          <RefreshCw size={14} className={status === 'connecting' ? 'animate-spin' : ''} />
          {status === 'connecting' ? 'Connecting…' : 'Fetch Trades from Notion'}
        </button>
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <p className="text-sm" style={{ color: colors.text }}>Preview — {preview.length} trades fetched</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                {selected.size} selected · {preview.filter(t => existingIds.has(t.id)).length} already imported
              </p>
            </div>
            <button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
            >
              <Download size={13} /> Import {selected.size} Selected
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th className="px-3 py-2 w-8"></th>
                  {['Date', 'Pair', 'Session', 'Score', 'Result', 'P&L'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(t => {
                  const already = existingIds.has(t.id);
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.rowBorder}`, opacity: already ? 0.4 : 1 }}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          disabled={already}
                          onChange={() => toggleSelect(t.id)}
                          className="cursor-pointer"
                          style={{ accentColor: '#f59e0b' }}
                        />
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: colors.textSub }}>{t.date}</td>
                      <td className="px-3 py-2 text-sm" style={{ color: colors.text }}>{t.pair}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: colors.textSub }}>{t.session}</td>
                      <td className="px-3 py-2 text-sm" style={{ color: t.score >= 75 ? '#10b981' : t.score >= 55 ? '#eab308' : '#f87171' }}>{t.score}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: colors.textSub }}>{already ? 'Exists' : t.result || 'Open'}</td>
                      <td className="px-3 py-2 text-sm" style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                        {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV import fallback */}
      <div className="rounded-xl p-5 space-y-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>CSV Import (Fallback)</p>
          <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
            In Notion: open your database → ⋯ → Export → CSV. Then paste the contents below.
          </p>
        </div>

        <textarea
          rows={5}
          placeholder={'Pair,Session,Trend,Order Type,Mental Focus,Confluences,Buy Low/Sell High,Bias,% Risk,Profit/Loss,Decision,Date\nXAUUSD,New York,Bullish,Buy,25,3,22,24,1,312,WIN,2026-04-15'}
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setCsvStatus('idle'); }}
          className="w-full rounded-lg px-3 py-2.5 text-xs resize-none font-mono"
          style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
        />

        {csvStatus === 'error' && (
          <p className="text-xs" style={{ color: '#f87171' }}>Could not parse CSV. Check column headers match your field mapping above.</p>
        )}

        {csvStatus === 'parsed' && csvTrades.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: colors.textSub }}>{csvTrades.length} trades parsed, {csvSelected.size} selected</p>
              <button
                onClick={handleCsvImport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
              >
                <Plus size={13} /> Import {csvSelected.size}
              </button>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}`, background: colors.inputBg }}>
                    <th className="px-3 py-2 w-8"></th>
                    {['Date', 'Pair', 'Session', 'Score', 'Result', 'P&L'].map(h => (
                      <th key={h} className="px-3 py-2 text-left uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvTrades.map(t => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={csvSelected.has(t.id)}
                          onChange={() => setCsvSelected(prev => { const s = new Set(prev); s.has(t.id) ? s.delete(t.id) : s.add(t.id); return s; })}
                          style={{ accentColor: '#f59e0b' }}
                        />
                      </td>
                      <td className="px-3 py-2" style={{ color: colors.textSub }}>{t.date}</td>
                      <td className="px-3 py-2" style={{ color: colors.text }}>{t.pair}</td>
                      <td className="px-3 py-2" style={{ color: colors.textSub }}>{t.session}</td>
                      <td className="px-3 py-2" style={{ color: t.score >= 75 ? '#10b981' : '#eab308' }}>{t.score}</td>
                      <td className="px-3 py-2" style={{ color: colors.textSub }}>{t.result || 'Open'}</td>
                      <td className="px-3 py-2" style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                        {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleCsvParse}
          disabled={!csvText.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-40"
          style={{ border: `1px solid ${colors.border}`, color: colors.textSub, background: 'transparent' }}
        >
          <Eye size={14} /> Parse & Preview CSV
        </button>
      </div>
    </div>
  );
}