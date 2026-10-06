import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
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
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Calendar as CalendarIcon,
  Bot,
  ExternalLink,
  Layers,
  Activity,
  Award,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade } from '../data/types';
import { getTradeDateStr } from '../utils/calendarUtils';

export default function Dashboard() {
  const { trades, updateTrade } = useTradesContext();
  const { selectedAccount } = usePropAccountsContext();
  const { isDayMode } = useTheme();

  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  // ── Metrics Calculation ──────────────────────────────────────────────────
  const closedTrades = useMemo(
    () => trades.filter((t) => t.status === 'CLOSED'),
    [trades]
  );
  const openTrades = useMemo(
    () => trades.filter((t) => t.status === 'OPEN'),
    [trades]
  );

  const wins = useMemo(
    () => closedTrades.filter((t) => (t.pnl ?? 0) > 0 || t.result === 'WIN'),
    [closedTrades]
  );
  const losses = useMemo(
    () => closedTrades.filter((t) => (t.pnl ?? 0) < 0 || t.result === 'LOSS'),
    [closedTrades]
  );

  const totalPnL = useMemo(
    () => closedTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0),
    [closedTrades]
  );

  const grossWins = useMemo(
    () => wins.reduce((acc, t) => acc + (t.pnl ?? 0), 0),
    [wins]
  );
  const grossLosses = useMemo(
    () => Math.abs(losses.reduce((acc, t) => acc + (t.pnl ?? 0), 0)),
    [losses]
  );

  const profitFactor = useMemo(() => {
    if (grossLosses === 0) return grossWins > 0 ? 9.99 : 0;
    return Number((grossWins / grossLosses).toFixed(2));
  }, [grossWins, grossLosses]);

  const avgPnL = useMemo(() => {
    if (!closedTrades.length) return 0;
    return Number((totalPnL / closedTrades.length).toFixed(2));
  }, [closedTrades.length, totalPnL]);

  const winCount = wins.length;
  const lossCount = losses.length;
  const totalDecided = winCount + lossCount;
  const winRatePct = totalDecided > 0 ? (winCount / totalDecided) * 100 : 0;
  const lossRatePct = totalDecided > 0 ? (lossCount / totalDecided) * 100 : 0;

  // Initial balance for return % calculations
  const baseBalance = selectedAccount?.initialBalance || 50000;
  const pnlPercent = Number(((totalPnL / baseBalance) * 100).toFixed(2));

  // ── Cumulative Account Performance Area Data ──────────────────────────────
  const cumulativeData = useMemo(() => {
    const sorted = [...closedTrades].sort(
      (a, b) => new Date(a.createdAt || a.date).getTime() - new Date(b.createdAt || b.date).getTime()
    );

    if (sorted.length === 0) {
      return [
        { label: 'Day 1', pnl: 0, balance: baseBalance },
        { label: 'Day 5', pnl: 450, balance: baseBalance + 450 },
        { label: 'Day 10', pnl: -280, balance: baseBalance - 280 },
        { label: 'Day 15', pnl: 920, balance: baseBalance + 920 },
        { label: 'Day 20', pnl: 1450, balance: baseBalance + 1450 },
        { label: 'Day 25', pnl: 1200, balance: baseBalance + 1200 },
        { label: 'Day 30', pnl: 2150, balance: baseBalance + 2150 },
      ];
    }

    let running = 0;
    return sorted.map((t, i) => {
      running += t.pnl ?? 0;
      const dateLabel = t.date ? t.date.slice(5) : `T${i + 1}`;
      return {
        label: dateLabel,
        pnl: Math.round(running),
        balance: Math.round(baseBalance + running),
      };
    });
  }, [closedTrades, baseBalance]);

  // ── Daily PnL Bar Chart Data ──────────────────────────────────────────────
  const dailyPnLData = useMemo(() => {
    const dayMap = new Map<string, number>();

    closedTrades.forEach((t) => {
      const dStr = getTradeDateStr(t);
      if (!dStr) return;
      dayMap.set(dStr, (dayMap.get(dStr) || 0) + (t.pnl ?? 0));
    });

    const entries = Array.from(dayMap.entries())
      .map(([date, pnl]) => ({
        date: date.slice(5),
        fullDate: date,
        pnl: Math.round(pnl),
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-14);

    if (entries.length === 0) {
      return [
        { date: '09-18', pnl: 340 },
        { date: '09-19', pnl: -450 },
        { date: '09-20', pnl: 780 },
        { date: '09-21', pnl: -1212 },
        { date: '09-22', pnl: -757 },
        { date: '09-23', pnl: 520 },
        { date: '09-24', pnl: -210 },
        { date: '09-25', pnl: 890 },
      ];
    }
    return entries;
  }, [closedTrades]);

  // ── Weekly & Risk Health Metrics ──────────────────────────────────────────
  const riskScore = useMemo(() => {
    if (closedTrades.length === 0) return 85;
    let score = 100;
    if (winRatePct < 40) score -= 30;
    else if (winRatePct < 50) score -= 15;

    const heavyLosses = closedTrades.filter((t) => (t.pnl ?? 0) < -1000).length;
    score -= heavyLosses * 15;

    const noStops = closedTrades.filter((t) => t.mentalFocus < 5).length;
    score -= noStops * 10;

    return Math.max(0, Math.min(100, score));
  }, [closedTrades, winRatePct]);

  // ── TradeZella Monthly Calendar Heatmap Calculation ───────────────────────
  const calendarData = useMemo(() => {
    const now = new Date();
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
    const year = targetMonthDate.getFullYear();
    const month = targetMonthDate.getMonth();
    const monthName = targetMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const tradeMap = new Map<number, { trades: Trade[]; pnl: number; wins: number; losses: number }>();
    closedTrades.forEach((t) => {
      const dStr = getTradeDateStr(t);
      if (!dStr) return;
      const [y, m, d] = dStr.split('-').map(Number);
      if (y === year && m === month + 1) {
        if (!tradeMap.has(d)) {
          tradeMap.set(d, { trades: [], pnl: 0, wins: 0, losses: 0 });
        }
        const item = tradeMap.get(d)!;
        item.trades.push(t);
        const p = t.pnl ?? 0;
        item.pnl += p;
        if (p > 0 || t.result === 'WIN') item.wins++;
        else if (p < 0 || t.result === 'LOSS') item.losses++;
      }
    });

    const weeks: Array<{
      days: Array<{
        dayNumber?: number;
        pnl?: number;
        tradeCount?: number;
        winRate?: number;
        isHeavyLoss?: boolean;
        isCurrentMonth?: boolean;
      }>;
      weeklyPnl: number;
      weeklyTrades: number;
    }> = [];

    let currentDayNumber = 1;
    let weekDays: Array<any> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      weekDays.push({ isCurrentMonth: false });
    }

    while (currentDayNumber <= daysInMonth) {
      const dayStats = tradeMap.get(currentDayNumber);
      const pnl = dayStats ? dayStats.pnl : 0;
      const count = dayStats ? dayStats.trades.length : 0;
      const wr = count > 0 ? (dayStats!.wins / count) * 100 : 0;
      const isHeavyLoss = pnl < -1000;

      weekDays.push({
        dayNumber: currentDayNumber,
        pnl,
        tradeCount: count,
        winRate: wr,
        isHeavyLoss,
        isCurrentMonth: true,
      });

      if (weekDays.length === 7) {
        const weeklyPnl = weekDays.reduce((acc, d) => acc + (d.pnl || 0), 0);
        const weeklyTrades = weekDays.reduce((acc, d) => acc + (d.tradeCount || 0), 0);
        weeks.push({ days: weekDays, weeklyPnl, weeklyTrades });
        weekDays = [];
      }
      currentDayNumber++;
    }

    if (weekDays.length > 0) {
      while (weekDays.length < 7) {
        weekDays.push({ isCurrentMonth: false });
      }
      const weeklyPnl = weekDays.reduce((acc, d) => acc + (d.pnl || 0), 0);
      const weeklyTrades = weekDays.reduce((acc, d) => acc + (d.tradeCount || 0), 0);
      weeks.push({ days: weekDays, weeklyPnl, weeklyTrades });
    }

    return { monthName, weeks };
  }, [calendarMonthOffset, closedTrades]);

  // ── Manual Close Helper for Open Positions ────────────────────────────────
  const handleClosePosition = (trade: Trade) => {
    const exitPrice = trade.exitPrice || trade.entryPrice || 0;
    updateTrade(trade.id, {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      exitPrice,
      result: (trade.pnl ?? 0) >= 0 ? 'WIN' : 'LOSS',
    });
  };

  // ── Dynamic Color Tokens for Day Mode vs Night Mode ───────────────────────
  const themeCardBg = isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]';
  const themeSubCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const themeTextPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const themeTextSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';
  const themeDivider = isDayMode ? 'border-[#E5E4E2]' : 'border-[#252830]';
  const themeGridStroke = isDayMode ? '#E5E4E2' : '#1E2026';

  return (
    <div className={`p-4 lg:p-6 space-y-4 min-h-full font-sans transition-colors ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* ── 1. Top KPI Summary Strip (Horizontal Summary Banner) ── */}
      <div className={`rounded-xl border p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs ${themeCardBg}`}>
        {/* Metric 1: Net PnL Gross $ */}
        <div className={`flex-1 border-b lg:border-b-0 lg:border-r pb-3 lg:pb-0 lg:pr-6 ${themeDivider}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${themeTextSecondary}`}>
            Net P&L (Gross)
          </p>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`text-2xl lg:text-3xl font-black tracking-tight ${
                totalPnL >= 0
                  ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                  : isDayMode ? 'text-[#DC2626]' : 'text-white'
              }`}
            >
              {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                pnlPercent >= 0
                  ? isDayMode
                    ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                    : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                  : isDayMode
                  ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                  : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
              }`}
            >
              {pnlPercent >= 0 ? '+' : ''}{pnlPercent}%
            </span>
          </div>
        </div>

        {/* Metric 2: Profit Factor */}
        <div className={`flex-1 border-b lg:border-b-0 lg:border-r pb-3 lg:pb-0 lg:pr-6 ${themeDivider}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${themeTextSecondary}`}>
            Profit Factor
          </p>
          <div className="flex items-center gap-2">
            <span className={`text-2xl lg:text-3xl font-black tracking-tight ${themeTextPrimary}`}>
              {profitFactor.toFixed(2)}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                profitFactor >= 1.5
                  ? isDayMode
                    ? 'bg-[#DCFCE7] text-[#059669]'
                    : 'bg-[#0E291E] text-[#10B981]'
                  : profitFactor >= 1.0
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                  : isDayMode
                  ? 'bg-[#FEE2E2] text-[#DC2626]'
                  : 'bg-[#2D1416] text-[#F87171]'
              }`}
            >
              {profitFactor >= 1.5 ? 'EXCELLENT' : profitFactor >= 1.0 ? 'MODERATE' : 'CRITICAL'}
            </span>
          </div>
        </div>

        {/* Metric 3: Avg PnL $ */}
        <div className={`flex-1 border-b lg:border-b-0 lg:border-r pb-3 lg:pb-0 lg:pr-6 ${themeDivider}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${themeTextSecondary}`}>
            Avg Trade P&L
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl lg:text-3xl font-black tracking-tight ${
                avgPnL >= 0
                  ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                  : isDayMode ? 'text-[#DC2626]' : 'text-white'
              }`}
            >
              {avgPnL >= 0 ? '+' : '-'}${Math.abs(avgPnL).toLocaleString()}
            </span>
            <span className={`text-xs font-medium ${themeTextSecondary}`}>
              ({closedTrades.length} trades)
            </span>
          </div>
        </div>

        {/* Metric 4: Win / Loss Dual-Segment Ratio Bar */}
        <div className="flex-[1.4] flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}>
              Win {winRatePct.toFixed(1)}% | {winCount}
            </span>
            <span className={isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}>
              {lossCount} | Loss {lossRatePct.toFixed(1)}%
            </span>
          </div>

          {/* Dual Segment Progress Bar */}
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

      {/* ── 2. Middle 3-Column Charts & Cypher Coach ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1: Cumulative Account Performance */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${themeCardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${themeTextPrimary}`}>
                <span>Account Performance</span>
                <span className="text-[10px] text-[#5D5FEF] font-semibold bg-[#EEF0FF] dark:bg-[#6366F1]/10 px-1.5 py-0.2 rounded border border-[#5D5FEF]/20">Live</span>
              </h3>
              <p className={`text-[11px] mt-0.5 ${themeTextSecondary}`}>
                Net Cumulative Return ($)
              </p>
            </div>
            <span className={`text-sm font-black ${themeTextPrimary}`}>
              {totalPnL >= 0 ? '+' : ''}${Math.round(totalPnL).toLocaleString()}
            </span>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <defs>
                  <linearGradient id="tzPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5D5FEF" stopOpacity={isDayMode ? 0.35 : 0.45} />
                    <stop offset="100%" stopColor={isDayMode ? '#FFFFFF' : '#0B0C0E'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke={isDayMode ? '#9CA3AF' : '#525866'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: themeGridStroke }}
                />
                <YAxis
                  stroke={isDayMode ? '#9CA3AF' : '#525866'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                    borderColor: themeGridStroke,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDayMode ? '#111827' : '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: any) => [`$${value}`, 'Cumulative P&L']}
                />
                <Area
                  type="monotone"
                  dataKey="pnl"
                  stroke="#5D5FEF"
                  strokeWidth={2.5}
                  fill="url(#tzPurpleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 2: Daily Net PnL Bar Chart */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${themeCardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${themeTextPrimary}`}>
                Daily Net P&L
              </h3>
              <p className={`text-[11px] mt-0.5 ${themeTextSecondary}`}>
                Session P&L Distribution
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className={`flex items-center gap-1 ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`} /> Win Day
              </span>
              <span className={`flex items-center gap-1 ${isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDayMode ? 'bg-[#DC2626]' : 'bg-[#F87171]'}`} /> Loss Day
              </span>
            </div>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPnLData}>
                <ReferenceLine y={0} stroke={themeGridStroke} strokeWidth={1.5} />
                <XAxis
                  dataKey="date"
                  stroke={isDayMode ? '#9CA3AF' : '#525866'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: themeGridStroke }}
                />
                <YAxis
                  stroke={isDayMode ? '#9CA3AF' : '#525866'}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDayMode ? '#FFFFFF' : '#131418',
                    borderColor: themeGridStroke,
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: isDayMode ? '#111827' : '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: any) => [`$${value}`, 'Daily P&L']}
                />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {dailyPnLData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.pnl >= 0
                          ? isDayMode ? '#059669' : '#10B981'
                          : isDayMode ? '#DC2626' : '#F87171'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Col 3: Cypher Coach & Risk Health Overview */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${themeCardBg}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#5D5FEF]/10 border border-[#5D5FEF]/25 flex items-center justify-center text-[#5D5FEF]">
                  <Bot size={15} />
                </div>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${themeTextPrimary}`}>
                    Hustle Mentor
                  </h3>
                  <p className={`text-[10px] ${themeTextSecondary}`}>Risk & Discipline Radar</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  riskScore >= 75
                    ? isDayMode
                      ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                      : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                    : riskScore >= 50
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-400'
                    : isDayMode
                    ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                    : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                }`}
              >
                {riskScore >= 75 ? 'Optimal' : riskScore >= 50 ? 'Moderate' : '0/100 CRITICAL'}
              </span>
            </div>

            {/* Score Ring & Comparison */}
            <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border mb-3 ${themeSubCardBg}`}>
              <div className="flex flex-col justify-center">
                <span className={`text-[10px] uppercase font-bold ${themeTextSecondary}`}>Risk Health</span>
                <span className={`text-2xl font-black mt-0.5 ${themeTextPrimary}`}>
                  {riskScore}
                  <span className="text-xs text-[#9CA3AF]">/100</span>
                </span>
              </div>
              <div className={`flex flex-col justify-center border-l pl-3 ${themeDivider}`}>
                <span className={`text-[10px] uppercase font-bold ${themeTextSecondary}`}>Win Rate Trend</span>
                <span className={`text-xs font-bold mt-0.5 ${themeTextPrimary}`}>
                  This Wk: <span className={isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}>{winRatePct.toFixed(1)}%</span>
                </span>
                <span className="text-[10px] text-[#9CA3AF]">Last Wk: 33.3%</span>
              </div>
            </div>

            {/* Risk Checklist */}
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center justify-between p-2 rounded-lg border ${themeSubCardBg}`}>
                <span className={`text-[11px] ${themeTextSecondary}`}>Drawdown Limit</span>
                <span className={`text-[11px] font-bold ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                  5.2% Daily / 10% Max Safe
                </span>
              </div>
              <div className={`flex items-center justify-between p-2 rounded-lg border ${themeSubCardBg}`}>
                <span className={`text-[11px] ${themeTextSecondary}`}>Stop Loss Usage</span>
                <span className={`text-[11px] font-bold ${isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}`}>
                  NO STOPS SET
                </span>
              </div>
              <div className={`flex items-center justify-between p-2 rounded-lg border ${themeSubCardBg}`}>
                <span className={`text-[11px] ${themeTextSecondary}`}>Risk of Ruin</span>
                <span className={`text-[11px] font-bold ${isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}`}>
                  100.0% HIGH
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/utilities/mentor"
            className={`mt-3 w-full py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              isDayMode
                ? 'bg-[#EEF0FF] hover:bg-[#E0E4FF] text-[#5D5FEF] border-[#5D5FEF]/30'
                : 'bg-[#181A20] hover:bg-[#1E2026] text-white border-[#1E2026]'
            }`}
          >
            <Sparkles size={13} className="text-[#5D5FEF]" />
            <span>Consult Hustle Mentor</span>
          </Link>
        </div>
      </div>

      {/* ── 3. TradeZella Monthly Calendar Heatmap ── */}
      <div className={`rounded-xl border p-4 shadow-xs ${themeCardBg}`}>
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${themeTextPrimary}`}>
              <CalendarIcon size={16} className="text-[#5D5FEF]" />
              <span>{calendarData.monthName}</span>
            </h3>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDayMode
                    ? 'bg-[#F2F1EF] hover:bg-[#E5E4E2] border-[#E5E4E2] text-[#111827]'
                    : 'bg-[#0F1013] hover:bg-[#181A20] border-[#1E2026] text-[#8E95A5]'
                }`}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDayMode
                    ? 'bg-[#F2F1EF] hover:bg-[#E5E4E2] border-[#E5E4E2] text-[#111827]'
                    : 'bg-[#0F1013] hover:bg-[#181A20] border-[#1E2026] text-[#8E95A5]'
                }`}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className={themeTextSecondary}>
              Net P&L: <strong className={totalPnL >= 0 ? (isDayMode ? 'text-[#059669]' : 'text-[#10B981]') : (isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]')}>{totalPnL >= 0 ? '+' : ''}${Math.round(totalPnL).toLocaleString()}</strong>
            </span>
            <span className="text-[#9CA3AF]">|</span>
            <span className={themeTextSecondary}>
              Trading Days: <strong className={themeTextPrimary}>{closedTrades.length}</strong>
            </span>
            <span className="text-[#9CA3AF]">|</span>
            <span className={themeTextSecondary}>
              Win Rate: <strong className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}>{winRatePct.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Weekday Columns (8 Columns: Mon-Sun + Weekly Summary) */}
        <div className="grid grid-cols-8 gap-2 mb-2 text-center">
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'WEEKLY'].map((day) => (
            <div
              key={day}
              className={`text-[10px] font-bold tracking-wider py-1 ${
                day === 'WEEKLY' ? 'text-[#5D5FEF]' : themeTextSecondary
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Rows */}
        <div className="space-y-2">
          {calendarData.weeks.map((week, wIdx) => (
            <div key={`week-${wIdx}`} className="grid grid-cols-8 gap-2">
              {week.days.map((day, dIdx) => {
                if (!day.isCurrentMonth) {
                  return (
                    <div
                      key={`empty-${dIdx}`}
                      className={`min-h-[76px] rounded-lg border p-2 opacity-30 ${
                        isDayMode ? 'bg-[#F2F1EF] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]/30'
                      }`}
                    />
                  );
                }

                const hasTrades = (day.tradeCount || 0) > 0;
                const isWin = (day.pnl || 0) > 0;
                const isHeavyLoss = day.isHeavyLoss;

                let cellBg = isDayMode
                  ? 'bg-[#F9FAFB] border-[#E5E4E2]/60 text-[#9CA3AF]'
                  : 'bg-[#0F1013] border-[#1E2026]/60 text-[#525866]';

                if (hasTrades) {
                  if (isHeavyLoss) {
                    cellBg = 'bg-[#EF4444] border-[#DC2626] text-white';
                  } else if (isWin) {
                    cellBg = isDayMode
                      ? 'bg-[#DCFCE7]/70 hover:bg-[#DCFCE7] border-[#86EFAC] text-[#059669]'
                      : 'bg-[#0E291E] border-[#144634] text-[#10B981]';
                  } else {
                    cellBg = isDayMode
                      ? 'bg-[#FEE2E2]/70 hover:bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
                      : 'bg-[#2D1416] border-[#4C1D24] text-[#F87171]';
                  }
                }

                return (
                  <div
                    key={`day-${day.dayNumber}`}
                    className={`min-h-[76px] rounded-lg border p-2 flex flex-col justify-between transition-all cursor-pointer hover:shadow-xs ${cellBg}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-80">
                      <span>{day.dayNumber}</span>
                      {hasTrades && (
                        <span className={`text-[9px] px-1 rounded ${isDayMode ? 'bg-black/10' : 'bg-black/40'}`}>
                          {day.tradeCount}t
                        </span>
                      )}
                    </div>

                    {hasTrades ? (
                      <div className="mt-1">
                        <p className="text-xs font-black tracking-tight leading-tight">
                          {day.pnl! >= 0 ? '+' : '-'}${Math.abs(Math.round(day.pnl!)).toLocaleString()}
                        </p>
                        <p className="text-[9px] font-semibold opacity-90 mt-0.5">
                          {day.winRate!.toFixed(0)}% WR
                        </p>
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                );
              })}

              {/* Weekly Summary Tile */}
              <div
                className={`min-h-[76px] rounded-lg border p-2 flex flex-col justify-between ${
                  week.weeklyTrades > 0
                    ? week.weeklyPnl >= 0
                      ? isDayMode
                        ? 'bg-[#DCFCE7]/90 border-[#86EFAC] text-[#059669]'
                        : 'bg-[#0E291E]/60 border-[#144634] text-[#10B981]'
                      : isDayMode
                      ? 'bg-[#FEE2E2]/90 border-[#FCA5A5] text-[#DC2626]'
                      : 'bg-[#2D1416]/60 border-[#4C1D24] text-[#F87171]'
                    : isDayMode
                    ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#9CA3AF]'
                    : 'bg-[#181A20] border-[#1E2026] text-[#8E95A5]'
                }`}
              >
                <div className={`text-[9px] font-bold uppercase tracking-wider ${themeTextSecondary}`}>
                  W{wIdx + 1} Total
                </div>
                {week.weeklyTrades > 0 ? (
                  <div>
                    <p className="text-xs font-black tracking-tight">
                      {week.weeklyPnl >= 0 ? '+' : '-'}${Math.abs(Math.round(week.weeklyPnl)).toLocaleString()}
                    </p>
                    <p className={`text-[9px] font-semibold ${themeTextSecondary}`}>
                      {week.weeklyTrades} trades
                    </p>
                  </div>
                ) : (
                  <span className="text-[10px] text-[#9CA3AF]">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Bottom Panels: Open Positions & Execution Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open Positions Card */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${themeCardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className={isDayMode ? 'text-[#059669]' : 'text-[#10B981]'} />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${themeTextPrimary}`}>
                Live Open Positions
              </h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDayMode
                  ? 'bg-[#DCFCE7] text-[#059669] border-[#86EFAC]'
                  : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
              }`}
            >
              {openTrades.length} Active
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {openTrades.length > 0 ? (
              openTrades.map((trade) => {
                const isBuy = trade.orderType === 'Buy';
                const pnl = trade.pnl ?? 0;
                return (
                  <div
                    key={trade.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${themeSubCardBg}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${themeTextPrimary}`}>{trade.pair}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                            isBuy
                              ? isDayMode
                                ? 'bg-[#DCFCE7] text-[#059669] border border-[#86EFAC]'
                                : 'bg-[#0E291E] text-[#10B981] border border-[#144634]'
                              : isDayMode
                              ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                              : 'bg-[#2D1416] text-[#F87171] border border-[#4C1D24]'
                          }`}
                        >
                          {trade.orderType} {trade.quantity || 1.0} lots
                        </span>
                      </div>
                      <p className={`text-[11px] mt-1 ${themeTextSecondary}`}>
                        Entry: {trade.entryPrice || 0} • TP/Target: {trade.exitPrice || 'Open'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p
                          className={`text-xs font-black ${
                            pnl >= 0
                              ? isDayMode ? 'text-[#059669]' : 'text-[#10B981]'
                              : isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'
                          }`}
                        >
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </p>
                        <p className={`text-[9px] ${themeTextSecondary}`}>Unrealized P&L</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClosePosition(trade)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                          isDayMode
                            ? 'bg-white hover:bg-[#F2F1EF] text-[#111827] border-[#E5E4E2]'
                            : 'bg-[#181A20] hover:bg-[#252830] text-white border-[#1E2026]'
                        }`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`h-[120px] rounded-lg border flex flex-col items-center justify-center text-center p-4 ${themeSubCardBg}`}>
                <CheckCircle2 size={20} className={isDayMode ? 'text-[#059669] mb-1.5' : 'text-[#10B981] mb-1.5'} />
                <p className={`text-xs font-semibold ${themeTextPrimary}`}>No Open Risk</p>
                <p className={`text-[11px] mt-0.5 ${themeTextSecondary}`}>All positions flat and accounted for.</p>
              </div>
            )}
          </div>
        </div>

        {/* Execution & Efficiency Distribution */}
        <div className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${themeCardBg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-[#5D5FEF]" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${themeTextPrimary}`}>
                Execution Efficiency
              </h3>
            </div>
            <span className={`text-[10px] font-semibold ${themeTextSecondary}`}>TradeZella Metrics</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className={`p-3 rounded-lg border ${themeSubCardBg}`}>
              <span className={`text-[10px] font-bold uppercase block ${themeTextSecondary}`}>
                Avg Winning Trade
              </span>
              <span className={`text-lg font-black mt-0.5 block ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>
                +${wins.length > 0 ? (grossWins / wins.length).toFixed(2) : '0.00'}
              </span>
              <span className="text-[9px] text-[#9CA3AF]">Expected reward on winner</span>
            </div>

            <div className={`p-3 rounded-lg border ${themeSubCardBg}`}>
              <span className={`text-[10px] font-bold uppercase block ${themeTextSecondary}`}>
                Avg Losing Trade
              </span>
              <span className={`text-lg font-black mt-0.5 block ${isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}`}>
                -${losses.length > 0 ? (grossLosses / losses.length).toFixed(2) : '0.00'}
              </span>
              <span className="text-[9px] text-[#9CA3AF]">Controlled average risk</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={themeTextSecondary}>Win / Loss Payoff Ratio</span>
                <span className={`font-bold ${themeTextPrimary}`}>
                  {losses.length > 0 && wins.length > 0
                    ? ((grossWins / wins.length) / (grossLosses / losses.length)).toFixed(2)
                    : '1.45'}R
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDayMode ? 'bg-[#E5E4E2]' : 'bg-[#1E2026]'}`}>
                <div className="h-full bg-[#5D5FEF] rounded-full" style={{ width: '68%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={themeTextSecondary}>Rule Adherence Index</span>
                <span className={`font-bold ${isDayMode ? 'text-[#059669]' : 'text-[#10B981]'}`}>92.4%</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDayMode ? 'bg-[#E5E4E2]' : 'bg-[#1E2026]'}`}>
                <div className={`h-full rounded-full ${isDayMode ? 'bg-[#059669]' : 'bg-[#10B981]'}`} style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
