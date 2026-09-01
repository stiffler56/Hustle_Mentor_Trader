import type { Trade } from '../data/types';

export interface DayData {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  trades: Trade[];
  pnl: number;
  wins: number;
  losses: number;
  breakevens: number;
  count: number;
  isOvertrading: boolean;
  isMistakeHeavy: boolean;
  mistakeReasons: string[];
}

export interface MonthStats {
  totalTrades: number;
  totalPnL: number;
  wins: number;
  losses: number;
  winRate: number;
  tradingDaysCount: number;
  winningDays: number;
  losingDays: number;
  bestDay: number;
  worstDay: number;
  highVolumeDays: number;
  mistakeDays: number;
}

export function formatMoney(value: number): string {
  const rounded = Math.round(value);
  return `${rounded >= 0 ? '+' : ''}$${rounded.toLocaleString()}`;
}

export function getTradeDateStr(trade: Trade): string {
  if (trade.date) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(trade.date)) return trade.date;
    try {
      const d = new Date(trade.date);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  if (trade.closedAt) {
    try {
      const d = new Date(trade.closedAt);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  if (trade.createdAt) {
    try {
      const d = new Date(trade.createdAt);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  return '';
}

export function calculateMonthDays(year: number, month: number, trades: Trade[]): DayData[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  const days: DayData[] = [];
  const current = new Date(startDate);
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < 42; i++) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const dayTrades = trades.filter(trade => getTradeDateStr(trade) === dateStr);
    const pnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const wins = dayTrades.filter(t => t.result === 'WIN').length;
    const losses = dayTrades.filter(t => t.result === 'LOSS').length;
    const breakevens = dayTrades.filter(t => t.result === 'BE').length;

    const isOvertrading =
      dayTrades.length >= 3 ||
      dayTrades.some(t => t.psychologicalMetrics?.wasOverconfident || t.psychologicalMetrics?.wasChasing);

    const mistakeReasons: string[] = [];
    dayTrades.forEach(t => {
      if (t.psychologicalMetrics?.wasRevengeTrading) mistakeReasons.push('Revenge trade logged');
      if (t.psychologicalMetrics?.wasChasing) mistakeReasons.push('Chased market move');
      if (t.decision === 'PASS' && t.result === 'LOSS') mistakeReasons.push('Took PASS setup');
      if (t.score < 50 && t.result === 'LOSS') mistakeReasons.push('Low quality setup (<50 score)');
    });
    const isMistakeHeavy = mistakeReasons.length > 0 || (losses >= 2 && pnl < -150);

    days.push({
      date: new Date(current),
      dateStr,
      isCurrentMonth: current.getMonth() === month,
      isToday: dateStr === todayStr,
      trades: dayTrades,
      pnl,
      wins,
      losses,
      breakevens,
      count: dayTrades.length,
      isOvertrading,
      isMistakeHeavy,
      mistakeReasons,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function calculateMonthStats(calendarDays: DayData[]): MonthStats {
  const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth);
  const monthTrades = currentMonthDays.flatMap(d => d.trades);

  const totalTrades = monthTrades.length;
  const totalPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const wins = monthTrades.filter(t => t.result === 'WIN').length;
  const losses = monthTrades.filter(t => t.result === 'LOSS').length;
  const decided = wins + losses;
  const winRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;

  const tradingDays = currentMonthDays.filter(d => d.count > 0);
  const winningDays = tradingDays.filter(d => d.pnl > 0).length;
  const losingDays = tradingDays.filter(d => d.pnl < 0).length;

  let bestDay = 0;
  let worstDay = 0;
  tradingDays.forEach(d => {
    if (d.pnl > bestDay) bestDay = d.pnl;
    if (d.pnl < worstDay) worstDay = d.pnl;
  });

  const highVolumeDays = tradingDays.filter(d => d.isOvertrading).length;
  const mistakeDays = tradingDays.filter(d => d.isMistakeHeavy).length;

  return {
    totalTrades,
    totalPnL,
    wins,
    losses,
    winRate,
    tradingDaysCount: tradingDays.length,
    winningDays,
    losingDays,
    bestDay,
    worstDay,
    highVolumeDays,
    mistakeDays,
  };
}
