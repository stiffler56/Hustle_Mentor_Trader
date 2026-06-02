import React, { useState, useRef, useCallback } from 'react';
import {
  Database, Upload, CheckCircle2, AlertTriangle, ExternalLink,
  ChevronDown, Download, RefreshCw, FileText, X, ArrowRight,
  Zap, Settings2, Eye, Plus, Info, Wand2,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade, Session, Trend, OrderType, Strategy, Decision } from '../data/types';
import { calculateScore } from '../utils/scoring';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'csv' | 'api';
type CsvStep = 'upload' | 'map' | 'preview';

interface ColumnMap {
  date: string;
  pair: string;
  session: string;
  trend: string;
  orderType: string;
  strategy: string;
  bais: string;
  mentalFocus: string;
  confluences: string;
  buyLowSellHigh: string;
  bias: string;
  risk: string;
  rrRatio: string;
  result: string;
  pnl: string;
  notes: string;
  score: string;
}

const FIELD_META: { key: keyof ColumnMap; label: string; required: boolean; hint: string }[] = [
  { key: 'date',           label: 'Date',              required: true,  hint: 'Trade date' },
  { key: 'pair',           label: 'Pair / Symbol',     required: true,  hint: 'e.g. XAUUSD, EURUSD' },
  { key: 'result',         label: 'Result / Outcome',  required: false, hint: 'WIN, LOSS, or BE' },
  { key: 'pnl',            label: 'Profit / Loss ($)', required: false, hint: 'Numeric, e.g. 312 or -89' },
  { key: 'session',        label: 'Session',           required: false, hint: 'New York, London, Tokyo…' },
  { key: 'trend',          label: 'Trend / Bias',      required: false, hint: 'Bullish / Bearish / Ranging' },
  { key: 'orderType',      label: 'Order Type',        required: false, hint: 'Buy or Sell' },
  { key: 'strategy',       label: 'Strategy',          required: false, hint: 'D1/H4 FVG, OB, Liquidity…' },
  { key: 'bais',           label: 'Setup / BAIS',      required: false, hint: 'Your setup description' },
  { key: 'mentalFocus',    label: 'Mental Focus',      required: false, hint: 'Score 0–30' },
  { key: 'confluences',    label: 'Confluences',       required: false, hint: 'Count or score 0–30' },
  { key: 'buyLowSellHigh', label: 'Buy Low/Sell High', required: false, hint: 'Score 0–25' },
  { key: 'bias',           label: 'Bias Score',        required: false, hint: 'Score 0–25' },
  { key: 'risk',           label: '% Risk',            required: false, hint: 'e.g. 1, 1.5, 2' },
  { key: 'rrRatio',        label: 'R:R Ratio',         required: false, hint: 'e.g. 2.5, 3' },
  { key: 'score',          label: 'Total Score',       required: false, hint: 'If you already scored trades' },
  { key: 'notes',          label: 'Notes',             required: false, hint: 'Any text notes' },
];

// ─── Fuzzy column auto-detection ─────────────────────────────────────────────

const SYNONYMS: Record<keyof ColumnMap, string[]> = {
  date:           ['date', 'trade date', 'entry date', 'day', 'closed date'],
  pair:           ['pair', 'symbol', 'instrument', 'asset', 'ticker', 'currency pair'],
  result:         ['result', 'outcome', 'decision', 'win/loss', 'w/l', 'trade result', 'win loss'],
  pnl:            ['profit/loss', 'pnl', 'p&l', 'profit', 'loss', 'gain/loss', 'pl', '$', 'profit loss'],
  session:        ['session', 'trading session', 'market session', 'market'],
  trend:          ['trend', 'direction', 'bias', 'market bias', 'direction'],
  orderType:      ['order type', 'type', 'side', 'buy/sell', 'long/short', 'direction'],
  strategy:       ['strategy', 'setup', 'method', 'approach', 'confluence type', 'bais'],
  bais:           ['bais', 'setup notes', 'setup', 'description', 'confluence description'],
  mentalFocus:    ['mental focus', 'mental', 'focus', 'psychology', 'mental score'],
  confluences:    ['confluences', 'confluence', 'confluences score', 'no. confluences', '# confluences'],
  buyLowSellHigh: ['buy low/sell high', 'blsh', 'buy low sell high', 'position quality'],
  bias:           ['bias score', 'bias points', 'bias quality'],
  risk:           ['% risk', 'risk', 'risk %', 'risk percentage', 'position size'],
  rrRatio:        ['reward-to-risk', 'rr', 'r:r', 'rr ratio', 'risk reward', 'reward risk', 'r/r'],
  score:          ['total score', 'score', 'quality score', 'trade score'],
  notes:          ['notes', 'note', 'comments', 'comment', 'thoughts', 'review', 'journal'],
};

