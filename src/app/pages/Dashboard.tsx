import React from 'react';
import { Link } from 'react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  LineChart as LineChartIcon,
  Moon,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { TradeCalendar } from '../components/TradeCalendar';
import { useTheme } from '../data/ThemeContext';
import type { Session, Strategy, Trade } from '../data/types';

const PROFIT = '#10b981';
const LOSS = '#f87171';
const WARNING = '#f59e0b';
const INFO = '#60a5fa';

type Tone = 'good' | 'warn' | 'bad' | 'info';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon: React.ElementType;
}

interface Insight {
  title: string;
  body: string;
  action: string;
  tone: Tone;
}

function toneColor(tone: Tone) {
  if (tone === 'good') return PROFIT;
  if (tone === 'bad') return LOSS;
  if (tone === 'info') return INFO;
  return WARNING;
}

function money(value: number) {
  return `${value >= 0 ? '+' : ''}$${Math.round(value).toLocaleString()}`;
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function sortByNewest(a: Trade, b: Trade) {
  return new Date(b.closedAt || b.createdAt || b.date).getTime() - new Date(a.closedAt || a.createdAt || a.date).getTime();
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function winRate(trades: Trade[]) {
  const decided = trades.filter(t => t.result === 'WIN' || t.result === 'LOSS');
  if (!decided.length) return 0;
  return (decided.filter(t => t.result === 'WIN').length / decided.length) * 100;
}

function getBestGroup<T extends string>(trades: Trade[], key: (trade: Trade) => T) {
  const groups = new Map<T, Trade[]>();
  trades.forEach(trade => groups.set(key(trade), [...(groups.get(key(trade)) || []), trade]));

  return [...groups.entries()]
    .map(([name, group]) => ({
      name,
      count: group.length,
      pnl: group.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
      winRate: winRate(group),
    }))
    .sort((a, b) => b.pnl - a.pnl)[0];
}

function makeInsight(closed: Trade[], openTrades: Trade[], reviewQueue: Trade[]): Insight {
  if (closed.length < 3) {
    return {
      title: 'Build your sample first',
      body: 'Log at least three closed trades so the mentor can separate real patterns from noise.',
      action: 'Score the next setup before entry and attach before/after screenshots.',
      tone: 'info',
    };
  }

  const recent = [...closed].sort(sortByNewest).slice(0, 5);
  const recentPnl = recent.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const recentLosses = recent.filter(trade => trade.result === 'LOSS').length;
  const lowScoreLosses = recent.filter(trade => trade.result === 'LOSS' && trade.score < 65).length;
  const bestStrategy = getBestGroup(closed, trade => trade.strategy);
  const bestSession = getBestGroup(closed, trade => trade.session);

  if (recentLosses >= 3 || recentPnl < 0) {
    return {
      title: 'Reduce risk until the next A setup',
      body: `${recentLosses} of your last ${recent.length} closed trades were losses. Your recent P&L is ${money(recentPnl)}.`,
      action: 'Trade half risk or pause live entries until one replay review is completed.',
      tone: 'bad',
    };
  }

  if (lowScoreLosses >= 2) {
    return {
      title: 'Low-score trades are costing attention',
      body: `${lowScoreLosses} recent losses came from setups scored below 65.`,
      action: 'Raise the minimum score threshold before taking another live trade.',
      tone: 'warn',
    };
  }

  if (reviewQueue.length > 0) {
    return {
      title: 'Your screenshots are waiting for review',
      body: `${reviewQueue.length} trade${reviewQueue.length === 1 ? '' : 's'} have screenshot evidence that should be reviewed before the next session.`,
      action: 'Open Trade Replay and write one rule from the before/after comparison.',
      tone: 'warn',
    };
  }

  if (bestStrategy && bestStrategy.count >= 2) {
    return {
      title: `${bestStrategy.name} is your strongest playbook`,
      body: `${bestStrategy.count} closed trades produced ${money(bestStrategy.pnl)} with a ${pct(bestStrategy.winRate)} win rate.`,
      action: 'Prioritize this setup and avoid forcing lower-quality ideas.',
      tone: bestStrategy.pnl >= 0 ? 'good' : 'warn',
    };
  }

  if (bestSession && bestSession.count >= 2) {
    return {
      title: `${bestSession.name} session deserves focus`,
      body: `This session has your clearest data so far with ${bestSession.count} trades and ${money(bestSession.pnl)} net P&L.`,
      action: 'Plan tomorrow around your strongest session window.',
      tone: 'good',
    };
  }

  return {
    title: 'Keep the process tight',
    body: `${openTrades.length} open trade${openTrades.length === 1 ? '' : 's'} and ${closed.length} closed trades are now tracked.`,
    action: 'Use the scorer before entries and replay after exits.',
    tone: 'info',
  };
}

function makeReadiness(closed: Trade[], openTrades: Trade[]) {
  const recent = [...closed].sort(sortByNewest).slice(0, 5);
  const avgFocus = average(recent.map(trade => trade.mentalFocus));
  const avgScore = average(recent.map(trade => trade.score));
  const losses = recent.filter(trade => trade.result === 'LOSS').length;
  const openRisk = openTrades.reduce((sum, trade) => sum + trade.risk, 0);

  let score = 72;
  score += Math.min(12, Math.max(-18, avgScore - 70));
  score += Math.min(8, Math.max(-15, avgFocus - 18));
  score -= losses * 6;
  score -= openRisk > 3 ? 10 : 0;
  score = Math.max(0, Math.min(100, Math.round(score)));

  if (closed.length === 0) {
    return {
      score: 64,
      label: 'Preparation mode',
      tone: 'info' as Tone,
      message: 'No closed trades yet. Start with the scorer and capture a before screenshot.',
    };
  }

  if (score >= 75) {
    return {
      score,
      label: 'Ready, but selective',
      tone: 'good' as Tone,
      message: 'Conditions are stable. Only take setups that match your best rules.',
    };
  }

  if (score >= 55) {
    return {
      score,
      label: 'Wait for confirmation',
      tone: 'warn' as Tone,
      message: 'You can trade, but keep risk controlled and avoid forcing entries.',
    };
  }

  return {
    score,
    label: 'Review before trading',
    tone: 'bad' as Tone,
    message: 'Recent data suggests a review session is smarter than another live entry.',
  };
}

function StatCard({ label, value, sub, tone = 'info', icon: Icon }: StatCardProps) {
  const { colors } = useTheme();
  const color = toneColor(tone);

  return (
    <div className="rounded-xl p-4 min-h-[132px] flex flex-col justify-between" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-widest leading-5" style={{ color: colors.textMuted }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1f` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl leading-tight" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-1 leading-5" style={{ color: colors.textMuted }}>{sub}</p>}
      </div>
    </div>
  );
}

function CommandAction({ to, icon: Icon, label, sub }: { to: string; icon: React.ElementType; label: string; sub: string }) {
  const { colors } = useTheme();
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl p-3 transition-all hover:translate-x-0.5"
      style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.14)' }}>
        <Icon size={18} style={{ color: WARNING }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-5" style={{ color: colors.text }}>{label}</p>
        <p className="text-xs leading-5 truncate" style={{ color: colors.textMuted }}>{sub}</p>
      </div>
      <ArrowRight size={14} className="ml-auto shrink-0" style={{ color: colors.textFaint }} />
    </Link>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const colorMap: Record<string, { bg: string; color: string }> = {
    TAKE: { bg: 'rgba(16,185,129,0.15)', color: PROFIT },
    WAIT: { bg: 'rgba(234,179,8,0.15)', color: '#eab308' },
    PASS: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
  };
  const c = colorMap[decision] ?? colorMap.PASS;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: c.bg, color: c.color }}>
      {decision}
    </span>
  );
}

