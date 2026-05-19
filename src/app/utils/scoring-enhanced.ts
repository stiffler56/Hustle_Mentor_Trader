/**
 * Enhanced Scoring System with Psychological Analysis
 * Provides deeper insights into trading patterns and psychological biases
 */

import type { Decision, ScoreBreakdown, Trade, EmotionalState } from '../data/types-enhanced';

export function calculateScore(params: {
  mentalFocus: number;
  confluences: number;
  buyLowSellHigh: number;
  bias: number;
  session: string;
  risk: number;
}): ScoreBreakdown {
  const mentalScore = (params.mentalFocus / 30) * 30;
  const confluenceScore = (params.confluences / 4) * 25;
  const blshScore = (params.buyLowSellHigh / 30) * 25;
  const biasScore = (params.bias / 30) * 20;

  let sessionBonus = 0;
  if (params.session === 'New York') sessionBonus = 3;
  else if (params.session === 'London') sessionBonus = -3;

  let riskBonus = 0;
  if (params.risk >= 0.5 && params.risk <= 1.5) riskBonus = 2;
  else if (params.risk > 2) riskBonus = -5;

  const raw = mentalScore + confluenceScore + blshScore + biasScore + sessionBonus + riskBonus;
  const total = Math.round(Math.max(0, Math.min(100, raw)));

  let decision: Decision;
  if (total >= 75) decision = 'TAKE';
  else if (total >= 55) decision = 'WAIT';
  else decision = 'PASS';

  return {
    mentalScore: Math.round(mentalScore),
    confluenceScore: Math.round(confluenceScore),
    blshScore: Math.round(blshScore),
    biasScore: Math.round(biasScore),
    sessionBonus,
    riskBonus,
    total,
    decision,
  };
}

/**
 * Enhanced mentor tips with psychological insights
 */
export function getMentorTip(params: {
  mentalFocus: number;
  confluences: number;
  session: string;
  risk: number;
  score: number;
  psychologicalMetrics?: any;
}): string {
  // ─── Critical Risk Warnings ────────────────────────────────────────────
  if (params.mentalFocus < 10) {
    return '🚩 CRITICAL: Mental focus < 10 — Your data shows 100% loss/BE on emotional trades. Close the app and come back later.';
  }

  if (params.risk > 2) {
    return '🚩 RISK ALERT: Risk > 2% — Your biggest losses happen when you over-risk to chase or recover. Stick to 1–1.5%.';
  }

  // ─── Psychological Insights ────────────────────────────────────────────
  if (params.psychologicalMetrics) {
    const { preTradeEmotionalState, wasRevengeTrading, wasChasing } = params.psychologicalMetrics;

    if (preTradeEmotionalState === 'revenge-trading' || wasRevengeTrading) {
      return '🚩 PSYCHOLOGY: You\'re revenge trading. This is when your biggest losses happen. Wait 30 minutes, reset your mindset, then reassess.';
    }

    if (preTradeEmotionalState === 'overconfident' && params.score < 70) {
      return '⚠️ PSYCHOLOGY: Overconfidence + Low Score = High Risk. Your edge is NOT activated. PASS this setup.';
    }

    if (preTradeEmotionalState === 'fearful' && params.score >= 75) {
      return '✅ PSYCHOLOGY: You\'re fearful but the setup is PERFECT. Fear can be good—it keeps you disciplined. Execute with confidence.';
    }
  }

  // ─── Session-Based Insights ────────────────────────────────────────────
  if (params.session === 'London' && params.score < 70) {
    return '⚠️ SESSION: London session. Your NY win rate is 61% vs London at 35%. Consider waiting for New York open.';
  }

  // ─── Confluence Analysis ──────────────────────────────────────────────
  if (params.confluences < 2) {
    return '⚠️ CONFLUENCE: Only 1 confluence — win rate at 33%. You need at least 3 for your edge to activate.';
  }

  // ─── Winning Formula Recognition ──────────────────────────────────────
  if (
    params.confluences >= 3 &&
    params.mentalFocus >= 20 &&
    params.session === 'New York' &&
    params.score >= 75
  ) {
    return '✅ EXACT FORMULA: This matches your WINNING PROFILE: 3+ confluences, high mental focus, NY session. Your data says 65% win rate. Execute with conviction.';
  }

  // ─── General Recommendations ──────────────────────────────────────────
  if (params.score >= 75) {
    return '✅ HIGH-QUALITY SETUP: Aligns with your winning patterns. Execute your plan.';
  }

  if (params.score >= 55) {
    return '⏸ ALMOST THERE: Wait for one more confluence or better entry alignment before executing.';
  }

  return '❌ SETUP MISMATCH: Does not match your edge. PASS. Another opportunity will come.';
}