function autoDetect(headers: string[]): ColumnMap {
  const map: ColumnMap = {} as ColumnMap;
  const lHeaders = headers.map(h => h.toLowerCase().trim());

  for (const { key } of FIELD_META) {
    const syns = SYNONYMS[key];
    let best = '';
    // exact match first
    for (const syn of syns) {
      const idx = lHeaders.indexOf(syn);
      if (idx !== -1) { best = headers[idx]; break; }
    }
    // partial match fallback
    if (!best) {
      for (const syn of syns) {
        const idx = lHeaders.findIndex(h => h.includes(syn) || syn.includes(h));
        if (idx !== -1) { best = headers[idx]; break; }
      }
    }
    map[key] = best;
  }
  return map;
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSV(raw: string): { headers: string[]; rows: Record<string, string>[] } {
  // Handle quoted fields with commas inside
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') { inQuotes = !inQuotes; current += ch; }
    else if (ch === '\n' && !inQuotes) { lines.push(current); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) lines.push(current);

  const splitLine = (line: string) => {
    const result: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; }
      else if (ch === ',' && !q) { result.push(field.trim()); field = ''; }
      else { field += ch; }
    }
    result.push(field.trim());
    return result;
  };

  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = splitLine(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').replace(/^"|"$/g, '').trim(); });
    return row;
  });

  return { headers, rows };
}

