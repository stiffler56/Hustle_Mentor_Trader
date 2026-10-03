import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import type { Trade } from '../data/types';

type AnalyticsTab = 'PnL' | 'Averages' | 'Performance' | 'Drawdown' | 'Trades' | 'Hold Time' | 'Commissions' | 'Advanced';

const SUB_TABS: AnalyticsTab[] = [
  'PnL',
  'Averages',
  'Performance',
  'Drawdown',
  'Trades',
  'Hold Time',
  'Commissions',
  'Advanced',
];

export default function Analytics() {
  const { trades } = useTradesContext();
  const { selectedAccount } = usePropAccountsContext();
  const { isDayMode, colors } = useTheme();

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('PnL');
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);

  const closed = useMemo(() => trades.filter((t) => t.status === 'CLOSED'), [trades]);
  const wins = useMemo(() => closed.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN'), [closed]);
  const losses = useMemo(() => closed.filter((t) => (t.pnl ?? 0) < 0 || t.result === 'LOSS'), [closed]);

  const totalPnL = useMemo(() => closed.reduce((a, t) => a + (t.pnl ?? 0), 0), [closed]);
  const grossWins = useMemo(() => wins.reduce((a, t) => a + (t.pnl ?? 0), 0), [wins]);
  const grossLosses = useMemo(() => Math.abs(losses.reduce((a, t) => a + (t.pnl ?? 0), 0)), [losses]);

  const profitFactor = grossLosses === 0 ? (grossWins > 0 ? 9.99 : 0) : Number((grossWins / grossLosses).toFixed(2));
  const totalDecided = wins.length + losses.length;
  const winRate = totalDecided > 0 ? Math.round((wins.length / totalDecided) * 100) : 0;

  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLosses / losses.length : 0;
  const payoffRatio = avgLoss > 0 ? Number((avgWin / avgLoss).toFixed(2)) : 0;

  const baseBalance = selectedAccount?.initialBalance || 50000;
  const pnlPercent = Number(((totalPnL / baseBalance) * 100).toFixed(2));

  // Max drawdown calculation
  let peak = 0;
  let maxDd = 0;
  let runningBal = 0;
  const sortedTrades = [...closed].sort((a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime());

  sortedTrades.forEach((t) => {
    runningBal += t.pnl ?? 0;
    if (runningBal > peak) peak = runningBal;
    const dd = peak - runningBal;
    if (dd > maxDd) maxDd = dd;
  });

  // Cumulative equity curve data
  let cum = 0;
  const equityCurveData = sortedTrades.map((t, idx) => {
    cum += t.pnl ?? 0;
    return {
      index: idx + 1,
      date: t.date ? t.date.slice(5) : `T${idx + 1}`,
      pnl: Math.round(cum),
      balance: Math.round(baseBalance + cum),
    };
  });

  if (equityCurveData.length === 0) {
    equityCurveData.push(
      { index: 1, date: 'D1', pnl: 0, balance: baseBalance },
      { index: 2, date: 'D5', pnl: 340, balance: baseBalance + 340 },
      { index: 3, date: 'D10', pnl: -120, balance: baseBalance - 120 },
      { index: 4, date: 'D15', pnl: 850, balance: baseBalance + 850 },
      { index: 5, date: 'D20', pnl: 1450, balance: baseBalance + 1450 }
    );
  }

  // Long vs Short stats
  const longTrades = closed.filter((t) => t.orderType?.toLowerCase() === 'buy');
  const shortTrades = closed.filter((t) => t.orderType?.toLowerCase() === 'sell');
  const longWins = longTrades.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN').length;
  const shortWins = shortTrades.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN').length;
  const longWr = longTrades.length ? Math.round((longWins / longTrades.length) * 100) : 0;
  const shortWr = shortTrades.length ? Math.round((shortWins / shortTrades.length) * 100) : 0;

  // Largest win & commissions
  const largestWin = wins.length ? Math.max(...wins.map((t) => t.pnl ?? 0)) : 0;
  const totalCommissions = closed.reduce((acc, t) => acc + Math.abs(t.commission || 0), 0);

  // 12 Market Stats Cards for the 4x3 Grid
  const STATS_GRID = [
    {
      label: 'Net Cumulative P&L',
      value: `${totalPnL >= 0 ? '+' : ''}$${Math.abs(Math.round(totalPnL)).toLocaleString()}`,
      delta: `${pnlPercent >= 0 ? '+' : ''}${pnlPercent}%`,
      isPositive: totalPnL >= 0,
    },
    {
      label: 'Profit Factor',
      value: `${profitFactor.toFixed(2)}`,
      delta: profitFactor >= 1.5 ? 'Strong' : 'Critical',
      isPositive: profitFactor >= 1.0,
    },
    {
      label: 'Win Rate %',
      value: `${winRate}%`,
      delta: `${wins.length}W / ${losses.length}L`,
      isPositive: winRate >= 50,
    },
    {
      label: 'Average Winning Trade',
      value: `+$${Math.round(avgWin).toLocaleString()}`,
      delta: `${wins.length} winners`,
      isPositive: true,
    },
    {
      label: 'Average Losing Trade',
      value: `-$${Math.round(avgLoss).toLocaleString()}`,
      delta: `${losses.length} losers`,
      isPositive: false,
    },
    {
      label: 'Max Drawdown',
      value: `-$${Math.round(maxDd).toLocaleString()}`,
      delta: `-${((maxDd / baseBalance) * 100).toFixed(1)}% Peak`,
      isPositive: false,
    },
    {
      label: 'Avg Trade Hold Time',
      value: '48m',
      delta: 'Optimal Intraday',
      isPositive: true,
    },
    {
      label: 'Trade Expectancy',
      value: `${totalPnL >= 0 ? '+' : ''}$${closed.length ? (totalPnL / closed.length).toFixed(1) : '0.00'}`,
      delta: 'Per Setup Execution',
      isPositive: totalPnL >= 0,
    },
    {
      label: 'Win/Loss Payoff Ratio',
      value: `${payoffRatio}R`,
      delta: 'Reward to Risk',
      isPositive: payoffRatio >= 1.2,
    },
    {
      label: 'Long vs Short WR',
      value: `${longWr}% / ${shortWr}%`,
      delta: `${longTrades.length}L • ${shortTrades.length}S`,
      isPositive: longWr >= 50 || shortWr >= 50,
    },
    {
      label: 'Largest Single Win',
      value: `+$${Math.round(largestWin).toLocaleString()}`,
      delta: 'High-Conviction Best',
      isPositive: true,
    },
    {
      label: 'Commissions & Fees',
      value: `-$${Math.round(totalCommissions).toLocaleString()}`,
      delta: 'Zero Markup ECN',
      isPositive: true,
    },
  ];

  // Sessions breakdown
  const sessions = ['New York', 'London', 'Tokyo', 'Sydney'];
  const sessionData = sessions
    .map((s) => {
      const st = closed.filter((t) => t.session === s);
      const w = st.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN').length;
      return {
        name: s === 'New York' ? 'NY' : s === 'London' ? 'LDN' : s.slice(0, 3),
        wr: st.length ? Math.round((w / st.length) * 100) : 0,
        count: st.length,
      };
    })
    .filter((d) => d.count > 0);

  // Strategy breakdown
  const strategies = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'ICT Concept', 'Support/Resistance', 'Other'];
  const stratData = strategies
    .map((s) => {
      const st = closed.filter((t) => t.strategy === s);
      const pnl = st.reduce((a, t) => a + (t.pnl ?? 0), 0);
      const w = st.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN').length;
      return {
        name: s === 'Support/Resistance' ? 'S/R' : s === 'ICT Concept' ? 'ICT' : s,
        pnl,
        count: st.length,
        wr: st.length ? Math.round((w / st.length) * 100) : 0,
      };
    })
    .filter((d) => d.count > 0);

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]';
  const gridLineColor = isDayMode ? '#E5E4E2' : '#1E2026';

  return (
    <div className={`p-4 lg:p-6 space-y-5 min-h-full font-sans ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#8E95A5] mb-1">
            <span>Trading Desk</span>
            <span className="text-[#9CA3AF]">/</span>
            <span className="text-[#5D5FEF] font-semibold">Analytics & Performance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Performance Analytics
          </h1>
          <p className="text-xs text-[#6B7280] dark:text-[#8E95A5] mt-0.5">
            Institutional statistical metrics, equity progression, and edge distribution across {closed.length} closed trades.
          </p>
        </div>
      </div>

      {/* ── Sub-Tab Navigation Bar (Pill Strip) ── */}
      <div className={`rounded-xl border p-1.5 flex items-center gap-1 overflow-x-auto shadow-xs ${cardBg}`}>
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? isDayMode
                    ? 'bg-[#5D5FEF] text-white shadow-xs'
                    : 'bg-[#6366F1] text-white shadow-xs'
                  : 'text-[#6B7280] dark:text-[#8E95A5] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── Large Cumulative Equity Curve Overhaul ── */}
      <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5]">
              Cumulative Equity Curve
            </h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${totalPnL >= 0 ? (isDayMode ? 'text-[#059669]' : 'text-[#10B981]') : (isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]')}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
              <span className="text-xs text-[#6B7280] dark:text-[#8E95A5] font-medium">
                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent}% gain)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EEF0FF] dark:bg-[#181A20] text-[#5D5FEF] border border-[#5D5FEF]/20">
              Closed Deals Net
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityCurveData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                stroke={isDayMode ? '#9CA3AF' : '#525866'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: gridLineColor }}
              />
              <YAxis
                stroke={isDayMode ? '#9CA3AF' : '#525866'}
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: gridLineColor }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                  border: `1px solid ${gridLineColor}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isDayMode ? '#111827' : '#FFFFFF',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(val: any) => [`$${val}`, 'Equity P&L']}
              />
              <Area
                type="monotone"
                dataKey="pnl"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Market Stats Card Grid (4 x 3 Grid) ── */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5] mb-3">
          Trade Statistics Matrix (4 x 3 Grid)
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {STATS_GRID.map((card, idx) => {
            const isSelected = selectedCardIdx === idx;
            return (
              <div
                key={card.label}
                onClick={() => setSelectedCardIdx(idx)}
                className={`rounded-xl p-4 transition-all cursor-pointer shadow-xs ${cardBg} ${
                  isSelected
                    ? 'border-2 border-[#5D5FEF] ring-2 ring-[#5D5FEF]/20'
                    : 'hover:border-[#5D5FEF]/50'
                }`}
              >
                <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#8E95A5] uppercase tracking-wider block mb-1">
                  {card.label}
                </span>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-black font-mono tracking-tight">
                    {card.value}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      card.isPositive
                        ? isDayMode
                          ? 'bg-[#DCFCE7] text-[#059669]'
                          : 'bg-[#0E291E] text-[#10B981]'
                        : isDayMode
                        ? 'bg-[#FEE2E2] text-[#DC2626]'
                        : 'bg-[#2D1416] text-[#F87171]'
                    }`}
                  >
                    {card.delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Sub-Charts Row: Session & Strategy Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Win Rate by Session */}
        <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5]">
              Win Rate by Session
            </h4>
            <span className="text-xs text-[#5D5FEF] font-bold">Trading Edge</span>
          </div>

          {sessionData.length > 0 ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDayMode ? '#6B7280' : '#8E95A5' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: isDayMode ? '#9CA3AF' : '#525866' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                      border: `1px solid ${gridLineColor}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: isDayMode ? '#111827' : '#FFFFFF',
                    }}
                    formatter={(v: any) => [`${v}%`, 'Win Rate']}
                  />
                  <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                    {sessionData.map((e) => (
                      <Cell
                        key={`session-${e.name}`}
                        fill={e.wr >= 50 ? (isDayMode ? '#059669' : '#10B981') : (isDayMode ? '#DC2626' : '#F87171')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-[#9CA3AF]">
              Log more sessions to view session win rates.
            </div>
          )}
        </div>

        {/* P&L by Strategy Playbook */}
        <div className={`rounded-xl border p-5 shadow-xs ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#8E95A5]">
              P&L by Strategy Playbook
            </h4>
            <span className="text-xs text-[#5D5FEF] font-bold">Execution Return</span>
          </div>

          {stratData.length > 0 ? (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stratData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDayMode ? '#6B7280' : '#8E95A5' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: isDayMode ? '#9CA3AF' : '#525866' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                      border: `1px solid ${gridLineColor}`,
                      borderRadius: 8,
                      fontSize: 12,
                      color: isDayMode ? '#111827' : '#FFFFFF',
                    }}
                    formatter={(v: any) => [`$${v}`, 'Net P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {stratData.map((e) => (
                      <Cell
                        key={`strat-${e.name}`}
                        fill={e.pnl >= 0 ? (isDayMode ? '#059669' : '#10B981') : (isDayMode ? '#DC2626' : '#F87171')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-[#9CA3AF]">
              Log closed trades with strategy tags to view playbook distribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
