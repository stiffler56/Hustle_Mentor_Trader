import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  Trash2, CheckCircle2, ChevronDown, ChevronUp, Search,
  Image, Video, ExternalLink, Play, Calendar, ChevronLeft, ChevronRight, X,
  Pencil,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { ImageUpload } from '../components/ImageUpload';
import { calculateScore } from '../utils/scoring';
import type { Trade, TradeResult, Session, Trend, OrderType, Strategy, Decision } from '../data/types';

// ─── Badges ────────────────────────────────────────────────────────────────
function DecisionBadge({ d }: { d: string }) {
  const s: Record<string, { bg: string; c: string; border: string }> = {
    TAKE: { bg: '#DCFCE7', c: '#059669', border: '#86EFAC' },
    WAIT: { bg: '#FEF3C7', c: '#D97706', border: '#FDE68A' },
    PASS: { bg: '#FEE2E2', c: '#DC2626', border: '#FCA5A5' },
  };
  const x = s[d] ?? s.PASS;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
      style={{ background: x.bg, color: x.c, border: `1px solid ${x.border}` }}
    >
      {d}
    </span>
  );
}

function ResultBadge({ r, status }: { r?: string; status?: string }) {
  if (status === 'OPEN' || !r) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50">
        OPEN
      </span>
    );
  }
  if (r === 'WIN') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#DCFCE7] text-[#059669] border border-[#86EFAC] dark:bg-[#0E291E] dark:text-[#10B981] dark:border-[#144634]">
        WIN
      </span>
    );
  }
  if (r === 'LOSS') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5] dark:bg-[#2D1416] dark:text-[#F87171] dark:border-[#4C1D24]">
        LOSS
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-[#EEF0FF] text-[#5D5FEF] border border-[#5D5FEF]/30">
      {r}
    </span>
  );
}

