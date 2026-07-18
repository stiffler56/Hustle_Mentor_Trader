/**
 * Advanced Analytics Utilities
 * Issue #2: Enhanced Reporting and Customization
 * Provides professional-grade analytics including Equity Curve, Drawdown, and performance metrics
 */

import type { Trade } from '../data/types';

// ─── Equity Curve Data ─────────────────────────────────────────────────────
export interface EquityCurvePoint {
  date: string;
  cumulativePnL: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
}

export function calculateEquityCurve(trades: Trade[], initialBalance: number = 10000): EquityCurvePoint[] {
  const closedTrades = trades
    .filter(t => t.status === 'CLOSED' && t.result && t.pnl !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const equityCurve: EquityCurvePoint[] = [];
  let cumulativePnL = 0;
  let winCount = 0;
  let lossCount = 0;

  closedTrades.forEach((trade, index) => {
    cumulativePnL += trade.pnl ?? 0;
    if (trade.result === 'WIN') winCount++;
    else if (trade.result === 'LOSS') lossCount++;

    equityCurve.push({
      date: trade.date,
      cumulativePnL,
      tradeCount: index + 1,
      winCount,
      lossCount,
    });
  });

  return equityCurve;
}

// ─── Drawdown Analysis ────────────────────────────────────────────────────
export interface DrawdownData {
  date: string;
  equity: number;
  drawdown: number;
  drawdownPercent: number;
  peakEquity: number;
}

export function calculateDrawdown(equityCurve: EquityCurvePoint[], initialBalance: number = 10000): DrawdownData[] {
  const drawdownData: DrawdownData[] = [];
  let peakEquity = initialBalance;

  equityCurve.forEach((point) => {
    const currentEquity = initialBalance + point.cumulativePnL;
    if (currentEquity > peakEquity) {
      peakEquity = currentEquity;
    }

    const drawdown = peakEquity - currentEquity;
    const drawdownPercent = (drawdown / peakEquity) * 100;

    drawdownData.push({
      date: point.date,
      equity: currentEquity,
      drawdown,
      drawdownPercent,
      peakEquity,
    });
  });

  return drawdownData;
}

// ─── Maximum Drawdown ─────────────────────────────────────────────────────
export interface MaxDrawdownStats {
  maxDrawdown: number;
  maxDrawdownPercent: number;
  maxDrawdownDate: string;
  currentDrawdown: number;
  currentDrawdownPercent: number;
}

export function calculateMaxDrawdown(drawdownData: DrawdownData[]): MaxDrawdownStats {
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let maxDrawdownDate = '';

  drawdownData.forEach((point) => {
    if (point.drawdown > maxDrawdown) {
      maxDrawdown = point.drawdown;
      maxDrawdownPercent = point.drawdownPercent;
      maxDrawdownDate = point.date;
    }
  });

  const currentDrawdown = drawdownData.length > 0 ? drawdownData[drawdownData.length - 1].drawdown : 0;
  const currentDrawdownPercent = drawdownData.length > 0 ? drawdownData[drawdownData.length - 1].drawdownPercent : 0;

  return {
    maxDrawdown,
    maxDrawdownPercent,
    maxDrawdownDate,
    currentDrawdown,
    currentDrawdownPercent,
  };
}

// ─── Performance Metrics ──────────────────────────────────────────────────
export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  winRate: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  riskRewardRatio: number;
  expectancy: number;
  sharpeRatio: number;
  returnOnRisk: number;
}

export function calculatePerformanceMetrics(trades: Trade[], riskFreeRate: number = 0.02): PerformanceMetrics {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.result && t.pnl !== undefined);

  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalPnL: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      riskRewardRatio: 0,
      expectancy: 0,
      sharpeRatio: 0,
      returnOnRisk: 0,
    };
  }

  const wins = closedTrades.filter(t => t.result === 'WIN');
  const losses = closedTrades.filter(t => t.result === 'LOSS');
  const breakEvens = closedTrades.filter(t => t.result === 'BE');

  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winPnL = wins.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const lossPnL = Math.abs(losses.reduce((sum, t) => sum + (t.pnl ?? 0), 0));

  const averageWin = wins.length > 0 ? winPnL / wins.length : 0;
  const averageLoss = losses.length > 0 ? lossPnL / losses.length : 0;
  const profitFactor = lossPnL > 0 ? winPnL / lossPnL : winPnL > 0 ? Infinity : 0;
  const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : 0;

  const winRate = (wins.length / closedTrades.length) * 100;
  const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss;

  // Sharpe Ratio calculation (simplified)
  const returns = closedTrades.map(t => t.pnl ?? 0);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn - riskFreeRate / closedTrades.length) / stdDev : 0;

  // Return on Risk (assuming average risk per trade)
  const avgRisk = closedTrades.reduce((sum, t) => sum + (t.risk ?? 0), 0) / closedTrades.length;
  const returnOnRisk = avgRisk > 0 ? totalPnL / (avgRisk * closedTrades.length) : 0;

  return {
    totalTrades: closedTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    breakEvenTrades: breakEvens.length,
    winRate: Math.round(winRate * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    averageWin: Math.round(averageWin * 100) / 100,
    averageLoss: Math.round(averageLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    returnOnRisk: Math.round(returnOnRisk * 100) / 100,
  };
}

// ─── Monthly Performance ──────────────────────────────────────────────────
export interface MonthlyPerformance {
  month: string;
  totalPnL: number;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function calculateMonthlyPerformance(trades: Trade[]): MonthlyPerformance[] {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.result && t.pnl !== undefined);
  const monthlyMap: Record<string, Trade[]> = {};

  closedTrades.forEach((trade) => {
    const month = trade.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[month]) monthlyMap[month] = [];
    monthlyMap[month].push(trade);
  });

  return Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, monthTrades]) => {
      const wins = monthTrades.filter(t => t.result === 'WIN').length;
      const losses = monthTrades.filter(t => t.result === 'LOSS').length;
      const totalPnL = monthTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

      return {
        month,
        totalPnL: Math.round(totalPnL * 100) / 100,
        trades: monthTrades.length,
        wins,
        losses,
        winRate: monthTrades.length > 0 ? Math.round((wins / monthTrades.length) * 100) : 0,
      };
    });
}

// ─── Consecutive Wins/Losses ──────────────────────────────────────────────
export interface ConsecutiveStats {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
}

export function calculateConsecutiveStats(trades: Trade[]): ConsecutiveStats {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.result).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let currentStreakType: 'win' | 'loss' | 'none' = 'none';
  let currentStreakCount = 0;

  closedTrades.forEach((trade) => {
    if (trade.result === 'WIN') {
      currentWinStreak++;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWinStreak);
      currentLossStreak = 0;
      currentStreakType = 'win';
      currentStreakCount = currentWinStreak;
    } else if (trade.result === 'LOSS') {
      currentLossStreak++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLossStreak);
      currentWinStreak = 0;
      currentStreakType = 'loss';
      currentStreakCount = currentLossStreak;
    }
  });

  return {
    maxConsecutiveWins,
    maxConsecutiveLosses,
    currentStreak: {
      type: currentStreakType,
      count: currentStreakCount,
    },
  };
}