/**
 * Analyze psychological patterns across multiple trades
 */
export function analyzePsychologicalPatterns(trades: Trade[]): {
  emotionalStateCorrelation: Record<EmotionalState, { winRate: number; avgPnL: number }>;
  revengeTradeImpact: { count: number; avgLoss: number };
  overconfidenceImpact: { count: number; avgLoss: number };
  recommendations: string[];
} {
  const emotionalStats: Record<string, { wins: number; total: number; pnls: number[] }> = {};

  let revengeCount = 0;
  let revengeLosses: number[] = [];
  let overconfidentCount = 0;
  let overconfidentLosses: number[] = [];

  trades.forEach((trade) => {
    const psych = trade.psychologicalMetrics;
    if (!psych) return;

    const state = psych.preTradeEmotionalState;
    if (!emotionalStats[state]) {
      emotionalStats[state] = { wins: 0, total: 0, pnls: [] };
    }

    emotionalStats[state].total += 1;
    if (trade.result === 'WIN') emotionalStats[state].wins += 1;
    if (trade.pnl) emotionalStats[state].pnls.push(trade.pnl);

    if (psych.wasRevengeTrading) {
      revengeCount += 1;
      if (trade.pnl && trade.pnl < 0) revengeLosses.push(trade.pnl);
    }

    if (psych.wasOverconfident) {
      overconfidentCount += 1;
      if (trade.pnl && trade.pnl < 0) overconfidentLosses.push(trade.pnl);
    }
  });

  const emotionalStateCorrelation: Record<EmotionalState, { winRate: number; avgPnL: number }> = {};
  Object.entries(emotionalStats).forEach(([state, stats]) => {
    emotionalStateCorrelation[state as EmotionalState] = {
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
      avgPnL: stats.pnls.length > 0 ? stats.pnls.reduce((a, b) => a + b, 0) / stats.pnls.length : 0,
    };
  });

  const recommendations: string[] = [];

  // Analyze revenge trading impact
  if (revengeCount > 0) {
    const avgRevengeLoss = revengeLosses.length > 0 ? revengeLosses.reduce((a, b) => a + b, 0) / revengeLosses.length : 0;
    recommendations.push(`🚩 Revenge Trading: ${revengeCount} instances detected. Average loss: ${avgRevengeLoss.toFixed(2)}. Implement a 30-minute cooldown after losses.`);
  }

  // Analyze overconfidence impact
  if (overconfidentCount > 0) {
    const avgOverconfidentLoss = overconfidentLosses.length > 0 ? overconfidentLosses.reduce((a, b) => a + b, 0) / overconfidentLosses.length : 0;
    recommendations.push(`⚠️ Overconfidence: ${overconfidentCount} instances detected. Average loss: ${avgOverconfidentLoss.toFixed(2)}. Stick to your risk management rules.`);
  }

  // Find best emotional state
  let bestState: EmotionalState | null = null;
  let bestWinRate = 0;
  Object.entries(emotionalStateCorrelation).forEach(([state, stats]) => {
    if (stats.winRate > bestWinRate) {
      bestWinRate = stats.winRate;
      bestState = state as EmotionalState;
    }
  });

  if (bestState) {
    recommendations.push(`✅ Best Performance: "${bestState}" emotional state has ${bestWinRate.toFixed(1)}% win rate. Aim for this state before trading.`);
  }

  return {
    emotionalStateCorrelation,
    revengeTradeImpact: {
      count: revengeCount,
      avgLoss: revengeLosses.length > 0 ? revengeLosses.reduce((a, b) => a + b, 0) / revengeLosses.length : 0,
    },
    overconfidenceImpact: {
      count: overconfidentCount,
      avgLoss: overconfidentLosses.length > 0 ? overconfidentLosses.reduce((a, b) => a + b, 0) / overconfidentLosses.length : 0,
    },
    recommendations,
  };
}
