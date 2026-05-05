import React, { useState, useMemo } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { CheckCircle2, Clock, XCircle, Brain, TrendingUp, ChevronDown, Flame, Lock } from 'lucide-react';
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

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm pr-8"
          style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: colors.textMuted }} />
      </div>
    </div>
  );
}

function SliderInput({ label, value, min, max, step = 1, onChange, targetMin, targetMax, maxScore }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; targetMin?: number; targetMax?: number; maxScore: number;
}) {
  const { colors } = useTheme();
  const isGood = targetMin !== undefined && targetMax !== undefined && value >= targetMin && value <= targetMax;
  const color = isGood ? '#10b981' : value >= (targetMin ?? 0) * 0.7 ? '#f59e0b' : '#f87171';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color }}>{value}</span>
          <span className="text-xs" style={{ color: colors.textFaint }}>/ {max}</span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
            +{Math.round((value / max) * maxScore)}pts
          </span>
        </div>
      </div>
      <Slider.Root
        value={[value]} min={min} max={max} step={step}
        onValueChange={([v]) => onChange(v)}
        className="relative flex items-center h-5 w-full"
      >
        <Slider.Track className="relative h-1.5 w-full rounded-full" style={{ background: colors.border }}>
          <Slider.Range className="absolute h-full rounded-full transition-all" style={{ background: color }} />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 rounded-full shadow cursor-pointer focus:outline-none transition-transform hover:scale-110"
          style={{ background: color, border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}50` }}
        />
      </Slider.Root>
      {targetMin !== undefined && (
        <p className="text-xs mt-1" style={{ color: colors.textFaint }}>Target: {targetMin}–{targetMax}</p>
      )}
    </div>
  );
}

function ScoreRing({ score, decision }: { score: number; decision: string }) {
  const { colors } = useTheme();
  const r = 72;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = decision === 'TAKE' ? '#10b981' : decision === 'WAIT' ? '#eab308' : '#ef4444';
  const Icon = decision === 'TAKE' ? CheckCircle2 : decision === 'WAIT' ? Clock : XCircle;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={180} height={180} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke={colors.border} strokeWidth={10} />
          <circle
            cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl" style={{ color }}>{score}</span>
          <span className="text-xs" style={{ color: colors.textMuted }}>/ 100</span>
        </div>
      </div>
      <div
        className="flex items-center gap-2 px-5 py-2 rounded-full text-sm"
        style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
      >
        <Icon size={15} />
        <span>{decision}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, maxScore, color }: { label: string; score: number; maxScore: number; color: string }) {
  const { colors } = useTheme();
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: colors.textSub }}>{label}</span>
        <span style={{ color }}>{score} / {maxScore}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: colors.border }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(score / maxScore) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function TradeScorer() {
  const { addTrade } = useTradesContext();
  const { challenge, addChallengeTradeId, dayNumber } = useChallengeContext();
  const { colors } = useTheme();

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

  const breakdown = useMemo(() =>
    calculateScore({ mentalFocus, confluences, buyLowSellHigh, bias, session, risk }),
    [mentalFocus, confluences, buyLowSellHigh, bias, session, risk]
  );

  const mentorTip = useMemo(() =>
    getMentorTip({ mentalFocus, confluences, session, risk, score: breakdown.total }),
    [mentalFocus, confluences, session, risk, breakdown.total]
  );

  const challengeActive = challenge.isActive;
  const challengeBlocked = challengeActive && breakdown.total < 75;

  const handleLog = () => {
    if (challengeBlocked) return;
    const trade: Trade = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      pair, trend, orderType, session, strategy, bais,
      mentalFocus, confluences, buyLowSellHigh, bias, risk, rrRatio,
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
    setBais(''); setNotes('');
    setScreenshotBefore(undefined); setScreenshotBefore2(undefined);
  };

  const tipColor = mentorTip.startsWith('✅') ? '#10b981' : mentorTip.startsWith('⏸') ? '#eab308' : '#f87171';

  return (
    <div className="p-4 lg:p-6">
      {/* Challenge banner */}
      {challengeActive && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Flame size={16} style={{ color: '#f59e0b' }} />
          <div className="flex-1">
            <span className="text-sm" style={{ color: '#f59e0b' }}>Challenge Mode Active</span>
            <span className="ml-3 text-xs" style={{ color: colors.textSub }}>Day {dayNumber} / 30 — Only TAKE setups (score ≥ 75) can be logged</span>
          </div>
          {breakdown.total >= 75 ? (
            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✓ Qualifies
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Lock size={11} /> Score too low
            </span>
          )}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl" style={{ color: colors.text }}>Trade Scorer</h1>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Score your setup before you enter. Let the data guide you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Setup */}
          <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#f59e0b' }}>Trade Setup</p>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Pair" value={pair} options={PAIRS} onChange={setPair} />
              <Select label="Session" value={session} options={SESSIONS} onChange={v => setSession(v as Session)} />
              <Select label="Trend" value={trend} options={TRENDS} onChange={v => setTrend(v as Trend)} />
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>Order Type</label>
                <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
                  {(['Buy', 'Sell'] as OrderType[]).map(o => (
                    <button
                      key={o}
                      onClick={() => setOrderType(o)}
                      className="flex-1 py-2.5 text-sm transition-all"
                      style={{
                        background: orderType === o ? (o === 'Buy' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') : 'transparent',
                        color: orderType === o ? (o === 'Buy' ? '#10b981' : '#f87171') : colors.textMuted,
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <Select label="Strategy" value={strategy} options={STRATEGIES} onChange={v => setStrategy(v as Strategy)} />
              <div>
                <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>Risk %</label>
                <input
                  type="number" min={0.5} max={3} step={0.5} value={risk}
                  onChange={e => setRisk(Number(e.target.value))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm"
                  style={{ background: colors.inputBg, border: `1px solid ${risk > 2 ? '#ef444440' : colors.border}`, color: risk > 2 ? '#f87171' : colors.text, outline: 'none' }}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: colors.textMuted }}>BAIS / Confluences</label>
              <input
                type="text" placeholder="e.g. FVG + OB + Liquidity at 3310..."
                value={bais} onChange={e => setBais(e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-sm"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
              />
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="rounded-xl p-5 space-y-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#f59e0b' }}>Quality Metrics</p>
            <SliderInput label="Mental Focus" value={mentalFocus} min={0} max={30} onChange={setMentalFocus} targetMin={20} targetMax={30} maxScore={30} />
            <SliderInput label="Confluences" value={confluences} min={1} max={4} onChange={setConfluences} targetMin={3} targetMax={4} maxScore={25} />
            <SliderInput label="Buy Low / Sell High" value={buyLowSellHigh} min={0} max={30} onChange={setBuyLowSellHigh} targetMin={20} targetMax={30} maxScore={25} />
            <SliderInput label="Bias Alignment" value={bias} min={0} max={30} onChange={setBias} targetMin={20} targetMax={30} maxScore={20} />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>R:R Ratio</label>
                <span className="text-sm" style={{ color: colors.text }}>{rrRatio}:1</span>
              </div>
              <input
                type="range" min={1} max={5} step={0.5} value={rrRatio}
                onChange={e => setRrRatio(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#f59e0b' }}
              />
            </div>
          </div>

          {/* Screenshots */}
          <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#f59e0b' }}>Chart Screenshots — Before Entry</p>
            <div className="grid grid-cols-2 gap-4">
              <ImageUpload label="Before #1" hint="Main chart" value={screenshotBefore} onChange={setScreenshotBefore} />
              <ImageUpload label="Before #2" hint="Higher timeframe" value={screenshotBefore2} onChange={setScreenshotBefore2} />
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#f59e0b' }}>Notes</p>
            <textarea
              rows={3} placeholder="What do you see in the structure? Why are you considering this trade?"
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
              style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text, outline: 'none' }}
            />
          </div>
        </div>

        {/* RIGHT — Live Score */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score ring */}
          <div className="rounded-xl p-5 flex flex-col items-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-4 self-start" style={{ color: '#f59e0b' }}>Live Score</p>
            <ScoreRing score={breakdown.total} decision={breakdown.decision} />
          </div>

          {/* Score breakdown */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>Score Breakdown</p>
            <BreakdownBar label="Mental Focus" score={breakdown.mentalScore} maxScore={30} color="#818cf8" />
            <BreakdownBar label="Confluences" score={breakdown.confluenceScore} maxScore={25} color="#34d399" />
            <BreakdownBar label="Buy Low / Sell High" score={breakdown.blshScore} maxScore={25} color="#60a5fa" />
            <BreakdownBar label="Bias Alignment" score={breakdown.biasScore} maxScore={20} color="#f59e0b" />
            <div className="pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
              <div className="flex justify-between text-xs">
                <span style={{ color: colors.textMuted }}>Session Bonus</span>
                <span style={{ color: breakdown.sessionBonus >= 0 ? '#10b981' : '#f87171' }}>
                  {breakdown.sessionBonus >= 0 ? '+' : ''}{breakdown.sessionBonus}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span style={{ color: colors.textMuted }}>Risk Bonus</span>
                <span style={{ color: breakdown.riskBonus >= 0 ? '#10b981' : '#f87171' }}>
                  {breakdown.riskBonus >= 0 ? '+' : ''}{breakdown.riskBonus}
                </span>
              </div>
            </div>
          </div>

          {/* Mentor tip */}
          <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${tipColor}30` }}>
            <div className="flex items-center gap-2 mb-2">
              <Brain size={14} style={{ color: tipColor }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: tipColor }}>Mentor Says</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>{mentorTip}</p>
          </div>

          {/* Thresholds */}
          <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: colors.textMuted }}>Decision Thresholds</p>
            <div className="space-y-2">
              {[
                { label: 'TAKE', range: '75–100', color: '#10b981' },
                { label: 'WAIT', range: '55–74', color: '#eab308' },
                { label: 'PASS', range: '0–54', color: '#ef4444' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: d.color }}>{d.label}</span>
                  <span className="text-xs ml-auto" style={{ color: colors.textMuted }}>{d.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Log button */}
          <button
            onClick={handleLog}
            disabled={challengeBlocked}
            className="w-full py-3 rounded-xl text-sm transition-all hover:opacity-90 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            style={{
              background: logged
                ? 'rgba(16,185,129,0.2)'
                : challengeBlocked
                  ? 'rgba(107,114,128,0.15)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: logged ? '#10b981' : challengeBlocked ? colors.textMuted : '#000',
              border: logged ? '1px solid #10b981' : challengeBlocked ? `1px solid ${colors.border}` : 'none',
            }}
          >
            {logged ? (
              <><CheckCircle2 size={15} /> Trade Logged!</>
            ) : challengeBlocked ? (
              <><Lock size={15} /> Score must be 75+ for Challenge</>
            ) : (
              <><TrendingUp size={15} /> Log This Trade</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