function rowToTrade(row: Record<string, string>, colMap: ColumnMap): Trade | null {
  try {
    const get = (key: keyof ColumnMap) => (colMap[key] ? row[colMap[key]] ?? '' : '').trim();

    const dateRaw = get('date');
    if (!dateRaw) return null;

    const mentalFocus    = Number(get('mentalFocus'))    || 15;
    const confluences    = Number(get('confluences'))    || 2;
    const buyLowSellHigh = Number(get('buyLowSellHigh')) || 15;
    const bias           = Number(get('bias'))           || 15;
    const risk           = Number(get('risk'))           || 1;
    const rrRatio        = Number(get('rrRatio'))        || 2;
    const session        = (get('session') || 'New York') as Session;
    const pnlRaw         = get('pnl');

    const breakdown = calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk });
    const scoreRaw  = get('score');
    const score     = scoreRaw ? Number(scoreRaw) : breakdown.total;

    const resultRaw = get('result').toUpperCase().trim();
    const resultMap: Record<string, Trade['result']> = {
      WIN: 'WIN', W: 'WIN', WON: 'WIN',
      LOSS: 'LOSS', L: 'LOSS', LOSE: 'LOSS', LOST: 'LOSS',
      BE: 'BE', BREAKEVEN: 'BE', 'BREAK EVEN': 'BE',
    };
    const result = resultMap[resultRaw] ?? undefined;

    // Normalise date (Notion exports as DD/MM/YYYY or YYYY-MM-DD or MM/DD/YYYY)
    let dateStr = dateRaw.slice(0, 10);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateRaw)) {
      const [d, m, y] = dateRaw.split('/');
      dateStr = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateRaw)) {
      const [d, m, y] = dateRaw.split('-');
      dateStr = `${y}-${m}-${d}`;
    }

    // Strategy normalisation
    const stratRaw = get('strategy') || get('bais');
    const stratMap: Record<string, Strategy> = {
      'fvg': 'D1/H4 FVG', 'd1': 'D1/H4 FVG', 'h4': 'D1/H4 FVG',
      'ob': 'Order Block', 'order block': 'Order Block',
      'liquidity': 'Liquidity', 'liq': 'Liquidity',
      'ict': 'ICT Concept', 'sr': 'Support/Resistance', 'support': 'Support/Resistance',
    };
    const stratKey = stratRaw.toLowerCase().trim();
    let strategy: Strategy = 'Other';
    for (const [k, v] of Object.entries(stratMap)) {
      if (stratKey.includes(k)) { strategy = v; break; }
    }
    if (stratRaw && strategy === 'Other') {
      // Try direct match
      const direct = stratRaw as Strategy;
      const valid: Strategy[] = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'ICT Concept', 'Support/Resistance', 'Other'];
      if (valid.includes(direct)) strategy = direct;
    }

    const trend = (() => {
      const t = get('trend').toLowerCase();
      if (t.includes('bull')) return 'Bullish';
      if (t.includes('bear')) return 'Bearish';
      if (t.includes('rang')) return 'Ranging';
      return 'Bullish';
    })() as Trend;

    const orderType = (() => {
      const o = get('orderType').toLowerCase();
      if (o.includes('sell') || o.includes('short')) return 'Sell';
      return 'Buy';
    })() as OrderType;

    return {
      id: `notion-${dateStr}-${Math.random().toString(36).slice(2, 8)}`,
      date: dateStr,
      pair: get('pair') || 'XAUUSD',
      trend,
      orderType,
      session,
      strategy,
      bais: get('bais') || get('strategy') || '',
      mentalFocus, confluences, buyLowSellHigh, bias, risk, rrRatio,
      score,
      decision: breakdown.decision,
      result,
      pnl: pnlRaw !== '' ? Number(pnlRaw.replace(/[$,]/g, '')) || undefined : undefined,
      notes: get('notes'),
      status: result ? 'CLOSED' : 'OPEN',
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

// ─── Notion API helpers (kept for advanced tab) ───────────────────────────────

interface NotionPage { id: string; properties: Record<string, any>; }

function extractProp(prop: any): any {
  if (!prop) return undefined;
  switch (prop.type) {
    case 'title':        return prop.title?.[0]?.plain_text ?? '';
    case 'rich_text':    return prop.rich_text?.[0]?.plain_text ?? '';
    case 'select':       return prop.select?.name ?? '';
    case 'multi_select': return prop.multi_select?.map((s: any) => s.name).join(', ') ?? '';
    case 'number':       return prop.number ?? 0;
    case 'date':         return prop.date?.start ?? '';
    case 'checkbox':     return prop.checkbox ?? false;
    case 'formula':      return prop.formula?.number ?? prop.formula?.string ?? '';
    case 'status':       return prop.status?.name ?? '';
    default:             return '';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotionSync() {
  const { trades, addTrade } = useTradesContext();
  const { colors } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('csv');

  // CSV flow
  const [csvStep, setCsvStep] = useState<CsvStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows]       = useState<Record<string, string>[]>([]);
  const [colMap, setColMap]   = useState<ColumnMap>({} as ColumnMap);
  const [parsedTrades, setParsedTrades] = useState<Trade[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const [fileName, setFileName] = useState('');
  const [importCount, setImportCount] = useState(0);
  const [importError, setImportError] = useState('');

  // API flow
  const [token, setToken]     = useState('');
  const [dbId, setDbId]       = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [apiError, setApiError]   = useState('');
  const [apiTrades, setApiTrades] = useState<Trade[]>([]);
  const [apiSelected, setApiSelected] = useState<Set<string>>(new Set());
  const [apiImportCount, setApiImportCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  const existingIds = new Set(trades.map(t => t.id));

  // ── File load ──────────────────────────────────────────────────────────────

  const loadFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.type.includes('spreadsheet') && file.type !== '') {
      // allow any file ending in csv or plain text
    }
    setFileError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        const { headers: h, rows: r } = parseCSV(text);
        if (h.length === 0 || r.length === 0) throw new Error('No data found in file');
        const detected = autoDetect(h);
        setHeaders(h);
        setRows(r);
        setColMap(detected);
        setCsvStep('map');
      } catch (e: any) {
        setFileError(e.message || 'Could not read CSV. Make sure it is a valid Notion export.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) loadFile(f);
  }, []);

  // ── Build preview ──────────────────────────────────────────────────────────

  const handleBuildPreview = () => {
    const result = rows.map(r => rowToTrade(r, colMap)).filter(Boolean) as Trade[];
    if (result.length === 0) {
      setImportError('No valid trades could be parsed. Check your column mapping.');
      return;
    }
    setImportError('');
    setParsedTrades(result);
    setSelected(new Set(result.map(t => t.id)));
    setCsvStep('preview');
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = () => {
    let count = 0;
    parsedTrades.forEach(t => {
      if (selected.has(t.id)) { addTrade(t); count++; }
    });
    setImportCount(count);
    setCsvStep('upload');
    setHeaders([]); setRows([]); setParsedTrades([]);
    setFileName('');
  };

  // ── API fetch ──────────────────────────────────────────────────────────────

  const DEFAULT_NOTION_MAP = {
    pair: 'Pair', session: 'Session', trend: 'Trend', orderType: 'Order Type',
    strategy: 'Strategy', bais: 'BAIS', mentalFocus: 'Mental Focus',
    confluences: 'Confluences', buyLowSellHigh: 'Buy Low/Sell High', bias: 'Bias',
    risk: '% Risk', rrRatio: 'Reward-to-risk', pnl: 'Profit/Loss',
    result: 'Decision', score: 'Total Score', date: 'Date', notes: 'notes',
  };

  const handleApiFetch = async () => {
    if (!token.trim() || !dbId.trim()) {
      setApiError('Enter your integration token and database ID.'); setApiStatus('error'); return;
    }
    setApiStatus('loading'); setApiError('');
    const cleanId = dbId.replace('https://www.notion.so/', '').replace(/\?.*$/, '').replace(/-/g, '');
    try {
      const proxy = `https://corsproxy.io/?url=${encodeURIComponent(`https://api.notion.com/v1/databases/${cleanId}/query`)}`;
      const res = await fetch(proxy, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.trim()}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_size: 100 }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || `HTTP ${res.status}`); }
      const data = await res.json();
      const pages: NotionPage[] = data.results ?? [];
      const mapped = pages.map(p => {
        const get = (k: string) => extractProp(p.properties[DEFAULT_NOTION_MAP[k as keyof typeof DEFAULT_NOTION_MAP]]);
        const mentalFocus    = Number(get('mentalFocus'))    || 15;
        const confluences    = Number(get('confluences'))    || 2;
        const buyLowSellHigh = Number(get('buyLowSellHigh')) || 15;
        const bias           = Number(get('bias'))           || 15;
        const risk           = Number(get('risk'))           || 1;
        const session        = (get('session') || 'New York') as Session;
        const bd = calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk });
        const resultRaw = (get('result') || '').toUpperCase();
        const result = (['WIN','LOSS','BE'].includes(resultRaw) ? resultRaw : undefined) as Trade['result'] | undefined;
        const pnlRaw = get('pnl');
        return {
          id: p.id,
          date: String(get('date') || new Date().toISOString()).slice(0, 10),
          pair: get('pair') || 'XAUUSD',
          trend: (get('trend') || 'Bullish') as Trend,
          orderType: (get('orderType') || 'Buy') as OrderType,
          session, strategy: (get('strategy') || 'D1/H4 FVG') as Strategy,
          bais: get('bais') || '',
          mentalFocus, confluences, buyLowSellHigh, bias, risk,
          rrRatio: Number(get('rrRatio')) || 2,
          score: Number(get('score')) || bd.total,
          decision: bd.decision,
          result, pnl: pnlRaw !== '' && pnlRaw !== undefined ? Number(pnlRaw) : undefined,
          notes: get('notes') || '',
          status: (result ? 'CLOSED' : 'OPEN') as Trade['status'],
          createdAt: new Date().toISOString(),
        } as Trade;
      }).filter(t => t.date);
      setApiTrades(mapped);
      setApiSelected(new Set(mapped.filter(t => !existingIds.has(t.id)).map(t => t.id)));
      setApiStatus('done');
    } catch (e: any) {
      setApiError(e.message?.includes('fetch') ? 'CORS blocked — use the CSV method instead (works without API key).' : e.message || 'Connection failed');
      setApiStatus('error');
    }
  };

  const handleApiImport = () => {
    let c = 0;
    apiTrades.forEach(t => { if (apiSelected.has(t.id) && !existingIds.has(t.id)) { addTrade(t); c++; } });
    setApiImportCount(c);
    setApiTrades([]); setApiStatus('idle');
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database size={20} style={{ color: '#f59e0b' }} />
          <h1 className="text-xl" style={{ color: colors.text }}>Import from Notion</h1>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Move your trades from Notion into HU$TLE TRADING. Upload a CSV export — no API key required.
        </p>
      </div>

      {/* Success banner */}
      {(importCount > 0 || apiImportCount > 0) && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <div>
            <p className="text-sm" style={{ color: '#10b981' }}>
              {importCount + apiImportCount} trade{importCount + apiImportCount !== 1 ? 's' : ''} imported successfully!
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSub }}>
              Check your Journal and Dashboard to see them.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl p-1 gap-1" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        {([
          { key: 'csv', label: 'CSV Export (Recommended)', icon: FileText },
          { key: 'api', label: 'Notion API (Advanced)', icon: Database },
        ] as { key: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              background: tab === t.key ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: tab === t.key ? '#f59e0b' : colors.textSub,
              border: tab === t.key ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CSV TAB ─────────────────────────────────────────────────────────── */}

      {tab === 'csv' && (
        <div className="space-y-5">

          {/* How to export guide */}
          <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="px-5 py-4">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: colors.textMuted }}>How to export from Notion (3 clicks)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { n: '1', title: 'Open your trade database', body: 'Go to your Notion page that has your trades table / database.' },
                  { n: '2', title: 'Export as CSV', body: 'Click ··· (top right) → Export → Export format: CSV → Export.' },
                  { n: '3', title: 'Upload it here', body: 'Drag & drop the downloaded .csv file into the box below, or click to browse.' },
                ].map(s => (
                  <div key={s.n} className="flex gap-3 p-3 rounded-lg" style={{ background: colors.inputBg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                      {s.n}
                    </div>
                    <div>
                      <p className="text-xs mb-0.5" style={{ color: colors.text }}>{s.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: colors.textFaint }}>
                <Info size={11} />
                Your Notion columns don't need to match exactly — we auto-detect common names and let you fix any mismatches.
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(['upload', 'map', 'preview'] as CsvStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: csvStep === s ? 'rgba(245,158,11,0.2)' : csvStep === 'preview' && s !== 'preview' ? 'rgba(16,185,129,0.15)' : csvStep === 'map' && s === 'upload' ? 'rgba(16,185,129,0.15)' : colors.inputBg,
                      color: csvStep === s ? '#f59e0b' : colors.textMuted,
                      border: `1px solid ${csvStep === s ? 'rgba(245,158,11,0.4)' : colors.border}`,
                    }}
                  >
                    {(csvStep === 'preview' && s !== 'preview') || (csvStep === 'map' && s === 'upload') ? '✓' : i + 1}
                  </div>
                  <span className="text-xs capitalize hidden sm:block"
                    style={{ color: csvStep === s ? colors.text : colors.textMuted }}>
                    {s === 'upload' ? '1. Upload' : s === 'map' ? '2. Map Columns' : '3. Preview & Import'}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px" style={{ background: colors.border }} />}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1: Upload */}
          {csvStep === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragOver ? '#f59e0b' : colors.border}`,
                background: dragOver ? 'rgba(245,158,11,0.05)' : colors.surface,
              }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Upload size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div className="text-center">
                <p className="text-sm mb-1" style={{ color: colors.text }}>Drop your Notion CSV here</p>
                <p className="text-xs" style={{ color: colors.textMuted }}>or click to browse files</p>
              </div>
              {fileError && (
                <p className="text-xs text-center px-4" style={{ color: '#f87171' }}>{fileError}</p>
              )}
              <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* STEP 2: Column mapper */}
          {csvStep === 'map' && (
            <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <p className="text-sm" style={{ color: colors.text }}>Column Mapping — {fileName}</p>
                  <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    {rows.length} rows detected · auto-matched columns highlighted
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCsvStep('upload'); setFileName(''); }}
                    className="px-3 py-1.5 rounded-lg text-xs" style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                    ← Back
                  </button>
                  <button onClick={handleBuildPreview}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
                    <Eye size={12} /> Preview Trades
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <Wand2 size={13} style={{ color: '#f59e0b' }} />
                  <p className="text-xs" style={{ color: colors.textSub }}>
                    We auto-detected your columns. For each HU$TLE field, pick which Notion column matches. Leave blank to skip.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FIELD_META.map(({ key, label, required, hint }) => {
                    const matched = !!colMap[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: matched ? '#10b981' : required ? '#f87171' : colors.border }} />
                        <div className="w-36 shrink-0">
                          <p className="text-xs" style={{ color: colors.text }}>{label}</p>
                          {required && <p className="text-xs" style={{ color: '#f87171' }}>required</p>}
                        </div>
                        <select
                          value={colMap[key] || ''}
                          onChange={e => setColMap(prev => ({ ...prev, [key]: e.target.value }))}
                          className="flex-1 rounded-lg px-2 py-1.5 text-xs"
                          style={{ background: colors.inputBg, border: `1px solid ${matched ? 'rgba(16,185,129,0.3)' : colors.border}`, color: colors.text, outline: 'none' }}
                        >
                          <option value="">— skip —</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {importError && (
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={13} style={{ color: '#f87171' }} />
                    <p className="text-xs" style={{ color: '#f87171' }}>{importError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {csvStep === 'preview' && (
            <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <div>
                  <p className="text-sm" style={{ color: colors.text }}>
                    {parsedTrades.length} trades ready to import
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                    {selected.size} selected · uncheck any you don't want
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCsvStep('map')}
                    className="px-3 py-1.5 rounded-lg text-xs" style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>
                    ← Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selected.size === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
                  >
                    <Download size={13} /> Import {selected.size} Trades
                  </button>
                </div>
              </div>

              {/* Select all */}
              <div className="px-5 py-2 flex items-center gap-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <input type="checkbox"
                  checked={selected.size === parsedTrades.length}
                  onChange={e => setSelected(e.target.checked ? new Set(parsedTrades.map(t => t.id)) : new Set())}
                  style={{ accentColor: '#f59e0b' }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>Select all / none</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th className="px-4 py-2 w-8" />
                      {['Date', 'Pair', 'Session', 'Strategy', 'Score', 'Result', 'P&L', 'Notes'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider whitespace-nowrap"
                          style={{ color: colors.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTrades.map(t => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(t.id)}
                            onChange={() => setSelected(prev => { const s = new Set(prev); s.has(t.id) ? s.delete(t.id) : s.add(t.id); return s; })}
                            style={{ accentColor: '#f59e0b' }} />
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: colors.textSub }}>{t.date}</td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: colors.text }}>{t.pair}</td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.session}</td>
                        <td className="px-3 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.strategy}</td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: t.score >= 75 ? '#10b981' : t.score >= 55 ? '#eab308' : '#f87171' }}>
                          {t.score}
                        </td>
                        <td className="px-3 py-2.5 text-xs"
                          style={{ color: t.result === 'WIN' ? '#10b981' : t.result === 'LOSS' ? '#f87171' : colors.textSub }}>
                          {t.result || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-sm"
                          style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
                          {t.pnl !== undefined ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl}` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-xs max-w-[160px] truncate" style={{ color: colors.textMuted }}>
                          {t.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── API TAB ──────────────────────────────────────────────────────────── */}

      {tab === 'api' && (
        <div className="space-y-5">
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <Info size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>
              <span style={{ color: '#f59e0b' }}>Note:</span> Notion's API blocks direct browser requests (CORS). This method works best when the CORS proxy is available.
              If it fails, use the <button onClick={() => setTab('csv')} className="underline" style={{ color: '#f59e0b' }}>CSV method</button> instead — it always works.
            </p>
          </div>

          {/* Guide */}
          <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <button onClick={() => setShowGuide(s => !s)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-sm"
              style={{ color: colors.textSub }}>
              <div className="flex items-center gap-2">
                <ExternalLink size={13} style={{ color: '#f59e0b' }} />
                How to get your Notion API token
              </div>
              <ChevronDown size={14} className={`transition-transform ${showGuide ? 'rotate-180' : ''}`} />
            </button>
            {showGuide && (
              <div className="px-5 pb-5 space-y-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <div className="pt-4 space-y-3">
                  {[
                    'Go to notion.so/my-integrations → "New integration" → name it → Submit → copy the token.',
                    'Open your trade database in Notion → ··· menu → Connections → add your integration.',
                    'Copy the database URL from your browser address bar and paste below.',
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs"
                        style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{i + 1}</div>
                      <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inputs */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                Integration Token
              </label>
              <input type="password" placeholder="secret_xxxxxxxxxxxxxxxx"
                value={token} onChange={e => setToken(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>
                Database ID or URL
              </label>
              <input type="text" placeholder="https://www.notion.so/... or just the database ID"
                value={dbId} onChange={e => setDbId(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} />
            </div>

            {apiStatus === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: '#f87171' }}>{apiError}</p>
              </div>
            )}

            <button onClick={handleApiFetch} disabled={apiStatus === 'loading'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
              <RefreshCw size={14} className={apiStatus === 'loading' ? 'animate-spin' : ''} />
              {apiStatus === 'loading' ? 'Connecting…' : 'Fetch Trades from Notion'}
            </button>
          </div>

          {/* API preview */}
          {apiTrades.length > 0 && (
            <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <p className="text-sm" style={{ color: colors.text }}>
                  {apiTrades.length} trades fetched · {apiSelected.size} selected
                </p>
                <button onClick={handleApiImport} disabled={apiSelected.size === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
                  <Download size={13} /> Import {apiSelected.size}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th className="px-4 py-2 w-8" />
                      {['Date', 'Pair', 'Session', 'Score', 'Result', 'P&L'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiTrades.map(t => {
                      const already = existingIds.has(t.id);
                      return (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${colors.rowBorder}`, opacity: already ? 0.4 : 1 }}>
                          <td className="px-4 py-2.5">
                            <input type="checkbox" checked={apiSelected.has(t.id)} disabled={already}
                              onChange={() => setApiSelected(prev => { const s = new Set(prev); s.has(t.id) ? s.delete(t.id) : s.add(t.id); return s; })}
                              style={{ accentColor: '#f59e0b' }} />
                          </td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.date}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: colors.text }}>{t.pair}</td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: colors.textSub }}>{t.session}</td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: t.score >= 75 ? '#10b981' : t.score >= 55 ? '#eab308' : '#f87171' }}>{t.score}</td>
                          <td className="px-3 py-2.5 text-xs" style={{ color: already ? colors.textFaint : t.result === 'WIN' ? '#10b981' : t.result === 'LOSS' ? '#f87171' : colors.textSub }}>
                            {already ? 'Already imported' : (t.result || 'Open')}
                          </td>
                          <td className="px-3 py-2.5 text-sm" style={{ color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#f87171' }}>
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
        </div>
      )}
    </div>
  );
}
