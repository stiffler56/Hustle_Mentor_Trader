import React, { useState, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import {
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ChevronDown,
  Flame,
  Lock,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { calculateScore, getMentorTip } from '../utils/scoring';
import { useTradesContext } from '../data/TradesContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { useTheme } from '../data/ThemeContext';
import { ImageUpload } from '../components/ImageUpload';
import type { Session, OrderType, Trend, Strategy, Trade } from '../data/types';

const PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'GBPJPY', 'USDJPY', 'BTCUSD'];
const SESSIONS: Session[] = ['New York', 'London', 'Tokyo', 'Sydney'];
const TRENDS: Trend[] = ['Bullish', 'Bearish', 'Ranging'];
const STRATEGIES: Strategy[] = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'ICT Concept', 'Support/Resistance', 'Other'];

function Select({
  label,
  value,
  options,
  onChange,
  isDayMode,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  isDayMode?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]'}`}>
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-lg px-3 py-2.5 text-sm pr-8 border transition-colors cursor-pointer outline-none focus:border-[#5D5FEF] ${
            isDayMode
              ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827]'
              : 'bg-[#0F1013] border-[#1E2026] text-white'
          }`}
        >
          {options.map((o) => (
            <option key={o} value={o} className={isDayMode ? 'bg-white text-[#111827]' : 'bg-[#131418] text-white'}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CA3AF]"
        />
      </div>
    </div>
  );
}

function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  targetMin,
  targetMax,
  maxScore,
  isDayMode,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  targetMin?: number;
  targetMax?: number;
  maxScore: number;
  isDayMode?: boolean;
}) {
  const isGood = targetMin !== undefined && targetMax !== undefined && value >= targetMin && value <= targetMax;
  const ratio = value / max;
  const pts = Math.round(ratio * maxScore);
  const color = ratio >= 0.8 ? (isDayMode ? '#059669' : '#10B981') : ratio >= 0.5 ? '#5D5FEF' : (isDayMode ? '#DC2626' : '#F87171');

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={`text-xs font-semibold uppercase tracking-wide ${isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]'}`}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${isDayMode ? 'text-[#111827]' : 'text-white'}`}>{value}</span>
          <span className={`text-xs font-normal ${isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]'}`}>/ {max}</span>
          <span
            className={`text-xs font-mono px-2 py-0.5 rounded font-semibold border ${
              ratio >= 0.8
                ? isDayMode
                  ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                  : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                : ratio >= 0.5
                ? isDayMode
                  ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/30'
                  : 'bg-[#181A20] text-[#6366F1] border-[#6366F1]/30'
                : isDayMode
                ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
            }`}
          >
            +{pts}pts
          </span>
        </div>
      </div>
      <Slider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="relative flex items-center h-5 w-full cursor-pointer"
      >
        <Slider.Track className={`relative h-2 w-full rounded-full border ${isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'}`}>
          <Slider.Range className="absolute h-full rounded-full transition-all" style={{ background: color }} />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 rounded-full shadow-md cursor-pointer focus:outline-none transition-transform hover:scale-110"
          style={{ background: '#FFFFFF', border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}80` }}
        />
      </Slider.Root>
      {targetMin !== undefined && (
        <div className={`flex items-center justify-between text-xs mt-1 ${isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]'}`}>
          <span>Target: {targetMin}–{targetMax}</span>
          {isGood && <span className={`font-semibold ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>✓ Optimal Zone</span>}
        </div>
      )}
    </div>
  );
}

function LiveScoreCard({ score, decision, isDayMode }: { score: number; decision: string; isDayMode?: boolean }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color = decision === 'TAKE' ? (isDayMode ? '#059669' : '#10B981') : decision === 'WAIT' ? '#F59E0B' : (isDayMode ? '#DC2626' : '#F87171');
  const Icon = decision === 'TAKE' ? CheckCircle2 : decision === 'WAIT' ? Clock : XCircle;

  return (
    <div className={`rounded-xl p-5 shadow-xs flex flex-col items-center border ${
      isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white'
    }`}>
      <div className="w-full flex items-center justify-between mb-4">
        <span className={`text-xs font-bold uppercase tracking-wider ${isDayMode ? 'text-[#111827]' : 'text-white'}`}>
          Live Score
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
          isDayMode
            ? 'bg-[#EEF0FF] text-[#5D5FEF] border-[#5D5FEF]/30'
            : 'bg-[#181A20] text-[#6366F1] border-[#1E2026]'
        }`}>
          REAL-TIME
        </span>
      </div>

      {/* SVG Circular Progress Gauge */}
      <div className="relative my-2">
        <svg width={176} height={176} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={88} cy={88} r={r} fill="none" stroke="#E2E8F0" strokeWidth={10} className="dark:stroke-[#1E293B]" />
          <circle
            cx={88}
            cy={88}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease',
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">{score}</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ 100</span>
        </div>
      </div>

      {/* Decision Status Badge */}
      <div
        className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mt-2 transition-all shadow-sm border ${
          decision === 'TAKE'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50'
            : decision === 'WAIT'
            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50'
            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/50'
        }`}
      >
        <Icon size={14} />
        <span>Decision: {decision}</span>
      </div>

      {/* Integrated Decision Thresholds Legend */}
      <div className="w-full mt-5 pt-4 border-t border-slate-200 dark:border-[#1E293B]">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">TAKE: 75–100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-amber-700 dark:text-amber-400 font-semibold">WAIT: 55–74</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-red-700 dark:text-red-400 font-semibold">PASS: 0–54</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  score,
  maxScore,
  isDayMode,
}: {
  label: string;
  score: number;
  maxScore: number;
  isDayMode?: boolean;
}) {
  const ratio = score / maxScore;
  const barColor = ratio >= 0.8 ? (isDayMode ? '#059669' : '#10B981') : ratio >= 0.5 ? '#5D5FEF' : (isDayMode ? '#DC2626' : '#F87171');

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 font-medium">
        <span className={isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]'}>{label}</span>
        <span className={`font-mono font-bold ${isDayMode ? 'text-[#111827]' : 'text-white'}`} style={{ color: barColor }}>
          {score} / {maxScore}
        </span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden border ${isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

export default function TradeScorer() {
  const { addTrade } = useTradesContext();
  const { challenge, addChallengeTradeId, dayNumber } = useChallengeContext();
  const { isDayMode } = useTheme();

  const [pair, setPair] = useState('XAUUSD');
  const [session, setSession] = useState<Session>('New York');
  const [trend, setTrend] = useState<Trend>('Bullish');
  const [orderType, setOrderType] = useState<OrderType>('Buy');
  const [strategy, setStrategy] = useState<Strategy>('D1/H4 FVG');
  const [bais, setBais] = useState('');
  const [mentalFocus, setMentalFocus] = useState(20);
  const [confluences, setConfluences] = useState(2);
  const [buyLowSellHigh, setBuyLowSellHigh] = useState(15);
  const [bias, setBias] = useState(15);
  const [risk, setRisk] = useState(1);
  const [rrRatio, setRrRatio] = useState(2);
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);
  const [screenshotBefore, setScreenshotBefore] = useState<string | undefined>();
  const [screenshotBefore2, setScreenshotBefore2] = useState<string | undefined>();

  const breakdown = useMemo(
    () => calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk }),
    [mentalFocus, confluences, buyLowSellHigh, bias, session, risk]
  );

  const mentorTip = useMemo(
    () => getMentorTip({ mentalFocus, confluences, session, risk, score: breakdown.total }),
    [mentalFocus, confluences, session, risk, breakdown.total]
  );

  const challengeActive = challenge.isActive;
  const challengeBlocked = challengeActive && breakdown.total < 75;

  const handleLog = () => {
    if (challengeBlocked) return;
    const trade: Trade = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      pair,
      trend,
      orderType,
      session,
      strategy,
      bais,
      mentalFocus,
      confluences,
      buyLowSellHigh,
      bias,
      risk,
      rrRatio,
      score: breakdown.total,
      decision: breakdown.decision,
      status: 'OPEN',
      notes,
      screenshotBefore,
      screenshotBefore2,
      isChallengedTrade: challengeActive,
      createdAt: new Date().toISOString(),
    };
    addTrade(trade);
    if (challengeActive) addChallengeTradeId(trade.id);
    setLogged(true);
    setTimeout(() => setLogged(false), 3000);
    setBais('');
    setNotes('');
    setScreenshotBefore(undefined);
    setScreenshotBefore2(undefined);
  };

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const textMuted = isDayMode ? 'text-[#9CA3AF]' : 'text-[#525866]';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';

  return (
    <div className={`p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 min-h-full font-sans ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium mb-1">
            <span className={textSecondary}>Tools</span>
            <span className={textMuted}>/</span>
            <span className={`font-semibold ${textPrimary}`}>Trade Scorer</span>
          </div>
          <h1 className={`text-2xl lg:text-3xl font-black tracking-tight ${textPrimary}`}>
            Pre-Trade Quality Scorer
          </h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            Score your setup objectively before entry to protect account capital and drawdown rules.
          </p>
        </div>

        {challengeActive && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs bg-amber-500/10 border border-amber-500/30">
            <Flame size={14} className="text-amber-500" />
            <div>
              <span className="font-semibold text-amber-500">30-Day Challenge: Day {dayNumber}</span>
              <span className={`ml-1.5 hidden md:inline ${textSecondary}`}>• Min Score 75 required</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* LEFT COLUMN — Trade Parameters & Inputs */}
        <div className="lg:col-span-3 space-y-5">
          {/* Trade Setup Section */}
          <div className={`rounded-xl p-5 shadow-xs border ${cardBg}`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>
                Trade Setup
              </p>
              <span className={`text-xs font-medium ${textSecondary}`}>Market Execution Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Pair / Asset" value={pair} options={PAIRS} onChange={setPair} isDayMode={isDayMode} />
              <Select
                label="Trading Session"
                value={session}
                options={SESSIONS}
                onChange={(v) => setSession(v as Session)}
                isDayMode={isDayMode}
              />
              <Select
                label="Market Trend"
                value={trend}
                options={TRENDS}
                onChange={(v) => setTrend(v as Trend)}
                isDayMode={isDayMode}
              />

              {/* Order Type Toggle */}
              <div>
                <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${textSecondary}`}>
                  Order Type
                </label>
                <div className={`flex rounded-lg overflow-hidden p-0.5 border ${subCardBg}`}>
                  {(['Buy', 'Sell'] as OrderType[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOrderType(o)}
                      className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        orderType === o
                          ? o === 'Buy'
                            ? isDayMode
                              ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                              : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                            : isDayMode
                            ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                            : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                          : `${textSecondary} hover:${textPrimary} border border-transparent`
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <Select
                label="Strategy Playbook"
                value={strategy}
                options={STRATEGIES}
                onChange={(v) => setStrategy(v as Strategy)}
                isDayMode={isDayMode}
              />

              {/* Risk Percentage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`block text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
                    Account Risk %
                  </label>
                  <span
                    className={`text-xs font-mono font-medium ${risk > 2 ? (isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]') : textSecondary}`}
                  >
                    {risk > 2 ? 'High Risk (>2%)' : 'Standard Risk'}
                  </span>
                </div>
                <input
                  type="number"
                  min={0.5}
                  max={3}
                  step={0.5}
                  value={risk}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRisk(Number(e.target.value))}
                  className={`w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-[#5D5FEF] ${
                    isDayMode
                      ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827]'
                      : 'bg-[#0F1013] border-[#1E2026] text-white'
                  }`}
                  style={{
                    borderColor: risk > 2 ? (isDayMode ? '#DC2626' : '#F87171') : undefined,
                    color: risk > 2 ? (isDayMode ? '#DC2626' : '#F87171') : undefined,
                  }}
                />
              </div>
            </div>

            {/* BAIS / Key Confluences */}
            <div className="mt-4">
              <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${textSecondary}`}>
                Key Narrative / Confluences
              </label>
              <input
                type="text"
                placeholder="e.g. D1 FVG tap + H4 liquidity sweep + M15 MSS confirmation..."
                value={bais}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBais(e.target.value)}
                className={`w-full rounded-lg px-3 py-2.5 text-sm border transition-colors outline-none focus:border-[#5D5FEF] ${
                  isDayMode
                    ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827] placeholder:text-[#9CA3AF]'
                    : 'bg-[#0F1013] border-[#1E2026] text-white placeholder:text-[#525866]'
                }`}
              />
            </div>
          </div>

          {/* Quality Metrics */}
          <div className={`rounded-xl p-5 space-y-5 shadow-xs border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>
                Quality Metrics
              </p>
              <span className={`text-xs font-medium ${textSecondary}`}>Execution Discipline</span>
            </div>

            <SliderInput
              label="Mental Focus & Clarity"
              value={mentalFocus}
              min={0}
              max={30}
              onChange={setMentalFocus}
              targetMin={20}
              targetMax={30}
              maxScore={30}
              isDayMode={isDayMode}
            />

            <SliderInput
              label="Confluence Count"
              value={confluences}
              min={1}
              max={4}
              onChange={setConfluences}
              targetMin={3}
              targetMax={4}
              maxScore={25}
              isDayMode={isDayMode}
            />

            <SliderInput
              label="Buy Low / Sell High (Discount / Premium)"
              value={buyLowSellHigh}
              min={0}
              max={30}
              onChange={setBuyLowSellHigh}
              targetMin={20}
              targetMax={30}
              maxScore={25}
              isDayMode={isDayMode}
            />

            <SliderInput
              label="Higher Timeframe Bias Alignment"
              value={bias}
              min={0}
              max={30}
              onChange={setBias}
              targetMin={20}
              targetMax={30}
              maxScore={20}
              isDayMode={isDayMode}
            />

            {/* R:R Ratio Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
                  Risk / Reward Ratio
                </label>
                <span className={`text-sm font-bold font-mono ${textPrimary}`}>
                  {rrRatio.toFixed(1)} : 1
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={rrRatio}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRrRatio(Number(e.target.value))}
                className={`w-full h-2 rounded-full appearance-none cursor-pointer border ${
                  isDayMode ? 'bg-[#E5E4E2] border-[#E5E4E2]' : 'bg-[#0B0C0E] border-[#1E2026]'
                }`}
                style={{ accentColor: '#5D5FEF' }}
              />
              <div className={`flex justify-between text-[11px] mt-1 ${textMuted}`}>
                <span>1:1</span>
                <span className={`font-medium ${textSecondary}`}>2:1 (Target)</span>
                <span>3:1</span>
                <span>4:1</span>
                <span>5:1</span>
              </div>
            </div>
          </div>

          {/* Chart Screenshots */}
          <div className={`rounded-xl p-5 shadow-xs border ${cardBg}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${textPrimary}`}>
              Chart Screenshots — Before Entry
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label="Execution Chart"
                hint="Entry timeframe (M5 / M15)"
                value={screenshotBefore}
                onChange={setScreenshotBefore}
              />
              <ImageUpload
                label="Higher Timeframe"
                hint="HTF structure (H1 / H4 / D1)"
                value={screenshotBefore2}
                onChange={setScreenshotBefore2}
              />
            </div>
          </div>

          {/* Notes */}
          <div className={`rounded-xl p-5 shadow-xs border ${cardBg}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${textPrimary}`}>
              Trade Notes & Execution Rationale
            </p>
            <textarea
              rows={3}
              placeholder="What structural signals did you observe? What is your invalidation point?"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className={`w-full rounded-lg text-sm p-3.5 outline-none transition-all resize-none border focus:border-[#5D5FEF] ${
                isDayMode
                  ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827] placeholder:text-[#9CA3AF]'
                  : 'bg-[#0F1013] border-[#1E2026] text-white placeholder:text-[#525866]'
              }`}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — Live Performance Score & Action Hub */}
        <div className="lg:col-span-2 space-y-5">
          {/* Consolidated Live Score Card */}
          <LiveScoreCard score={breakdown.total} decision={breakdown.decision} isDayMode={isDayMode} />

          {/* Score Breakdown Section */}
          <div className={`rounded-xl p-5 space-y-4 shadow-xs border ${cardBg}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>
                Score Breakdown
              </p>
              <span className={`text-xs font-mono ${textSecondary}`}>Max 100 pts</span>
            </div>

            <div className="space-y-3">
              <BreakdownBar label="Mental Focus" score={breakdown.mentalScore} maxScore={30} isDayMode={isDayMode} />
              <BreakdownBar label="Confluences" score={breakdown.confluenceScore} maxScore={25} isDayMode={isDayMode} />
              <BreakdownBar label="Discount / Premium (BLSH)" score={breakdown.blshScore} maxScore={25} isDayMode={isDayMode} />
              <BreakdownBar label="Bias Alignment" score={breakdown.biasScore} maxScore={20} isDayMode={isDayMode} />
            </div>

            {/* Bonus Pill Rows */}
            <div className={`pt-3 space-y-2 border-t ${isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={textSecondary}>Session Weight ({session})</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-xs font-semibold border ${
                    breakdown.sessionBonus > 0
                      ? isDayMode
                        ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                        : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                      : breakdown.sessionBonus < 0
                      ? isDayMode
                        ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                        : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
                      : isDayMode
                      ? 'bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]'
                      : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026]'
                  }`}
                >
                  {breakdown.sessionBonus > 0 ? `+${breakdown.sessionBonus}` : breakdown.sessionBonus} pts
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={textSecondary}>Risk Modifier</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-xs font-semibold border ${
                    breakdown.riskBonus > 0
                      ? isDayMode
                        ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                        : 'bg-[#0E291E] text-[#10B981] border-[#144634]'
                      : breakdown.riskBonus < 0
                      ? isDayMode
                        ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                        : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
                      : isDayMode
                      ? 'bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]'
                      : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026]'
                  }`}
                >
                  {breakdown.riskBonus > 0 ? `+${breakdown.riskBonus}` : breakdown.riskBonus} pts
                </span>
              </div>
            </div>
          </div>

          {/* AI Mentor Card */}
          <div className={`rounded-xl p-4 shadow-xs border border-l-4 border-l-[#5D5FEF] ${cardBg}`}>
            <div className="flex items-center gap-2 mb-2">
              <Bot size={16} className="text-[#5D5FEF] shrink-0" />
              <p className="text-xs font-bold tracking-wider uppercase text-[#5D5FEF]">
                AI Mentor Feedback
              </p>
            </div>
            <p className={`text-sm leading-relaxed font-normal ${textSecondary}`}>
              {mentorTip}
            </p>
          </div>

          {/* Primary Action Button ("Log This Trade") */}
          <button
            type="button"
            onClick={handleLog}
            disabled={challengeBlocked}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm cursor-pointer ${
              logged
                ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                : challengeBlocked
                ? isDayMode
                  ? 'bg-[#F2F1EF] text-[#9CA3AF] border border-[#E5E4E2] cursor-not-allowed'
                  : 'bg-[#181A20] text-[#525866] border border-[#1E2026] cursor-not-allowed shadow-none'
                : breakdown.total < 55
                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs'
                : 'bg-[#5D5FEF] hover:bg-[#4F51D8] text-white shadow-xs'
            }`}
          >
            {logged ? (
              <>
                <CheckCircle2 size={16} className="text-[#059669]" />
                <span>Trade Logged to Journal!</span>
              </>
            ) : challengeBlocked ? (
              <>
                <Lock size={15} />
                <span>Score must be 75+ for Challenge</span>
              </>
            ) : breakdown.total < 55 ? (
              <>
                <AlertTriangle size={16} />
                <span>Log Trade Anyway (Pass Setup)</span>
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                <span>Log This Trade</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
