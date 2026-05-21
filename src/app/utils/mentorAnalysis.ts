import { Trade } from '../data/types';

/**
 * Mentor Analysis Engine
 * Provides AI-powered insights and recommendations based on trade data and psychology metrics
 */

export interface MentorInsight {
  category: 'risk' | 'psychology' | 'strategy' | 'performance';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  impact: number; // 0-100 scale
}

export interface TradeAnalysis {
  tradeId: string;
  date: string;
  pair: string;
  result: string;
  pnl: number;
  insights: MentorInsight[];
  score: number;
}

/**
 * Analyze a single trade and generate mentor insights
 */
export function analyzeTrade(trade: Trade): TradeAnalysis {
  const insights: MentorInsight[] = [];

  // Risk Management Analysis
  if (trade.riskRewardRatio && trade.riskRewardRatio < 1) {
    insights.push({
      category: 'risk',
      severity: 'warning',
      title: 'Poor Risk/Reward Ratio',
      description: `Your risk/reward ratio is ${trade.riskRewardRatio.toFixed(2)}, which is below the recommended 1:1 minimum.`,
      recommendation: 'Aim for at least a 1:1 risk/reward ratio, ideally 1:2 or better.',
      impact: 25,
    });
  }

  // Position Size Analysis
  if (trade.positionSize && trade.positionSize > 5) {
    insights.push({
      category: 'risk',
      severity: 'warning',
      title: 'Large Position Size',
      description: `Your position size is ${trade.positionSize}% of your account, which is aggressive.`,
      recommendation: 'Consider reducing position size to 1-2% per trade for better risk management.',
      impact: 20,
    });
  }

  // Psychology Analysis
  if (trade.psychologyMetrics) {
    const { preTradeConfidence, postTradeEmotionalState, revengeTrading } = trade.psychologyMetrics;

    if (revengeTrading) {
      insights.push({
        category: 'psychology',
        severity: 'critical',
        title: 'Revenge Trading Detected',
        description: 'This trade was marked as revenge trading, which often leads to poor decision-making.',
        recommendation: 'After a loss, take a break. Review what went wrong before entering the next trade.',
        impact: 50,
      });
    }

    if (preTradeConfidence && preTradeConfidence > 80) {
      insights.push({
        category: 'psychology',
        severity: 'warning',
        title: 'Overconfidence Alert',
        description: `Your pre-trade confidence was ${preTradeConfidence}%, which may indicate overconfidence.`,
        recommendation: 'High confidence can lead to poor risk management. Stay disciplined regardless of confidence level.',
        impact: 15,
      });
    }

    if (postTradeEmotionalState === 'frustrated' || postTradeEmotionalState === 'angry') {
      insights.push({
        category: 'psychology',
        severity: 'warning',
        title: 'Emotional Trading Detected',
        description: `You were ${postTradeEmotionalState} after this trade. Emotions can cloud judgment.`,
        recommendation: 'Develop a post-trade routine to manage emotions and reflect objectively.',
        impact: 20,
      });
    }
  }

  // Performance Analysis
  if (trade.pnl) {
    if (trade.pnl > 0 && trade.result === 'WIN') {
      insights.push({
        category: 'performance',
        severity: 'info',
        title: 'Strong Win',
        description: `Great execution! You captured ${trade.pnl} in profit.`,
        recommendation: 'Document what you did right and replicate this setup in future trades.',
        impact: 10,
      });
    } else if (trade.pnl < 0 && trade.result === 'LOSS') {
      insights.push({
        category: 'performance',
        severity: 'warning',
        title: 'Loss Analysis',
        description: `You lost ${Math.abs(trade.pnl)} on this trade. Review your exit strategy.`,
        recommendation: 'Analyze whether you exited too early or held too long. Adjust your exit rules accordingly.',
        impact: 30,
      });
    }
  }

  // Calculate overall trade score (0-100)
  const score = Math.max(0, 100 - insights.reduce((sum, i) => sum + i.impact, 0));

  return {
    tradeId: trade.id,
    date: trade.date,
    pair: trade.pair,
    result: trade.result ?? trade.status,
    pnl: trade.pnl || 0,
    insights,
    score,
  };
}

/**
 * Generate portfolio-level mentor insights from multiple trades
 */
export function generatePortfolioInsights(trades: Trade[]): MentorInsight[] {
  const insights: MentorInsight[] = [];

  if (trades.length === 0) return insights;

  // Win Rate Analysis
  const wins = trades.filter((t) => t.result === 'WIN' || t.status === 'WIN').length;
  const winRate = (wins / trades.length) * 100;

  if (winRate < 40) {
    insights.push({
      category: 'strategy',
      severity: 'critical',
      title: 'Low Win Rate',
      description: `Your win rate is ${winRate.toFixed(1)}%, which is below the 50% benchmark.`,
      recommendation: 'Review your entry strategy and improve your trade selection criteria.',
      impact: 40,
    });
  }

  // Profit Factor Analysis
  const totalWins = trades
    .filter((t) => t.result === 'WIN' || t.status === 'WIN')
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalLosses = Math.abs(
    trades
      .filter((t) => t.result === 'LOSS' || t.status === 'LOSS')
      .reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

  if (profitFactor < 1.5) {
    insights.push({
      category: 'strategy',
      severity: 'warning',
      title: 'Low Profit Factor',
      description: `Your profit factor is ${profitFactor.toFixed(2)}, indicating losses are close to wins.`,
      recommendation: 'Focus on increasing your average win size or reducing your average loss size.',
      impact: 25,
    });
  }

  // Consistency Analysis
  const recentTrades = trades.slice(-10);
  const recentWinRate = (recentTrades.filter((t) => t.result === 'WIN' || t.status === 'WIN').length / recentTrades.length) * 100;

  if (Math.abs(recentWinRate - winRate) > 20) {
    insights.push({
      category: 'strategy',
      severity: 'warning',
      title: 'Inconsistent Performance',
      description: `Your recent win rate (${recentWinRate.toFixed(1)}%) differs significantly from your overall rate (${winRate.toFixed(1)}%).`,
      recommendation: 'Identify what changed recently and whether it\'s a temporary variance or a systematic issue.',
      impact: 20,
    });
  }

  return insights;
}

/**
 * Generate a personalized mentor tip based on trade history
 */
export function generateMentorTip(trades: Trade[]): string {
  if (trades.length === 0) {
    return 'Start logging your trades to get personalized mentor insights!';
  }

  const recentTrades = trades.slice(-5);
  const recentLosses = recentTrades.filter((t) => t.result === 'LOSS' || t.status === 'LOSS');

  if (recentLosses.length === recentTrades.length) {
    return '🔴 You\'ve had a losing streak. Take a break and review your strategy before the next trade.';
  }

  const avgPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / trades.length;
  if (avgPnL > 0) {
    return '🟢 You\'re profitable! Keep following your trading plan and managing risk consistently.';
  }

  return '📊 Keep logging trades and refining your strategy. Consistency beats perfection!';
}
