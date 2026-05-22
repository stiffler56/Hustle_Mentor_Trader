import { Trade } from '../data/types';

/**
 * Pattern Recognition Engine
 * Automatically detects profitable trading patterns and provides actionable insights
 */

export interface TradePattern {
  id: string;
  name: string;
  description: string;
  criteria: {
    pair?: string;
    timeOfDay?: string;
    dayOfWeek?: string;
    marketCondition?: string;
    entryType?: string;
    exitType?: string;
  };
  trades: Trade[];
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  totalPnL: number;
  frequency: number;
  confidence: number; // 0-100 based on sample size
}

export interface PatternInsight {
  pattern: TradePattern;
  recommendation: string;
  potentialMonthlyPnL: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Detect patterns based on time of day
 */
export function detectTimeOfDayPatterns(trades: Trade[]): TradePattern[] {
  const timeSlots = {
    'early_morning': { start: 0, end: 6, trades: [] as Trade[] },
    'morning': { start: 6, end: 12, trades: [] as Trade[] },
    'afternoon': { start: 12, end: 18, trades: [] as Trade[] },
    'evening': { start: 18, end: 24, trades: [] as Trade[] },
  };

  trades.forEach((trade) => {
    const hour = new Date(trade.date).getHours();
    Object.entries(timeSlots).forEach(([slot, data]) => {
      if (hour >= data.start && hour < data.end) {
        data.trades.push(trade);
      }
    });
  });

  return Object.entries(timeSlots)
    .map(([slot, data]) => calculatePatternMetrics(data.trades, `${slot.replace('_', ' ')} Trading`))
    .filter((pattern) => pattern.trades.length >= 5);
}

/**
 * Detect patterns based on currency pair
 */
export function detectPairPatterns(trades: Trade[]): TradePattern[] {
  const pairGroups: { [key: string]: Trade[] } = {};

  trades.forEach((trade) => {
    if (!pairGroups[trade.pair]) {
      pairGroups[trade.pair] = [];
    }
    pairGroups[trade.pair].push(trade);
  });

  return Object.entries(pairGroups)
    .map(([pair, pairTrades]) => calculatePatternMetrics(pairTrades, `${pair} Pattern`))
    .filter((pattern) => pattern.trades.length >= 5);
}

/**
 * Detect patterns based on day of week
 */
export function detectDayOfWeekPatterns(trades: Trade[]): TradePattern[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayGroups: { [key: string]: Trade[] } = {};

  days.forEach((day) => {
    dayGroups[day] = [];
  });

  trades.forEach((trade) => {
    const dayName = days[new Date(trade.date).getDay()];
    dayGroups[dayName].push(trade);
  });

  return Object.entries(dayGroups)
    .map(([day, dayTrades]) => calculatePatternMetrics(dayTrades, `${day} Trading`))
    .filter((pattern) => pattern.trades.length >= 3);
}

/**
 * Detect patterns based on entry/exit methods
 */
export function detectMethodPatterns(trades: Trade[]): TradePattern[] {
  const methodGroups: { [key: string]: Trade[] } = {};

  trades.forEach((trade) => {
    const method = `${trade.entryMethod || 'Unknown'} Entry`;
    if (!methodGroups[method]) {
      methodGroups[method] = [];
    }
    methodGroups[method].push(trade);
  });

  return Object.entries(methodGroups)
    .map(([method, methodTrades]) => calculatePatternMetrics(methodTrades, `${method} Pattern`))
    .filter((pattern) => pattern.trades.length >= 5);
}

/**
 * Detect high-confidence profitable patterns
 */
export function detectProfitablePatterns(trades: Trade[]): PatternInsight[] {
  const allPatterns: TradePattern[] = [
    ...detectTimeOfDayPatterns(trades),
    ...detectPairPatterns(trades),
    ...detectDayOfWeekPatterns(trades),
    ...detectMethodPatterns(trades),
  ];

  // Filter for high-confidence, profitable patterns
  const profitablePatterns = allPatterns
    .filter((pattern) => pattern.winRate > 55 && pattern.profitFactor > 1.5 && pattern.confidence > 60)
    .sort((a, b) => b.profitFactor - a.profitFactor);

  return profitablePatterns.map((pattern) => ({
    pattern,
    recommendation: generatePatternRecommendation(pattern),
    potentialMonthlyPnL: estimateMonthlyPnL(pattern),
    riskLevel: assessPatternRisk(pattern),
  }));
}

/**
 * Calculate metrics for a pattern
 */
function calculatePatternMetrics(patternTrades: Trade[], patternName: string): TradePattern {
  if (patternTrades.length === 0) {
    return {
      id: `pattern_${Date.now()}`,
      name: patternName,
      description: 'No trades found for this pattern',
      criteria: {},
      trades: [],
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      totalPnL: 0,
      frequency: 0,
      confidence: 0,
    };
  }

  const wins = patternTrades.filter((t) => t.result === 'WIN' || t.status === 'WIN');
  const losses = patternTrades.filter((t) => t.result === 'LOSS' || t.status === 'LOSS');

  const totalWinPnL = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLossPnL = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

  const winRate = (wins.length / patternTrades.length) * 100;
  const profitFactor = totalLossPnL > 0 ? totalWinPnL / totalLossPnL : 0;
  const averageWin = wins.length > 0 ? totalWinPnL / wins.length : 0;
  const averageLoss = losses.length > 0 ? totalLossPnL / losses.length : 0;
  const totalPnL = totalWinPnL - totalLossPnL;

  // Confidence increases with sample size (max at 100 trades)
  const confidence = Math.min(100, (patternTrades.length / 100) * 100);

  return {
    id: `pattern_${patternName.replace(/\s/g, '_')}_${Date.now()}`,
    name: patternName,
    description: `Pattern identified from ${patternTrades.length} trades`,
    criteria: {},
    trades: patternTrades,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    totalPnL,
    frequency: patternTrades.length,
    confidence,
  };
}

/**
 * Generate a recommendation for a pattern
 */
function generatePatternRecommendation(pattern: TradePattern): string {
  if (pattern.winRate > 70 && pattern.profitFactor > 2) {
    return `🟢 Excellent pattern! ${pattern.name} has a ${pattern.winRate.toFixed(1)}% win rate. Consider increasing position size for this pattern.`;
  }

  if (pattern.winRate > 60 && pattern.profitFactor > 1.5) {
    return `🟡 Strong pattern. ${pattern.name} shows consistent profitability. Focus on replicating the conditions that make this pattern work.`;
  }

  if (pattern.winRate > 55 && pattern.profitFactor > 1.2) {
    return `🟠 Moderate pattern. ${pattern.name} is profitable but needs refinement. Analyze losing trades to improve entry/exit timing.`;
  }

  return `⚪ Monitor this pattern. More data needed to confirm ${pattern.name}'s profitability.`;
}

/**
 * Estimate monthly PnL if pattern is traded 20 times per month
 */
function estimateMonthlyPnL(pattern: TradePattern): number {
  const tradesPerMonth = 20;
  const expectedWins = tradesPerMonth * (pattern.winRate / 100);
  const expectedLosses = tradesPerMonth * (1 - pattern.winRate / 100);

  return expectedWins * pattern.averageWin - expectedLosses * pattern.averageLoss;
}

/**
 * Assess the risk level of a pattern
 */
function assessPatternRisk(pattern: TradePattern): 'low' | 'medium' | 'high' {
  if (pattern.averageLoss > pattern.averageWin * 2) {
    return 'high';
  }

  if (pattern.averageLoss > pattern.averageWin * 1.5) {
    return 'medium';
  }

  return 'low';
}

/**
 * Get top profitable patterns
 */
export function getTopPatterns(trades: Trade[], limit: number = 5): PatternInsight[] {
  return detectProfitablePatterns(trades).slice(0, limit);
}

/**
 * Generate pattern summary for dashboard
 */
export function generatePatternSummary(trades: Trade[]): {
  totalPatternsFound: number;
  profitablePatterns: number;
  topPattern: PatternInsight | null;
  estimatedMonthlyPnL: number;
} {
  const insights = detectProfitablePatterns(trades);

  return {
    totalPatternsFound: insights.length,
    profitablePatterns: insights.filter((i) => i.pattern.profitFactor > 1.5).length,
    topPattern: insights.length > 0 ? insights[0] : null,
    estimatedMonthlyPnL: insights.reduce((sum, i) => sum + i.potentialMonthlyPnL, 0),
  };
}
