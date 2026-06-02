import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Brain, Target, BarChart2, Shield, Zap, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';
import { calculateScore, getDecision, Trade } from '../data/trades';
import { motion } from 'motion/react';

interface PreTradeScorerProps {
  onLogTrade: (trade: Omit<Trade, 'id' | 'date' | 'result' | 'pnl' | 'rrRatio' | 'beforeScreenshot' | 'afterScreenshot'>) => void;
}

const PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD'] as const;
const SESSIONS = ['New York', 'London', 'Asian'] as const;
const STRATEGIES = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'BOS/ChoCH', 'Breaker Block', 'Mitigation'] as const;
const BAIS_OPTIONS = ['FVG', 'OB', 'FVG + OB', 'Liquidity Sweep', 'Liquidity + FVG', 'FVG + OB + Liquidity', 'BOS', 'ChoCH', 'Nothing'] as const;

function SliderInput({ label, icon: Icon, value, min, max, step = 1, onChange, targetRange, unit = '' }: {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  targetRange: [number, number];
  unit?: string;
}) {
  const [targetMin, targetMax] = targetRange;
  const isInTarget = value >= targetMin && value <= targetMax;
  const pct = ((value - min) / (max - min)) * 100;
  const targetMinPct = ((targetMin - min) / (max - min)) * 100;
  const targetMaxPct = ((targetMax - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-amber-400" />
          <span className="text-sm text-gray-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm px-2 py-0.5 rounded ${isInTarget ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'}`}>
            {value}{unit}
          </span>
          <span className="text-xs text-gray-500">target: {targetMin}-{targetMax}{unit}</span>
        </div>
      </div>
      <div className="relative h-6 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1.5 bg-gray-700 rounded-full">
          {/* Target zone highlight */}
          <div
            className="absolute h-full bg-amber-400/20 rounded-full"
            style={{ left: `${targetMinPct}%`, width: `${targetMaxPct - targetMinPct}%` }}
          />
          {/* Fill */}
          <div
            className={`absolute h-full rounded-full transition-all ${isInTarget ? 'bg-amber-400' : 'bg-gray-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        {/* Thumb visual */}
        <div
          className={`absolute w-4 h-4 rounded-full border-2 transition-all pointer-events-none ${isInTarget ? 'border-amber-400 bg-amber-400/30' : 'border-gray-400 bg-gray-600'}`}
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#1a1a27] border border-[#2a2a3d] text-white text-sm rounded-lg px-3 py-2.5 appearance-none cursor-pointer focus:outline-none focus:border-amber-400/50"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export function PreTradeScorer({ onLogTrade }: PreTradeScorerProps) {
  const [pair, setPair] = useState<Trade['pair']>('XAUUSD');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [trend, setTrend] = useState<Trade['trend']>('BULLISH');
  const [session, setSession] = useState<Trade['session']>('New York');
  const [strategy, setStrategy] = useState<string>('D1/H4 FVG');
  const [bais, setBais] = useState<string>('FVG + OB');
  const [mentalFocus, setMentalFocus] = useState(20);
  const [confluences, setConfluences] = useState(3);
  const [buyLowSellHigh, setBuyLowSellHigh] = useState(20);
  const [biasAlignment, setBiasAlignment] = useState(20);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);

  const score = useMemo(
    () => calculateScore(mentalFocus, confluences, buyLowSellHigh, biasAlignment, riskPercent),
    [mentalFocus, confluences, buyLowSellHigh, biasAlignment, riskPercent]
  );
  const decision = getDecision(score);

  const decisionConfig = {
    TAKE: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
      icon: CheckCircle,
      label: 'TAKE THE TRADE',
      desc: 'Setup matches your winning pattern. Execute with discipline.',
    },
    WAIT: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      glow: 'shadow-amber-500/20',
      icon: Clock,
      label: 'WAIT FOR MORE',
      desc: 'One more confluence or better entry. Patience pays.',
    },
    PASS: {
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      glow: 'shadow-red-500/20',
      icon: XCircle,
      label: 'PASS THIS TRADE',
      desc: "Doesn't match your edge. Protect your capital.",
    },
  };

  const dc = decisionConfig[decision];
  const DecisionIcon = dc.icon;

  const sessionWarning = session === 'London' || session === 'Asian';

  const handleLog = () => {
    onLogTrade({ pair, orderType, trend, session, strategy, bais, mentalFocus, confluences, buyLowSellHigh, biasAlignment, riskPercent, score, decision, notes });
    setLogged(true);
    setTimeout(() => setLogged(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left — Inputs */}
      <div className="space-y-5">
        {/* Setup */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <h3 className="text-white mb-4 flex items-center gap-2">
            <Target size={16} className="text-amber-400" />
            Trade Setup
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Pair" value={pair} options={PAIRS} onChange={(v) => setPair(v as Trade['pair'])} />
            <Select label="Session" value={session} options={SESSIONS} onChange={(v) => setSession(v as Trade['session'])} />
            <Select label="Strategy" value={strategy} options={STRATEGIES} onChange={setStrategy} />
            <Select label="BAIS / Confluence" value={bais} options={BAIS_OPTIONS} onChange={setBais} />
          </div>

          {sessionWarning && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-red-400 text-xs">⚠️ <strong>London/Asian warning:</strong> Your NY win rate is 65% vs 35% in London. Consider waiting.</span>
            </div>
          )}

          {/* Order Type & Trend */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Order Type</label>
              <div className="flex gap-2">
                {(['BUY', 'SELL'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all ${
                      orderType === t
                        ? t === 'BUY' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-red-500/20 border border-red-500/40 text-red-400'
                        : 'bg-[#1a1a27] border border-[#2a2a3d] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {t === 'BUY' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Trend</label>
              <div className="flex gap-1.5">
                {(['BULLISH', 'BEARISH', 'RANGING'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTrend(t)}
                    className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                      trend === t ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-[#1a1a27] border border-[#2a2a3d] text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {t[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 space-y-5">
          <h3 className="text-white flex items-center gap-2">
            <BarChart2 size={16} className="text-amber-400" />
            Quality Metrics
          </h3>

          <SliderInput
            label="Mental Focus"
            icon={Brain}
            value={mentalFocus}
            min={0} max={40}
            onChange={setMentalFocus}
            targetRange={[20, 30]}
          />
          <SliderInput
            label="Confluences"
            icon={Zap}
            value={confluences}
            min={1} max={4}
            onChange={setConfluences}
            targetRange={[3, 4]}
          />
          <SliderInput
            label="Buy Low / Sell High"
            icon={Target}
            value={buyLowSellHigh}
            min={0} max={30}
            onChange={setBuyLowSellHigh}
            targetRange={[20, 25]}
          />
          <SliderInput
            label="Bias Alignment"
            icon={TrendingUp}
            value={biasAlignment}
            min={0} max={30}
            onChange={setBiasAlignment}
            targetRange={[20, 30]}
          />
          <SliderInput
            label="Risk %"
            icon={Shield}
            value={riskPercent}
            min={0.5} max={3}
            step={0.1}
            onChange={setRiskPercent}
            targetRange={[1, 1.5]}
            unit="%"
          />
        </div>

        {/* Notes */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Quick Note</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What do you see? Why are you taking this?"
            className="w-full bg-[#1a1a27] border border-[#2a2a3d] rounded-lg px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-400/50 resize-none h-20"
          />
        </div>
      </div>

      {/* Right — Score + Decision */}
      <div className="space-y-5">
        {/* Score Gauge */}
        <motion.div
          key={score}
          initial={{ scale: 0.97, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={`bg-[#111118] border rounded-2xl p-6 ${dc.bg} shadow-xl ${dc.glow}`}
        >
          <div className="text-center space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-widest">Trade Score</p>

            {/* Circular score */}
            <div className="relative flex items-center justify-center">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="68" fill="none" stroke="#1e1e2e" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="68"
                  fill="none"
                  stroke={decision === 'TAKE' ? '#10b981' : decision === 'WAIT' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 427} 427`}
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-5xl font-bold ${dc.color}`}>{score}</span>
                <span className="text-gray-500 text-xs">/ 100</span>
              </div>
            </div>

            {/* Decision */}
            <div className="flex items-center justify-center gap-2">
              <DecisionIcon size={20} className={dc.color} />
              <span className={`text-xl font-bold ${dc.color}`}>{dc.label}</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">{dc.desc}</p>

            {/* Thresholds */}
            <div className="flex items-center gap-3 justify-center text-xs">
              <span className={`px-2 py-1 rounded ${score >= 75 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>TAKE ≥75</span>
              <span className={`px-2 py-1 rounded ${score >= 55 && score < 75 ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-600'}`}>WAIT 55-74</span>
              <span className={`px-2 py-1 rounded ${score < 55 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-600'}`}>PASS &lt;55</span>
            </div>
          </div>
        </motion.div>

        {/* Breakdown */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <h3 className="text-white mb-4 text-sm">Score Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Mental Focus', val: mentalFocus, max: 40, target: [20,30], weight: 30 },
              { label: 'Confluences', val: confluences, max: 4, target: [3,4], weight: 25 },
              { label: 'Buy Low / Sell High', val: buyLowSellHigh, max: 30, target: [20,25], weight: 20 },
              { label: 'Bias Alignment', val: biasAlignment, max: 30, target: [20,30], weight: 15 },
              { label: 'Risk Management', val: riskPercent, max: 3, target: [1,1.5], weight: 10 },
            ].map(m => {
              const inTarget = m.val >= m.target[0] && m.val <= m.target[1];
              return (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-36 shrink-0">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${inTarget ? 'bg-amber-400' : 'bg-gray-600'}`}
                      style={{ width: `${(m.val / m.max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{m.weight}%</span>
                  <span className={`text-xs w-4 ${inTarget ? 'text-emerald-400' : 'text-red-400'}`}>{inTarget ? '✓' : '✗'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentor Tips */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
          <h3 className="text-white mb-3 text-sm flex items-center gap-2">
            <span className="text-amber-400">🎯</span> Mentor Says
          </h3>
          <div className="space-y-2 text-xs text-gray-400">
            {mentalFocus < 10 && <p className="text-red-400">🚨 Mental focus too low — emotional trades average -$195. STEP AWAY.</p>}
            {session === 'London' && <p className="text-amber-400">⚠️ London session: 35% win rate vs NY 65%. Are you sure?</p>}
            {session === 'Asian' && <p className="text-red-400">🚨 Asian session: Worst performance. Wait for New York.</p>}
            {confluences < 2 && <p className="text-red-400">🚨 Single confluence = 33% win rate. Need at least 3.</p>}
            {riskPercent > 2 && <p className="text-red-400">🚨 Risk above 2% shows negative R:R in your data. Drop to 1%.</p>}
            {score >= 75 && session === 'New York' && <p className="text-emerald-400">✅ This matches your 60%+ winning pattern. Execute with discipline.</p>}
            {score >= 75 && confluences >= 3 && <p className="text-emerald-400">✅ 3+ confluences = 67% win rate historically.</p>}
            {mentalFocus >= 20 && mentalFocus <= 30 && <p className="text-emerald-400">✅ Mental focus in target zone. You're in the zone.</p>}
            {score < 55 && <p className="text-gray-300">💡 Protect your capital. Your edge only shows at 75+. Wait for the right setup.</p>}
          </div>
        </div>

        {/* Log Button */}
        <button
          onClick={handleLog}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all ${
            logged
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          {logged ? '✓ Trade Logged!' : '📋 Log This Trade Setup'}
        </button>
      </div>
    </div>
  );
}