function ResultBadge({ result }: { result?: string }) {
  const { colors } = useTheme();
  if (!result) return <span className="text-xs" style={{ color: colors.textMuted }}>Open</span>;
  const colorMap: Record<string, { bg: string; color: string }> = {
    WIN: { bg: 'rgba(16,185,129,0.15)', color: PROFIT },
    LOSS: { bg: 'rgba(239,68,68,0.15)', color: LOSS },
    BE: { bg: 'rgba(96,165,250,0.15)', color: INFO },
  };
  const c = colorMap[result] ?? colorMap.BE;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: c.bg, color: c.color }}>
      {result}
    </span>
  );
}

function PnlTooltip({ active, payload, label }: any) {
  const { colors } = useTheme();
  if (!active || !payload?.length) return null;
  const value = payload[0].value || 0;
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.text }}>
      <p style={{ color: colors.textSub }} className="mb-1">{label}</p>
      <p style={{ color: value >= 0 ? PROFIT : LOSS }}>P&L: {money(value)}</p>
    </div>
  );
}

function EmptyCommandCenter() {
  const { colors } = useTheme();
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 p-6 lg:p-8">
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs w-fit mb-5" style={{ color: WARNING, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.24)' }}>
            <Sparkles size={14} />
            New trading journey
          </div>
          <h1 className="text-3xl lg:text-4xl leading-tight max-w-2xl" style={{ color: colors.text }}>
            Your AI trading journal for better entries and cleaner reviews.
          </h1>
          <p className="text-sm lg:text-base mt-4 max-w-2xl leading-7" style={{ color: colors.textSub }}>
            Start by scoring one setup, attach a before screenshot, then close the loop with an after screenshot and replay notes. The dashboard becomes smarter as your trade history grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Link to="/scorer" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
              <Zap size={16} />
              Score First Trade
            </Link>
            <Link to="/journal" className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: colors.inputBg, color: colors.text, border: `1px solid ${colors.border}` }}>
              <BookOpen size={16} />
              Open Journal
            </Link>
          </div>
        </div>
        <div className="grid gap-3 content-center">
          {[
            ['Pre-Trade Scorer', 'Turn setup quality into a clear TAKE / WAIT / PASS decision.'],
            ['Screenshot Review', 'Compare before and after charts to see structure and mistakes.'],
            ['AI Mentor', 'Translate trade history into practical rules.'],
            ['Trade Replay', 'Step through setup, entry, management, and exit.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl p-4" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
              <p className="text-sm" style={{ color: colors.text }}>{title}</p>
              <p className="text-xs mt-1 leading-5" style={{ color: colors.textMuted }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function Dashboard() {
  const { trades } = useTradesContext();
  const { isDayMode, toggleTheme, colors } = useTheme();

  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);
  const openTrades = trades.filter(t => t.status === 'OPEN');
  const wins = closed.filter(t => t.result === 'WIN').length;
  const losses = closed.filter(t => t.result === 'LOSS').length;
  const totalPnL = closed.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const winRateValue = winRate(closed);
  const avgScore = closed.length ? Math.round(average(closed.map(t => t.score))) : Math.round(average(trades.map(t => t.score)));
  const avgFocus = trades.length ? Math.round(average(trades.map(t => t.mentalFocus))) : 0;
  const reviewedTrades = closed.filter(t => Boolean(t.notes?.trim()) && (t.screenshotBefore || t.screenshotAfter));
  const screenshotTrades = trades.filter(t => t.screenshotBefore || t.screenshotBefore2 || t.screenshotAfter || t.screenshotAfter2);
  const reviewQueue = screenshotTrades
    .filter(t => t.status === 'CLOSED' && (!t.notes || !t.screenshotBefore || !t.screenshotAfter))
    .sort(sortByNewest)
    .slice(0, 4);
  const bestStrategy = getBestGroup(closed, trade => trade.strategy as Strategy);
  const bestSession = getBestGroup(closed, trade => trade.session as Session);
  const readiness = makeReadiness(closed, openTrades);
  const insight = makeInsight(closed, openTrades, reviewQueue);
  const recentTrades = [...trades].sort(sortByNewest).slice(0, 6);

  const sorted = [...closed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let cumulative = 0;
  const pnlChartData = sorted.map((trade, index) => {
    cumulative += trade.pnl ?? 0;
    return {
      index,
      label: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnl: Math.round(cumulative),
    };
  });

  const sessions = ['New York', 'London', 'Tokyo', 'Sydney'] as const;
  const sessionData = sessions
    .map(session => {
      const sessionTrades = closed.filter(trade => trade.session === session);
      return {
        session: session === 'New York' ? 'NY' : session === 'London' ? 'LDN' : session.slice(0, 3),
        wr: Math.round(winRate(sessionTrades)),
        count: sessionTrades.length,
      };
    })
    .filter(item => item.count > 0);

  if (trades.length === 0) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <EmptyCommandCenter />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs mb-3" style={{ color: WARNING, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <Brain size={14} />
            AI Trading Command Center
          </div>
          <h1 className="text-2xl lg:text-3xl leading-tight" style={{ color: colors.text }}>Today&apos;s trading plan</h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-90"
            style={{
              background: isDayMode ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.08)',
              border: `1px solid ${isDayMode ? 'rgba(251,191,36,0.3)' : 'rgba(96,165,250,0.2)'}`,
              color: isDayMode ? WARNING : '#93c5fd',
            }}
          >
            {isDayMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDayMode ? 'Day' : 'Night'}</span>
          </button>
          <Link to="/scorer" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
            <Zap size={14} />
            Score Setup
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 lg:gap-4">
        <StatCard label="Net P&L" value={money(totalPnL)} sub={`${closed.length} closed trades`} tone={totalPnL >= 0 ? 'good' : 'bad'} icon={totalPnL >= 0 ? TrendingUp : TrendingDown} />
        <StatCard label="Win Rate" value={pct(winRateValue)} sub={`${wins}W / ${losses}L`} tone={winRateValue >= 55 ? 'good' : winRateValue >= 40 ? 'warn' : 'bad'} icon={Target} />
        <StatCard label="Open Risk" value={`${openTrades.reduce((sum, trade) => sum + trade.risk, 0).toFixed(1)}%`} sub={`${openTrades.length} open trades`} tone={openTrades.length ? 'warn' : 'good'} icon={ShieldCheck} />
        <StatCard label="Avg Score" value={`${avgScore || 0}`} sub={`Focus avg ${avgFocus || 0}/25`} tone={avgScore >= 75 ? 'good' : avgScore >= 60 ? 'warn' : 'bad'} icon={Sparkles} />
        <StatCard label="Reviews" value={`${reviewedTrades.length}/${closed.length}`} sub={`${reviewQueue.length} need attention`} tone={reviewQueue.length ? 'warn' : 'good'} icon={Camera} />
      </div>

      {/* Trade Calendar Heatmap */}
      <TradeCalendar trades={trades} />

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-2xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex flex-col lg:flex-row lg:items-start gap-5 justify-between">

            {/* trading calendar section */}
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${toneColor(insight.tone)}1f` }}>
                  <Sparkles size={19} style={{ color: toneColor(insight.tone) }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>AI Mentor Insight</p>
                  <h2 className="text-xl leading-tight" style={{ color: colors.text }}>{insight.title}</h2>
                </div>
              </div>
              <p className="text-sm leading-7" style={{ color: colors.textSub }}>{insight.body}</p>
              <div className="mt-4 rounded-xl p-4" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: colors.textMuted }}>Next action</p>
                <p className="text-sm leading-6" style={{ color: colors.text }}>{insight.action}</p>
              </div>
            </div>

            <div className="rounded-2xl p-4 min-w-full lg:min-w-[250px]" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm" style={{ color: colors.textSub }}>Readiness</p>
                <span className="text-xs px-2 py-1 rounded-full" style={{ color: toneColor(readiness.tone), background: `${toneColor(readiness.tone)}1f` }}>
                  {readiness.label}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-5xl leading-none" style={{ color: toneColor(readiness.tone) }}>{readiness.score}</p>
                <p className="text-sm mb-1" style={{ color: colors.textMuted }}>/100</p>
              </div>
              <div className="h-2 rounded-full mt-4 overflow-hidden" style={{ background: colors.border }}>
                <div className="h-full rounded-full" style={{ width: `${readiness.score}%`, background: toneColor(readiness.tone) }} />
              </div>
              <p className="text-xs leading-5 mt-3" style={{ color: colors.textMuted }}>{readiness.message}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm" style={{ color: colors.textSub }}>Fast workflow</p>
            <Clock size={16} style={{ color: colors.textMuted }} />
          </div>
          <div className="grid gap-3">
            <CommandAction to="/scorer" icon={Zap} label="Score a setup" sub="Gate every entry before risk goes live" />
            <CommandAction to="/journal" icon={BookOpen} label="Log or close trade" sub="Attach result, notes, and after screenshots" />
            <CommandAction to="/replay" icon={PlayCircle} label="Replay screenshots" sub={`${reviewQueue.length} trade${reviewQueue.length === 1 ? '' : 's'} need review`} />
            <CommandAction to="/ai-mentor" icon={Brain} label="Ask AI Mentor" sub="Convert history into rules" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ color: colors.textSub }}>Equity curve</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Cumulative closed-trade P&L</p>
            </div>
            <LineChartIcon size={18} style={{ color: colors.textMuted }} />
          </div>
          {pnlChartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={pnlChartData}>
                <XAxis dataKey="index" tickFormatter={(v: number) => pnlChartData[v]?.label ?? ''} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<PnlTooltip />} />
                <Line type="monotone" dataKey="pnl" stroke={totalPnL >= 0 ? PROFIT : LOSS} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-center" style={{ color: colors.textMuted }}>
              <p className="text-sm">Close more trades to see your equity curve.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm" style={{ color: colors.textSub }}>Session quality</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {bestSession ? `Best: ${bestSession.name} (${money(bestSession.pnl)})` : 'No closed sessions yet'}
              </p>
            </div>
            <BarChart3 size={18} style={{ color: colors.textMuted }} />
          </div>
          {sessionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sessionData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: colors.textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="session" tick={{ fontSize: 11, fill: colors.textSub }} axisLine={false} tickLine={false} width={34} />
                <Tooltip formatter={(v: any) => [`${v}%`, 'Win Rate']} contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12, color: colors.text }} />
                <Bar dataKey="wr" radius={[0, 5, 5, 0]}>
                  {sessionData.map(entry => (
                    <Cell key={entry.session} fill={entry.wr >= 55 ? PROFIT : entry.wr >= 40 ? WARNING : LOSS} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-center" style={{ color: colors.textMuted }}>
              <p className="text-sm">No session data yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-4">
        <div className="rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <p className="text-sm" style={{ color: colors.textSub }}>Review queue</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Trades with screenshot or journal gaps</p>
            </div>
            <Link to="/replay" className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: WARNING }}>
              Open replay <ArrowRight size={12} />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {reviewQueue.length > 0 ? reviewQueue.map(trade => {
              const missingBefore = !trade.screenshotBefore && !trade.screenshotBefore2;
              const missingAfter = !trade.screenshotAfter && !trade.screenshotAfter2;
              return (
                <div key={trade.id} className="rounded-xl p-3" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm" style={{ color: colors.text }}>{trade.pair} - {trade.session}</p>
                      <p className="text-xs mt-1" style={{ color: colors.textMuted }}>{trade.strategy} · {trade.date}</p>
                    </div>
                    <ResultBadge result={trade.result} />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {missingBefore && <span className="text-xs px-2 py-1 rounded-full" style={{ color: WARNING, background: 'rgba(245,158,11,0.14)' }}>Missing before</span>}
                    {missingAfter && <span className="text-xs px-2 py-1 rounded-full" style={{ color: LOSS, background: 'rgba(248,113,113,0.14)' }}>Missing after</span>}
                    {!trade.notes?.trim() && <span className="text-xs px-2 py-1 rounded-full" style={{ color: INFO, background: 'rgba(96,165,250,0.14)' }}>Needs lesson</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-xl p-4 text-center" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
                <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: PROFIT }} />
                <p className="text-sm" style={{ color: colors.text }}>No screenshot reviews waiting.</p>
                <p className="text-xs mt-1 leading-5" style={{ color: colors.textMuted }}>Keep attaching before and after screenshots to every trade.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <div>
              <p className="text-sm" style={{ color: colors.textSub }}>Recent trades</p>
              <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                {bestStrategy ? `Best playbook: ${bestStrategy.name}` : 'Newest journal entries'}
              </p>
            </div>
            <Link to="/journal" className="flex items-center gap-1 text-xs hover:opacity-80" style={{ color: WARNING }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Date', 'Pair', 'Session', 'Score', 'Decision', 'Result', 'P&L'].map(header => (
                    <th key={header} className="px-4 py-2 text-left text-xs uppercase tracking-wider" style={{ color: colors.textMuted }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(trade => (
                  <tr key={trade.id} style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: colors.textSub }}>{trade.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: colors.text }}>{trade.pair}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: colors.textSub }}>{trade.session}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm" style={{ color: trade.score >= 75 ? PROFIT : trade.score >= 55 ? WARNING : LOSS }}>{trade.score}</span>
                    </td>
                    <td className="px-4 py-3"><DecisionBadge decision={trade.decision} /></td>
                    <td className="px-4 py-3"><ResultBadge result={trade.result} /></td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: (trade.pnl ?? 0) >= 0 ? PROFIT : LOSS }}>
                      {trade.pnl !== undefined ? money(trade.pnl) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {closed.length > 0 && readiness.tone === 'bad' && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: LOSS }} />
          <div>
            <p className="text-sm" style={{ color: colors.text }}>Discipline warning</p>
            <p className="text-xs mt-1 leading-5" style={{ color: colors.textSub }}>The dashboard recommends review before another live trade. Use Trade Replay to convert the last mistake into a rule.</p>
          </div>
        </div>
      )}
    </div>
  );
}