function SideTag({ orderType }: { orderType: string }) {
  const isLong = orderType?.toLowerCase() === 'buy';
  return (
    <span
      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
        isLong
          ? 'bg-[#E0F2FE] text-[#0284C7] dark:bg-sky-950/40 dark:text-sky-400'
          : 'bg-[#FEF3C7] text-[#D97706] dark:bg-amber-950/40 dark:text-amber-400'
      }`}
      title={isLong ? 'Long (Buy)' : 'Short (Sell)'}
    >
      {isLong ? 'L' : 'S'}
    </span>
  );
}

// ─── Date Range Calendar ───────────────────────────────────────────────────
type DatePreset = 'ALL' | '30D' | '3M' | '1Y' | 'CUSTOM';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toYMD(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

interface DateRangeFilterProps {
  preset: DatePreset;
  customStart: string | null;
  customEnd: string | null;
  onPresetChange: (p: DatePreset) => void;
  onRangeChange: (start: string | null, end: string | null) => void;
}

function DateRangeFilter({ preset, customStart, customEnd, onPresetChange, onRangeChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(() => new Date());
  const [pickStep, setPickStep] = useState<'start' | 'end'>('start');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const applyPreset = (p: DatePreset) => {
    onPresetChange(p);
    if (p !== 'CUSTOM') { onRangeChange(null, null); setPickStep('start'); }
    if (p !== 'CUSTOM') setOpen(false);
  };

  const handleDayClick = (dateStr: string) => {
    if (pickStep === 'start') {
      onRangeChange(dateStr, null);
      setPickStep('end');
    } else {
      if (customStart && dateStr < customStart) {
        onRangeChange(dateStr, customStart);
      } else {
        onRangeChange(customStart, dateStr);
      }
      setPickStep('start');
      onPresetChange('CUSTOM');
    }
  };

  const clearCustom = () => {
    onPresetChange('ALL');
    onRangeChange(null, null);
    setPickStep('start');
  };

  // Build calendar days
  const year = calMonth.getFullYear();
  const mon = calMonth.getMonth();
  const firstWeekDay = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const calDays: (number | null)[] = [
    ...Array(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getDayStr = (d: number) => `${year}-${pad(mon + 1)}-${pad(d)}`;
  const isStart = (d: number) => getDayStr(d) === customStart;
  const isEnd = (d: number) => getDayStr(d) === customEnd;
  const isInRange = (d: number) => {
    if (!customStart || !customEnd) return false;
    const s = getDayStr(d);
    return s > customStart && s < customEnd;
  };
  const isToday = (d: number) => getDayStr(d) === toYMD(new Date());

  // Label for the toggle button
  const getLabel = () => {
    if (preset === '30D') return 'Last 30 Days';
    if (preset === '3M') return 'Last 3 Months';
    if (preset === '1Y') return 'Last Year';
    if (preset === 'CUSTOM') {
      const from = customStart ? customStart.slice(5) : '?';
      const to = customEnd ? customEnd.slice(5) : '…';
      return `${from} → ${to}`;
    }
    return 'All Dates';
  };

  const hasFilter = preset !== 'ALL';

  return (
    <div className="relative" ref={wrapRef}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
        style={{
          background: hasFilter ? 'rgba(245,158,11,0.12)' : '#0d1117',
          border: `1px solid ${hasFilter ? 'rgba(245,158,11,0.35)' : '#1c2333'}`,
          color: hasFilter ? '#f59e0b' : '#9ca3af',
        }}
      >
        <Calendar size={12} />
        <span>{getLabel()}</span>
        {hasFilter && (
          <span
            onClick={e => { e.stopPropagation(); clearCustom(); }}
            className="flex items-center justify-center rounded-full hover:bg-amber-400/20 transition-colors"
            style={{ width: 14, height: 14 }}
          >
            <X size={10} />
          </span>
        )}
        {!hasFilter && <ChevronDown size={12} />}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute top-full mt-2 left-0 z-40 rounded-xl p-4 shadow-2xl"
          style={{
            background: '#0a0e1a',
            border: '1px solid #1c2333',
            minWidth: 300,
          }}
        >
          {/* Quick preset chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {([
              { key: 'ALL', label: 'All' },
              { key: '30D', label: '30 Days' },
              { key: '3M',  label: '3 Months' },
              { key: '1Y',  label: '1 Year' },
            ] as { key: DatePreset; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: preset === key ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${preset === key ? 'rgba(245,158,11,0.4)' : '#1c2333'}`,
                  color: preset === key ? '#f59e0b' : '#9ca3af',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
            <span className="text-xs" style={{ color: '#4b5563' }}>Custom Range</span>
            <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCalMonth(new Date(year, mon - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/5"
              style={{ color: '#6b7280' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm" style={{ color: '#e5e7eb' }}>
              {MONTH_NAMES[mon]} {year}
            </span>
            <button
              onClick={() => setCalMonth(new Date(year, mon + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-white/5"
              style={{ color: '#6b7280' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-xs py-1" style={{ color: '#4b5563' }}>{d}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calDays.map((day, idx) => (
              <div key={idx} className="flex items-center justify-center">
                {day ? (
                  <button
                    onClick={() => handleDayClick(getDayStr(day))}
                    className="w-8 h-8 rounded-full text-xs transition-all flex items-center justify-center relative"
                    style={{
                      background: isStart(day) || isEnd(day)
                        ? '#f59e0b'
                        : isInRange(day)
                        ? 'rgba(245,158,11,0.15)'
                        : 'transparent',
                      color: isStart(day) || isEnd(day)
                        ? '#000'
                        : isInRange(day)
                        ? '#f59e0b'
                        : isToday(day)
                        ? '#f59e0b'
                        : '#e5e7eb',
                      outline: isToday(day) && !isStart(day) && !isEnd(day) ? '1px solid rgba(245,158,11,0.4)' : 'none',
                    }}
                  >
                    {day}
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {/* Selection hint */}
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #1c2333' }}>
            {preset === 'CUSTOM' && customStart ? (
              <div className="flex items-center justify-between">
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: '#4b5563' }}>From:</span>
                    <span style={{ color: '#f59e0b' }}>{customStart}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: '#4b5563' }}>To:</span>
                    <span style={{ color: customEnd ? '#f59e0b' : '#4b5563' }}>{customEnd ?? '— pick end date'}</span>
                  </div>
                </div>
                {customStart && customEnd && (
                  <button
                    onClick={() => setOpen(false)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#000' }}
                  >
                    Apply
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-center" style={{ color: '#4b5563' }}>
                {pickStep === 'start' ? 'Click a day to set start date' : 'Now click the end date'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Log Result Modal ──────────────────────────────────────────────────────
function LogResultModal({
  trade, onClose, onSave,
}: {
  trade: Trade;
  onClose: () => void;
  onSave: (result: TradeResult, pnl: number, notes: string, screenshotAfter?: string, screenshotAfter2?: string, reviewVideoUrl?: string) => void;
}) {
  const { colors } = useTheme();
  const [result, setResult] = useState<TradeResult>('WIN');
  const [pnl, setPnl] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotAfter, setScreenshotAfter] = useState<string | undefined>();
  const [screenshotAfter2, setScreenshotAfter2] = useState<string | undefined>();
  const [reviewVideoUrl, setReviewVideoUrl] = useState('');

  const getVideoPlatform = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('loom.com')) return 'Loom';
    if (url.includes('tradingview.com')) return 'TradingView';
    if (url.includes('vimeo.com')) return 'Vimeo';
    return 'Video';
  };
  const platform = getVideoPlatform(reviewVideoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative rounded-2xl p-6 w-full max-w-md overflow-y-auto" style={{ background: colors.surface, border: `1px solid ${colors.border}`, maxHeight: '90vh' }}>
        <h3 className="text-base mb-1" style={{ color: colors.text }}>Log Trade Result</h3>
        <p className="text-xs mb-5" style={{ color: colors.textMuted }}>{trade.pair} · {trade.date} · {trade.session}</p>

        {/* Result picker */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>Result</label>
          <div className="flex gap-2">
            {(['WIN', 'LOSS', 'BE'] as TradeResult[]).map(r => {
              const rc: Record<string, { active: string; border: string }> = {
                WIN: { active: 'rgba(16,185,129,0.2)', border: '#10b981' },
                LOSS: { active: 'rgba(239,68,68,0.2)', border: '#f87171' },
                BE: { active: 'rgba(96,165,250,0.2)', border: '#60a5fa' },
              };
              const c = rc[r];
              return (
                <button key={r} onClick={() => setResult(r)} className="flex-1 py-2 rounded-lg text-sm transition-all"
                  style={{ background: result === r ? c.active : 'transparent', border: `1px solid ${result === r ? c.border : colors.border}`, color: result === r ? c.border : colors.textMuted }}>
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* P&L */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>P&L ($)</label>
          <input type="number" placeholder={result === 'WIN' ? '+312' : result === 'LOSS' ? '-195' : '0'}
            value={pnl} onChange={e => setPnl(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm"
            style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} />
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>What happened?</label>
          <textarea rows={2} placeholder="Why did it win or lose? What did you learn?"
            value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm resize-none"
            style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }} />
        </div>

        {/* Review Video URL */}
        <div className="mb-4">
          <label className="block text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: colors.textMuted }}>
            <Video size={11} /> Review Video Link
          </label>
          <div className="relative">
            <input type="url" placeholder="https://youtube.com/... or loom.com/..."
              value={reviewVideoUrl} onChange={e => setReviewVideoUrl(e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm pr-10"
              style={{ background: colors.inputBg, border: `1px solid ${platform ? '#7c3aed' : colors.border}`, color: colors.text, outline: 'none' }} />
            {platform && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>{platform}</span>
            )}
          </div>
          {reviewVideoUrl && !platform && (
            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>YouTube, Loom, TradingView, Vimeo supported</p>
          )}
        </div>

        {/* After screenshots */}
        <div className="mb-5 space-y-3">
          <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>Chart Screenshots — After Exit</p>
          <div className="grid grid-cols-2 gap-3">
            <ImageUpload label="After #1" hint="Exit chart" value={screenshotAfter} onChange={setScreenshotAfter} />
            <ImageUpload label="After #2" hint="Higher timeframe" value={screenshotAfter2} onChange={setScreenshotAfter2} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm"
            style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>Cancel</button>
          <button onClick={() => onSave(result, Number(pnl) || 0, notes, screenshotAfter, screenshotAfter2, reviewVideoUrl || undefined)}
            className="flex-1 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
            <CheckCircle2 size={14} /> Save Result
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Trade Modal ──────────────────────────────────────────────────────
function EditTradeModal({ trade, onClose, onSave }: {
  trade: Trade;
  onClose: () => void;
  onSave: (updates: Partial<Trade>) => void;
}) {
  const { colors } = useTheme();

  // Basic fields
  const [date, setDate]             = useState(trade.date);
  const [pair, setPair]             = useState(trade.pair);
  const [orderType, setOrderType]   = useState<OrderType>(trade.orderType);
  const [trend, setTrend]           = useState<Trend>(trade.trend);
  const [session, setSession]       = useState<Session>(trade.session);
  const [strategy, setStrategy]     = useState<Strategy>(trade.strategy);
  const [bais, setBais]             = useState(trade.bais || '');

  // Metrics
  const [mentalFocus,    setMentalFocus]    = useState(trade.mentalFocus);
  const [confluences,    setConfluences]    = useState(trade.confluences);
  const [buyLowSellHigh, setBuyLowSellHigh] = useState(trade.buyLowSellHigh);
  const [bias,           setBias]           = useState(trade.bias);
  const [risk,           setRisk]           = useState(String(trade.risk));
  const [rrRatio,        setRrRatio]        = useState(String(trade.rrRatio));

  // Result
  const [result,   setResult]   = useState<TradeResult | ''>(trade.result ?? '');
  const [pnl,      setPnl]      = useState(trade.pnl !== undefined ? String(trade.pnl) : '');
  const [notes,    setNotes]    = useState(trade.notes || '');
  const [videoUrl, setVideoUrl] = useState(trade.reviewVideoUrl || '');

  // Screenshots
  const [ssBefore1,  setSsBefore1]  = useState<string | undefined>(trade.screenshotBefore);
  const [ssBefore2,  setSsBefore2]  = useState<string | undefined>(trade.screenshotBefore2);
  const [ssAfter1,   setSsAfter1]   = useState<string | undefined>(trade.screenshotAfter);
  const [ssAfter2,   setSsAfter2]   = useState<string | undefined>(trade.screenshotAfter2);

  // Live score
  const breakdown = calculateScore({
    mentalFocus, confluences, buyLowSellHigh, bias,
    session, risk: Number(risk) || 1,
  });
  const score = breakdown.total;
  const decision = breakdown.decision;

  const decisionColor = decision === 'TAKE' ? '#10b981' : decision === 'WAIT' ? '#eab308' : '#f87171';
  const scoreColor    = score >= 75 ? '#10b981' : score >= 55 ? '#eab308' : '#f87171';

  const getVideoPlatform = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('loom.com'))         return 'Loom';
    if (url.includes('tradingview.com'))  return 'TradingView';
    if (url.includes('vimeo.com'))        return 'Vimeo';
    return 'Video';
  };

  const handleSave = () => {
    const resultVal = result || undefined;
    onSave({
      date, pair, orderType, trend, session, strategy, bais,
      mentalFocus, confluences, buyLowSellHigh, bias,
      risk: Number(risk) || 1,
      rrRatio: Number(rrRatio) || 2,
      score, decision,
      result: resultVal as TradeResult | undefined,
      pnl: pnl !== '' ? Number(pnl) : undefined,
      notes,
      status: resultVal ? 'CLOSED' : 'OPEN',
      reviewVideoUrl: videoUrl || undefined,
      screenshotBefore:  ssBefore1,
      screenshotBefore2: ssBefore2,
      screenshotAfter:   ssAfter1,
      screenshotAfter2:  ssAfter2,
    });
  };

  // ── Slider helper ──────────────────────────────────────────────────────
  const Slider = ({ label, value, onChange, max, color }: {
    label: string; value: number; onChange: (v: number) => void; max: number; color: string;
  }) => (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs" style={{ color: colors.textMuted }}>{label}</span>
        <span className="text-xs" style={{ color }}>{value} / {max}</span>
      </div>
      <input type="range" min={0} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
    </div>
  );

  const inputStyle = {
    background: colors.inputBg,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    outline: 'none',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative rounded-2xl w-full overflow-y-auto"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, maxWidth: 680, maxHeight: '92vh' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
          <div>
            <p className="text-base" style={{ color: colors.text }}>Edit Trade</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
              {trade.pair} · {trade.date} · {trade.session}
            </p>
          </div>
          {/* Live score pill */}
          <div className="flex items-center gap-3">
            <div className="text-center px-3 py-1.5 rounded-xl"
              style={{ background: `${scoreColor}18`, border: `1px solid ${scoreColor}40` }}>
              <p className="text-xs" style={{ color: colors.textMuted }}>Score</p>
              <p className="text-lg leading-none" style={{ color: scoreColor }}>{score}</p>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl"
              style={{ background: `${decisionColor}18`, border: `1px solid ${decisionColor}40` }}>
              <p className="text-xs" style={{ color: colors.textMuted }}>Decision</p>
              <p className="text-sm leading-none" style={{ color: decisionColor }}>{decision}</p>
            </div>
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={18} style={{ color: colors.text }} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Section 1: Trade Details ── */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Trade Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Pair</label>
                <input type="text" value={pair} onChange={e => setPair(e.target.value.toUpperCase())}
                  placeholder="XAUUSD" className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Order Type</label>
                <select value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={selectStyle}>
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Trend</label>
                <select value={trend} onChange={e => setTrend(e.target.value as Trend)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={selectStyle}>
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Ranging</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Session</label>
                <select value={session} onChange={e => setSession(e.target.value as Session)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={selectStyle}>
                  <option>New York</option>
                  <option>London</option>
                  <option>Tokyo</option>
                  <option>Sydney</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Strategy</label>
                <select value={strategy} onChange={e => setStrategy(e.target.value as Strategy)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={selectStyle}>
                  <option>D1/H4 FVG</option>
                  <option>Liquidity</option>
                  <option>Order Block</option>
                  <option>ICT Concept</option>
                  <option>Support/Resistance</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Setup / BAIS Description</label>
              <input type="text" value={bais} onChange={e => setBais(e.target.value)}
                placeholder="e.g. FVG + OB confluence at 3310"
                className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
            </div>
          </div>

          {/* ── Section 2: Quality Metrics ── */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Quality Metrics</p>
            <div className="rounded-xl p-4 space-y-4" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
              <Slider label="Mental Focus" value={mentalFocus} onChange={setMentalFocus} max={30}
                color={mentalFocus >= 20 ? '#10b981' : mentalFocus >= 12 ? '#eab308' : '#f87171'} />
              <Slider label="Confluences" value={confluences} onChange={setConfluences} max={4}
                color={confluences >= 3 ? '#10b981' : confluences >= 2 ? '#eab308' : '#f87171'} />
              <Slider label="Buy Low / Sell High" value={buyLowSellHigh} onChange={setBuyLowSellHigh} max={30}
                color={buyLowSellHigh >= 20 ? '#10b981' : buyLowSellHigh >= 12 ? '#eab308' : '#f87171'} />
              <Slider label="Bias Alignment" value={bias} onChange={setBias} max={30}
                color={bias >= 20 ? '#10b981' : bias >= 12 ? '#eab308' : '#f87171'} />
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>% Risk</label>
                  <input type="number" step="0.5" min="0.1" max="5" value={risk}
                    onChange={e => setRisk(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>R:R Ratio</label>
                  <input type="number" step="0.5" min="0.5" max="20" value={rrRatio}
                    onChange={e => setRrRatio(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm"
                    style={inputStyle} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Result & P&L ── */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Result & P&L</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Result picker */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Result</label>
                <div className="flex gap-2">
                  {(['', 'WIN', 'LOSS', 'BE'] as const).map(r => {
                    const c = r === 'WIN' ? '#10b981' : r === 'LOSS' ? '#f87171' : r === 'BE' ? '#60a5fa' : colors.textMuted;
                    const isActive = result === r;
                    return (
                      <button key={r || 'open'} onClick={() => setResult(r)}
                        className="flex-1 py-2 rounded-lg text-xs transition-all"
                        style={{
                          background: isActive ? `${c}22` : 'transparent',
                          border: `1px solid ${isActive ? c : colors.border}`,
                          color: isActive ? c : colors.textMuted,
                        }}>
                        {r || 'Open'}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* P&L */}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>P&L ($)</label>
                <input type="number" placeholder={result === 'WIN' ? '+312' : result === 'LOSS' ? '-195' : '0'}
                  value={pnl} onChange={e => setPnl(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
              </div>
            </div>
            {/* Notes */}
            <div className="mb-3">
              <label className="block text-xs mb-1.5" style={{ color: colors.textMuted }}>Notes</label>
              <textarea rows={2} placeholder="What happened? What did you learn?"
                value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={inputStyle} />
            </div>
            {/* Review Video */}
            <div>
              <label className="block text-xs mb-1.5 flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                <Video size={11} /> Review Video Link
              </label>
              <div className="relative">
                <input type="url" placeholder="https://youtube.com/... or loom.com/..."
                  value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  className="w-full rounded-lg px-3 py-2.5 text-sm pr-24" style={{
                    ...inputStyle,
                    border: `1px solid ${getVideoPlatform(videoUrl) ? '#7c3aed' : colors.border}`,
                  }} />
                {getVideoPlatform(videoUrl) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                    {getVideoPlatform(videoUrl)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 4: Screenshots ── */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Chart Screenshots</p>
            <div className="space-y-3">
              <p className="text-xs" style={{ color: colors.textMuted }}>Before Entry</p>
              <div className="grid grid-cols-2 gap-3">
                <ImageUpload label="Before #1" hint="Setup chart" value={ssBefore1} onChange={setSsBefore1} />
                <ImageUpload label="Before #2" hint="Higher TF" value={ssBefore2} onChange={setSsBefore2} />
              </div>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>After Exit</p>
              <div className="grid grid-cols-2 gap-3">
                <ImageUpload label="After #1" hint="Exit chart" value={ssAfter1} onChange={setSsAfter1} />
                <ImageUpload label="After #2" hint="Higher TF" value={ssAfter2} onChange={setSsAfter2} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 px-6 py-4"
          style={{ background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
            <CheckCircle2 size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trade Row ─────────────────────────────────────────────────────────────
function TradeRow({ trade, onLogResult, onEdit, onDelete }: {
  trade: Trade;
  onLogResult: (t: Trade) => void;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => void;
}) {
  const { colors, isDayMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const hasScreenshots = trade.screenshotBefore || trade.screenshotBefore2 || trade.screenshotAfter || trade.screenshotAfter2;

  const getVideoPlatform = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('loom.com')) return 'Loom';
    if (url.includes('tradingview.com')) return 'TradingView';
    if (url.includes('vimeo.com')) return 'Vimeo';
    return 'Video';
  };

  const isWin = (trade.pnl ?? 0) > 0 || trade.result === 'WIN';
  const isLoss = (trade.pnl ?? 0) < 0 || trade.result === 'LOSS';
  const pnlPercent = trade.risk ? ((trade.pnl ?? 0) / (trade.risk * 500)) * 100 : ((trade.pnl ?? 0) / 1000) * 100;

  return (
    <>
      <tr
        style={{ borderBottom: `1px solid ${colors.rowBorder}`, cursor: 'pointer' }}
        className={`transition-colors ${isDayMode ? 'hover:bg-[#F9FAFB]' : 'hover:bg-[#181A20]'}`}
        onClick={() => setExpanded(e => !e)}
      >
        {/* 1. Checkbox */}
        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => setIsSelected(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-[#5D5FEF] focus:ring-[#5D5FEF] border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
          />
        </td>

        {/* 2. STATUS Pill */}
        <td className="px-3 py-3 whitespace-nowrap">
          <ResultBadge r={trade.result} status={trade.status} />
        </td>

        {/* 3. OPEN DATE */}
        <td className="px-3 py-3 text-xs font-mono whitespace-nowrap" style={{ color: colors.textSub }}>
          {trade.date}
        </td>

        {/* 4. SYMBOL */}
        <td className="px-3 py-3 whitespace-nowrap font-bold text-xs" style={{ color: colors.text }}>
          <div className="flex items-center gap-1.5">
            <span>{trade.pair}</span>
            {trade.isChallengedTrade && <span className="text-[10px] px-1 rounded bg-amber-500/15 text-amber-500 font-bold">🔥</span>}
            {hasScreenshots && <Image size={11} style={{ color: colors.textMuted }} />}
            {trade.reviewVideoUrl && <Video size={11} className="text-[#5D5FEF]" />}
          </div>
        </td>

        {/* 5. SIDE: L / S Circular Pill */}
        <td className="px-3 py-3 whitespace-nowrap">
          <SideTag orderType={trade.orderType} />
        </td>

        {/* 6. ENTRY & EXIT */}
        <td className="px-3 py-3 font-mono text-xs whitespace-nowrap" style={{ color: colors.text }}>
          <span>{trade.entryPrice ? `$${Number(trade.entryPrice).toFixed(2)}` : '—'}</span>
          <span className="text-[#9CA3AF] mx-1">/</span>
          <span style={{ color: colors.textSub }}>{trade.exitPrice ? `$${Number(trade.exitPrice).toFixed(2)}` : '—'}</span>
        </td>

        {/* 7. SIZE */}
        <td className="px-3 py-3 font-mono text-xs whitespace-nowrap" style={{ color: colors.textSub }}>
          {trade.quantity || 1.0}L
        </td>

        {/* 8. PNL GROSS $ */}
        <td className="px-3 py-3 font-mono text-xs font-black whitespace-nowrap">
          <span style={{ color: isWin ? (isDayMode ? '#059669' : '#10B981') : isLoss ? (isDayMode ? '#DC2626' : '#F87171') : colors.textSub }}>
            {trade.pnl !== undefined ? `${trade.pnl >= 0 ? '+' : ''}$${Math.abs(trade.pnl).toFixed(2)}` : '—'}
          </span>
        </td>

        {/* 9. PNL GROSS % */}
        <td className="px-3 py-3 whitespace-nowrap">
          {trade.pnl !== undefined ? (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                isWin
                  ? isDayMode
                    ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                    : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                  : isLoss
                  ? isDayMode
                    ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                    : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
            </span>
          ) : (
            <span className="text-xs text-[#9CA3AF]">—</span>
          )}
        </td>

        {/* 10. SETUPS & MISTAKES */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#EEF0FF] dark:bg-[#181A20] text-[#5D5FEF] border border-[#5D5FEF]/20">
              {trade.strategy || 'Order Block'}
            </span>
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(trade);
              }}
              className="w-5 h-5 rounded-md flex items-center justify-center bg-[#F2F1EF] dark:bg-[#1E2026] text-[#6B7280] dark:text-[#8E95A5] hover:text-[#5D5FEF] transition-colors"
              title="Tag Setups / Notes"
            >
              <Pencil size={10} />
            </button>
          </div>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1.5">
            {trade.status === 'OPEN' && (
              <button
                onClick={() => onLogResult(trade)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:opacity-90 bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] dark:bg-amber-950/40 dark:text-amber-400"
              >
                Log Result
              </button>
            )}
            <button
              onClick={() => onEdit(trade)}
              className="p-1 text-[#6B7280] hover:text-[#5D5FEF] dark:text-[#8E95A5] dark:hover:text-white transition-colors"
              title="Edit trade"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(trade.id)}
              className="p-1 text-[#DC2626] hover:text-red-700 opacity-60 hover:opacity-100 transition-opacity"
              title="Delete trade"
            >
              <Trash2 size={13} />
            </button>
            <span style={{ color: colors.textFaint }} className="ml-1">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </span>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: `1px solid ${colors.rowBorder}`, background: colors.inputBg }}>
          <td colSpan={11} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Mental Focus', val: `${trade.mentalFocus} / 30` },
                { label: 'Confluences', val: `${trade.confluences}` },
                { label: 'BLSH', val: `${trade.buyLowSellHigh} / 30` },
                { label: 'Bias', val: `${trade.bias} / 30` },
                { label: 'Risk', val: `${trade.risk}%` },
                { label: 'R:R Ratio', val: `${trade.rrRatio}:1` },
                { label: 'BAIS', val: trade.bais || '—' },
                { label: 'Trend', val: trade.trend },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p style={{ color: colors.textMuted }} className="mb-1">{label}</p>
                  <p style={{ color: colors.text }}>{val}</p>
                </div>
              ))}
            </div>
            {trade.notes && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <p className="text-xs mb-1" style={{ color: colors.textMuted }}>Notes</p>
                <p className="text-xs" style={{ color: colors.textSub }}>{trade.notes}</p>
              </div>
            )}
            {hasScreenshots && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                  <Image size={11} /> Chart Screenshots
                </p>
                {(trade.screenshotBefore || trade.screenshotBefore2) && (
                  <div className="mb-3">
                    <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: colors.textFaint }}>Before Entry</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[trade.screenshotBefore, trade.screenshotBefore2].map((src, idx) =>
                        src ? <img key={idx} src={src} className="w-full rounded-lg object-cover cursor-zoom-in"
                          style={{ maxHeight: 180, border: `1px solid ${colors.border}` }}
                          onClick={() => window.open(src, '_blank')} title={`Before #${idx + 1}`} /> : null
                      )}
                    </div>
                  </div>
                )}
                {(trade.screenshotAfter || trade.screenshotAfter2) && (
                  <div>
                    <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: colors.textFaint }}>After Exit</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[trade.screenshotAfter, trade.screenshotAfter2].map((src, idx) =>
                        src ? <img key={idx} src={src} className="w-full rounded-lg object-cover cursor-zoom-in"
                          style={{ maxHeight: 180, border: `1px solid ${colors.border}` }}
                          onClick={() => window.open(src, '_blank')} title={`After #${idx + 1}`} /> : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {trade.reviewVideoUrl && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                  <Video size={11} /> Review Video
                </p>
                <a href={trade.reviewVideoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm transition-all hover:opacity-90"
                  style={{ background: 'rgba(93,95,239,0.12)', border: '1px solid rgba(93,95,239,0.3)', color: '#5D5FEF', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}>
                  <span className="flex items-center justify-center rounded-full" style={{ background: 'rgba(93,95,239,0.25)', width: 28, height: 28, minWidth: 28 }}>
                    <Play size={12} style={{ color: '#5D5FEF', marginLeft: 1 }} />
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#5D5FEF' }}>{getVideoPlatform(trade.reviewVideoUrl)} Review</p>
                    <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: colors.textMuted }}>{trade.reviewVideoUrl}</p>
                  </div>
                  <ExternalLink size={12} style={{ color: '#5D5FEF', marginLeft: 'auto' }} />
                </a>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Journal Page ─────────────────────────────────────────────────────
export default function Journal() {
  const { trades, updateTrade, deleteTrade } = useTradesContext();
  const { colors, isDayMode } = useTheme();
  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [filterResult, setFilterResult] = useState('ALL');
  const [filterSession, setFilterSession] = useState('ALL');
  const [search, setSearch] = useState('');
  const [logTarget, setLogTarget]   = useState<Trade | null>(null);
  const [editTarget, setEditTarget] = useState<Trade | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>(() => {
    return searchParams.get('date') ? 'CUSTOM' : 'ALL';
  });
  const [customStart, setCustomStart] = useState<string | null>(() => {
    return searchParams.get('date') || null;
  });
  const [customEnd, setCustomEnd] = useState<string | null>(() => {
    return searchParams.get('date') || null;
  });

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setDatePreset('CUSTOM');
      setCustomStart(dateParam);
      setCustomEnd(dateParam);
    }
  }, [searchParams]);

  const getDateBounds = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    if (datePreset === '30D') { const s = new Date(now); s.setDate(s.getDate() - 30); return { start: toYMD(s), end: toYMD(now) }; }
    if (datePreset === '3M') { const s = new Date(now); s.setMonth(s.getMonth() - 3); return { start: toYMD(s), end: toYMD(now) }; }
    if (datePreset === '1Y') { const s = new Date(now); s.setFullYear(s.getFullYear() - 1); return { start: toYMD(s), end: toYMD(now) }; }
    if (datePreset === 'CUSTOM' && customStart) return { start: customStart, end: customEnd ?? toYMD(now) };
    return null;
  };

  const filtered = trades.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterResult !== 'ALL' && t.result !== filterResult) return false;
    if (filterSession !== 'ALL' && t.session !== filterSession) return false;
    if (search && !t.pair.toLowerCase().includes(search.toLowerCase()) && !t.strategy.toLowerCase().includes(search.toLowerCase())) return false;
    const bounds = getDateBounds();
    if (bounds && (t.date < bounds.start || t.date > bounds.end)) return false;
    return true;
  });

  const handleLogResult = (result: TradeResult, pnl: number, notes: string, screenshotAfter?: string, screenshotAfter2?: string, reviewVideoUrl?: string) => {
    if (!logTarget) return;
    updateTrade(logTarget.id, { result, pnl, notes: notes || logTarget.notes, screenshotAfter, screenshotAfter2, status: 'CLOSED', closedAt: new Date().toISOString(), reviewVideoUrl });
    setLogTarget(null);
  };

  const handleSaveEdit = (updates: Partial<Trade>) => {
    if (!editTarget) return;
    updateTrade(editTarget.id, updates);
    setEditTarget(null);
  };

  const totalPnL = filtered.filter(t => t.pnl !== undefined).reduce((a, t) => a + (t.pnl ?? 0), 0);
  const wins = filtered.filter(t => (t.pnl ?? 0) > 0 || t.result === 'WIN').length;
  const losses = filtered.filter(t => (t.pnl ?? 0) < 0 || t.result === 'LOSS').length;
  const grossWins = filtered.filter(t => (t.pnl ?? 0) > 0).reduce((a, t) => a + (t.pnl ?? 0), 0);
  const grossLosses = Math.abs(filtered.filter(t => (t.pnl ?? 0) < 0).reduce((a, t) => a + (t.pnl ?? 0), 0));
  const profitFactor = grossLosses === 0 ? (grossWins > 0 ? 9.99 : 0) : Number((grossWins / grossLosses).toFixed(2));
  const totalDecided = wins + losses;
  const winRatePct = totalDecided > 0 ? (wins / totalDecided) * 100 : 0;
  const lossRatePct = totalDecided > 0 ? (losses / totalDecided) * 100 : 0;

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]';

  return (
    <div className={`p-4 lg:p-6 space-y-4 min-h-full font-sans ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {logTarget && <LogResultModal trade={logTarget} onClose={() => setLogTarget(null)} onSave={handleLogResult} />}
      {editTarget && <EditTradeModal trade={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />}

      {/* ── Top Summary Header: TradeZella Minimal KPI Banner ── */}
      <div className={`rounded-xl border p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs ${cardBg}`}>
        {/* Gross P&L */}
        <div className={`flex-1 border-b lg:border-b-0 lg:border-r pb-3 lg:pb-0 lg:pr-6 ${isDayMode ? 'border-[#E5E4E2]' : 'border-[#252830]'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5] mb-1">
            Journal Gross P&L
          </p>
          <div className="flex items-center gap-2.5">
            <span className={`text-2xl font-black font-mono tracking-tight ${totalPnL >= 0 ? (isDayMode ? 'text-[#059669]' : 'text-[#10B981]') : (isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]')}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                totalPnL >= 0
                  ? isDayMode
                    ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                    : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                  : isDayMode
                  ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                  : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
              }`}
            >
              {filtered.length} Trades Logged
            </span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className={`flex-1 border-b lg:border-b-0 lg:border-r pb-3 lg:pb-0 lg:pr-6 ${isDayMode ? 'border-[#E5E4E2]' : 'border-[#252830]'}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5] mb-1">
            Profit Factor
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-mono tracking-tight">
              {profitFactor.toFixed(2)}
            </span>
            <span className="text-xs text-[#6B7280] dark:text-[#8E95A5]">
              Gross: ${grossWins.toFixed(0)} / ${grossLosses.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Win / Loss Ratio Split Bar */}
        <div className="flex-[1.4] flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}>
              Win {winRatePct.toFixed(1)}% | {wins}
            </span>
            <span className={isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}>
              {losses} | Loss {lossRatePct.toFixed(1)}%
            </span>
          </div>
          <div className={`w-full h-2.5 rounded-full overflow-hidden flex p-0.5 gap-0.5 ${isDayMode ? 'bg-[#E5E4E2]' : 'bg-[#1E2026]'}`}>
            <div
              className={`h-full rounded-l-full transition-all duration-500 ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`}
              style={{ width: `${Math.max(winRatePct > 0 ? 5 : 0, winRatePct)}%` }}
            />
            <div
              className={`h-full rounded-r-full transition-all duration-500 ${isDayMode ? 'bg-[#DC2626]' : 'bg-[#F87171]'}`}
              style={{ width: `${Math.max(lossRatePct > 0 ? 5 : 0, lossRatePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className={`rounded-xl border p-3 flex flex-wrap gap-2.5 items-center justify-between shadow-xs ${cardBg}`}>
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]'}`}>
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search pair, setup..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs bg-transparent outline-none w-36 text-inherit"
            />
          </div>

          {/* Date Range */}
          <DateRangeFilter
            preset={datePreset}
            customStart={customStart}
            customEnd={customEnd}
            onPresetChange={setDatePreset}
            onRangeChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
          />

          {/* Status */}
          <div className={`flex rounded-lg overflow-hidden border p-0.5 ${isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]'}`}>
            {(['ALL', 'OPEN', 'CLOSED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                  filterStatus === s
                    ? isDayMode ? 'bg-white text-[#5D5FEF] shadow-xs' : 'bg-[#1E2026] text-white'
                    : 'text-[#6B7280] dark:text-[#8E95A5]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Result */}
          <div className={`flex rounded-lg overflow-hidden border p-0.5 ${isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]'}`}>
            {['ALL', 'WIN', 'LOSS', 'BE'].map(r => (
              <button
                key={r}
                onClick={() => setFilterResult(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                  filterResult === r
                    ? isDayMode ? 'bg-white text-[#5D5FEF] shadow-xs' : 'bg-[#1E2026] text-white'
                    : 'text-[#6B7280] dark:text-[#8E95A5]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-[#6B7280] dark:text-[#8E95A5] font-medium">
          Showing {filtered.length} entries
        </span>
      </div>

      {/* ── Trade Log Table ── */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[11px] font-semibold tracking-wider uppercase ${
                isDayMode
                  ? 'bg-[#FAFAFA] border-[#E5E4E2] text-[#6B7280]'
                  : 'bg-[#0F1013] border-[#1E2026] text-[#8E95A5]'
              }`}>
                <th className="px-3 py-3 w-8">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded text-[#5D5FEF]" readOnly />
                </th>
                <th className="px-3 py-3">STATUS</th>
                <th className="px-3 py-3">OPEN DATE</th>
                <th className="px-3 py-3">SYMBOL</th>
                <th className="px-3 py-3">SIDE</th>
                <th className="px-3 py-3">ENTRY / EXIT</th>
                <th className="px-3 py-3">SIZE</th>
                <th className="px-3 py-3">PNL GROSS $</th>
                <th className="px-3 py-3">PNL %</th>
                <th className="px-3 py-3">SETUPS & MISTAKES</th>
                <th className="px-3 py-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E4E2] dark:divide-[#1E2026]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-[#9CA3AF]">
                    No trades found. Use the Pre-Trade Quality Scorer to log setups.
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <TradeRow
                    key={t.id}
                    trade={t}
                    onLogResult={setLogTarget}
                    onEdit={setEditTarget}
                    onDelete={deleteTrade}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}