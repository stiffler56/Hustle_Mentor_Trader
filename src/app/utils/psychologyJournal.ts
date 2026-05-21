/**
 * Psychology Journal Utilities
 * Issue #4: Psychological Journaling and Analysis
 * Tracks emotional state, psychological patterns, and provides AI-powered insights
 */

import type { Trade, EmotionalState, PsychologicalFactor } from '../data/types';

// ─── Psychology Journal Entry ──────────────────────────────────────────────
export interface PsychologyEntry {
  id: string;
  tradeId: string;
  date: string;
  preTradeEmotionalState: EmotionalState;
  postTradeEmotionalState: EmotionalState;
  preTradeConfidence: number; // 1-10
  postTradeEmotionalResponse: string;
  psychologicalFactorsPresent: PsychologicalFactor[];
  wasRevengeTrading: boolean;
  wasChasing: boolean;
  wasOverconfident: boolean;
  stressLevel: number; // 1-10
  sleepQuality: number; // 1-10
  externalFactors: string; // e.g., "Market news", "Personal stress"
  lessonsLearned: string;
  affirmation: string;
  createdAt: string;
}

// ─── Emotional State Definitions ───────────────────────────────────────────
export const EMOTIONAL_STATES: Record<EmotionalState, { description: string; color: string }> = {
  confident: { description: 'Confident and focused', color: '#10b981' },
  anxious: { description: 'Anxious or uncertain', color: '#f59e0b' },
  neutral: { description: 'Calm and neutral', color: '#6b7280' },
  'revenge-trading': { description: 'Revenge trading (emotional)', color: '#ef4444' },
  overconfident: { description: 'Overconfident', color: '#f97316' },
  fearful: { description: 'Fearful or hesitant', color: '#ec4899' },
};

// ─── Psychological Factors ─────────────────────────────────────────────────
export const PSYCHOLOGICAL_FACTORS: Record<PsychologicalFactor, { description: string; impact: 'negative' | 'positive' }> = {
  discipline: { description: 'Disciplined decision-making', impact: 'positive' },
  patience: { description: 'Patient waiting for setup', impact: 'positive' },
  greed: { description: 'Greedy for more profit', impact: 'negative' },
  fear: { description: 'Fear of missing out or losing', impact: 'negative' },
  overconfidence: { description: 'Overconfident in analysis', impact: 'negative' },
  revenge: { description: 'Revenge trading after loss', impact: 'negative' },
};

// ─── Create Psychology Entry ──────────────────────────────────────────────
export function createPsychologyEntry(
  tradeId: string,
  data: Omit<PsychologyEntry, 'id' | 'createdAt' | 'tradeId'>
): PsychologyEntry {
  return {
    ...data,
    tradeId,
    id: `psych-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
}

// ─── Analyze Emotional Patterns ────────────────────────────────────────────
export interface EmotionalPattern {
  emotionalState: EmotionalState;
  frequency: number;
  averageWinRate: number;
  averagePnL: number;
  totalTrades: number;
}

export function analyzeEmotionalPatterns(trades: Trade[]): EmotionalPattern[] {
  const patterns: Record<EmotionalState, { wins: number; total: number; pnls: number[] }> = {
    confident: { wins: 0, total: 0, pnls: [] },
    anxious: { wins: 0, total: 0, pnls: [] },
    neutral: { wins: 0, total: 0, pnls: [] },
    'revenge-trading': { wins: 0, total: 0, pnls: [] },
    overconfident: { wins: 0, total: 0, pnls: [] },
    fearful: { wins: 0, total: 0, pnls: [] },
  };

  trades.forEach((trade) => {
    if (!trade.psychologicalMetrics) return;

    const state = trade.psychologicalMetrics.preTradeEmotionalState;
    patterns[state].total += 1;

    if (trade.result === 'WIN') patterns[state].wins += 1;
    if (trade.pnl) patterns[state].pnls.push(trade.pnl);
  });

  return Object.entries(patterns)
    .filter(([_, data]) => data.total > 0)
    .map(([state, data]) => ({
      emotionalState: state as EmotionalState,
      frequency: data.total,
      averageWinRate: (data.wins / data.total) * 100,
      averagePnL: data.pnls.length > 0 ? data.pnls.reduce((a, b) => a + b, 0) / data.pnls.length : 0,
      totalTrades: data.total,
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// ─── Detect Psychological Biases ───────────────────────────────────────────
export interface PsychologicalBias {
  biasType: PsychologicalFactor;
  occurrences: number;
  winRate: number;
  averageLoss: number;
  recommendation: string;
}

export function detectPsychologicalBiases(trades: Trade[]): PsychologicalBias[] {
  const biases: Record<PsychologicalFactor, { count: number; wins: number; losses: number[] }> = {
    discipline: { count: 0, wins: 0, losses: [] },
    patience: { count: 0, wins: 0, losses: [] },
    greed: { count: 0, wins: 0, losses: [] },
    fear: { count: 0, wins: 0, losses: [] },
    overconfidence: { count: 0, wins: 0, losses: [] },
    revenge: { count: 0, wins: 0, losses: [] },
  };

  trades.forEach((trade) => {
    if (!trade.psychologicalMetrics) return;

    trade.psychologicalMetrics.psychologicalFactorsPresent.forEach((factor) => {
      biases[factor].count += 1;
      if (trade.result === 'WIN') biases[factor].wins += 1;
      if (trade.result === 'LOSS' && trade.pnl) biases[factor].losses.push(Math.abs(trade.pnl));
    });
  });

  const recommendations: Record<PsychologicalFactor, string> = {
    discipline: 'Your disciplined trades are winning. Keep following your rules.',
    patience: 'Patience is your edge. Wait for the perfect setup.',
    greed: 'Greed is costing you. Stick to your profit targets.',
    fear: 'Fear is preventing wins. Trust your analysis.',
    overconfidence: 'Overconfidence leads to losses. Stick to risk management.',
    revenge: 'Revenge trading is destructive. Take a break after losses.',
  };

  return Object.entries(biases)
    .filter(([_, data]) => data.count > 0)
    .map(([factor, data]) => ({
      biasType: factor as PsychologicalFactor,
      occurrences: data.count,
      winRate: (data.wins / data.count) * 100,
      averageLoss: data.losses.length > 0 ? data.losses.reduce((a, b) => a + b, 0) / data.losses.length : 0,
      recommendation: recommendations[factor as PsychologicalFactor],
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

// ─── Generate Psychology Insights ─────────────────────────────────────────
export interface PsychologyInsight {
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  actionItems: string[];
}

export function generatePsychologyInsights(trades: Trade[]): PsychologyInsight[] {
  const insights: PsychologyInsight[] = [];
  const patterns = analyzeEmotionalPatterns(trades);
  const biases = detectPsychologicalBiases(trades);

  // Find best emotional state
  const bestPattern = patterns.length > 0
    ? patterns.reduce((best, current) =>
      current.averageWinRate > best.averageWinRate ? current : best
    )
    : null;

  if (bestPattern) {
    insights.push({
      title: `Your Best Emotional State: ${bestPattern.emotionalState}`,
      description: `You trade best when ${EMOTIONAL_STATES[bestPattern.emotionalState].description.toLowerCase()}. Your win rate is ${bestPattern.averageWinRate.toFixed(1)}% in this state.`,
      severity: 'info',
      actionItems: [
        `Aim to trade primarily when you're in a "${bestPattern.emotionalState}" emotional state`,
        'Develop pre-trade routines to achieve this state consistently',
        'Track your emotional state before each trade',
      ],
    });
  }

  // Detect revenge trading
  const revengeTraders = trades.filter((t) => t.psychologicalMetrics?.wasRevengeTrading);
  if (revengeTraders.length > 0) {
    const revengeWinRate = (revengeTraders.filter((t) => t.result === 'WIN').length / revengeTraders.length) * 100;
    insights.push({
      title: '🚩 Revenge Trading Detected',
      description: `You've revenge traded ${revengeTraders.length} times with a ${revengeWinRate.toFixed(1)}% win rate (below your average).`,
      severity: 'critical',
      actionItems: [
        'Implement a mandatory 30-minute cooldown after losses',
        'Use a trading checklist to reset your mindset',
        'Track your emotional state to prevent revenge trading',
      ],
    });
  }

  // Detect overconfidence
  const overconfidentTrades = trades.filter((t) => t.psychologicalMetrics?.wasOverconfident);
  if (overconfidentTrades.length > 0) {
    const overconfidentWinRate = (overconfidentTrades.filter((t) => t.result === 'WIN').length / overconfidentTrades.length) * 100;
    insights.push({
      title: '⚠️ Overconfidence Pattern',
      description: `Overconfident trades have a ${overconfidentWinRate.toFixed(1)}% win rate. This may indicate deviation from your edge.`,
      severity: 'warning',
      actionItems: [
        'Stick to your risk management rules regardless of confidence',
        'Validate setups against your checklist before entering',
        'Review overconfident trades to identify what went wrong',
      ],
    });
  }

  // Detect chasing
  const chasingTrades = trades.filter((t) => t.psychologicalMetrics?.wasChasing);
  if (chasingTrades.length > 0) {
    insights.push({
      title: '⚠️ Chasing Behavior Detected',
      description: `You've chased ${chasingTrades.length} trades. Chasing often leads to poor entries and exits.`,
      severity: 'warning',
      actionItems: [
        'Wait for the next setup instead of chasing current moves',
        'Set entry alerts and wait for price to come to you',
        'Review your trading plan before each session',
      ],
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: 'Start Building Your Psychology Dataset',
      description: 'No major psychological patterns are visible yet. Add psychology notes to each closed trade so HustleDashboard can identify your best and worst mental states.',
      severity: 'info',
      actionItems: [
        'Add a psychology review to your next 10 closed trades',
        'Track revenge trading, chasing, and overconfidence honestly',
        'Review this page weekly to detect repeat patterns',
      ],
    });
  }

  return insights;
}

// ─── Calculate Psychology Score ───────────────────────────────────────────
export function calculatePsychologyScore(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  let score = 100;
  const patterns = analyzeEmotionalPatterns(trades);
  const biases = detectPsychologicalBiases(trades);

  // Penalize for negative biases
  biases.forEach((bias) => {
    if (PSYCHOLOGICAL_FACTORS[bias.biasType].impact === 'negative') {
      const penalty = (bias.occurrences / trades.length) * 20;
      score -= penalty;
    }
  });

  // Reward for positive biases
  biases.forEach((bias) => {
    if (PSYCHOLOGICAL_FACTORS[bias.biasType].impact === 'positive') {
      const reward = (bias.occurrences / trades.length) * 10;
      score += reward;
    }
  });

  // Penalize for low win rates in certain states
  patterns.forEach((pattern) => {
    if (pattern.averageWinRate < 40) {
      score -= 5;
    }
  });

  return Math.max(0, Math.min(100, Math.round(score)));
}
