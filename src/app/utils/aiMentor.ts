import type { AIAnalysis, Trade } from '../data/types';

type Severity = 'success' | 'warning' | 'danger' | 'info';

export interface MentorInsight {
  title: string;
  description: string;
  severity: Severity;
  evidence: string;
  action: string;
}

export interface MentorReport {
  summary: string;
  confidence: number;
  insights: MentorInsight[];
  strengths: string[];
  weaknesses: string[];
  nextActions: string[];
  bestSetup?: string;
  worstPattern?: string;
}

const closedTrades = (trades: Trade[]) => trades.filter((trade) => trade.status === 'CLOSED' && trade.result);
const winningTrades = (trades: Trade[]) => trades.filter((trade) => trade.result === 'WIN');
const losingTrades = (trades: Trade[]) => trades.filter((trade) => trade.result === 'LOSS');

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function avg(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function groupBy<T extends string>(trades: Trade[], getter: (trade: Trade) => T): Record<T, Trade[]> {
  return trades.reduce((groups, trade) => {
    const key = getter(trade);
    groups[key] = groups[key] || [];
    groups[key].push(trade);
    return groups;
  }, {} as Record<T, Trade[]>);
}

function findBestGroup<T extends string>(groups: Record<T, Trade[]>): { key: T; winRate: number; count: number; pnl: number } | null {
  const entries = Object.entries(groups) as [T, Trade[]][];
  if (!entries.length) return null;

  return entries
    .map(([key, items]) => ({
      key,
      count: items.length,
      winRate: pct(winningTrades(items).length, items.length),
      pnl: items.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
    }))
    .sort((a, b) => b.winRate - a.winRate || b.pnl - a.pnl)[0];
}

function findWorstGroup<T extends string>(groups: Record<T, Trade[]>): { key: T; winRate: number; count: number; pnl: number } | null {
  const entries = Object.entries(groups) as [T, Trade[]][];
  if (!entries.length) return null;

  return entries
    .map(([key, items]) => ({
      key,
      count: items.length,
      winRate: pct(winningTrades(items).length, items.length),
      pnl: items.reduce((sum, trade) => sum + (trade.pnl || 0), 0),
    }))
    .sort((a, b) => a.winRate - b.winRate || a.pnl - b.pnl)[0];
}

export function generateMentorReport(trades: Trade[]): MentorReport {
  const closed = closedTrades(trades);
  const wins = winningTrades(closed);
  const losses = losingTrades(closed);
  const totalPnL = closed.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winRate = pct(wins.length, closed.length);
  const avgWin = avg(wins.map((trade) => trade.pnl || 0));
  const avgLoss = Math.abs(avg(losses.map((trade) => trade.pnl || 0)));
  const profitFactor = avgLoss > 0 && losses.length > 0
    ? (wins.reduce((sum, trade) => sum + Math.max(0, trade.pnl || 0), 0) / Math.abs(losses.reduce((sum, trade) => sum + Math.min(0, trade.pnl || 0), 0)))
    : wins.length > 0 ? 999 : 0;

  const sessionBest = findBestGroup(groupBy(closed, (trade) => trade.session));
  const sessionWorst = findWorstGroup(groupBy(closed, (trade) => trade.session));
  const strategyBest = findBestGroup(groupBy(closed, (trade) => trade.strategy));
  const strategyWorst = findWorstGroup(groupBy(closed, (trade) => trade.strategy));
  const highRiskTrades = closed.filter((trade) => trade.risk > 2);
  const lowFocusTrades = closed.filter((trade) => trade.mentalFocus < 10);
  const psychologyTrades = closed.filter((trade) => trade.psychologicalMetrics);
  const revengeTrades = closed.filter((trade) => trade.psychologicalMetrics?.wasRevengeTrading);
  const chasingTrades = closed.filter((trade) => trade.psychologicalMetrics?.wasChasing);
  const overconfidentTrades = closed.filter((trade) => trade.psychologicalMetrics?.wasOverconfident);

  const insights: MentorInsight[] = [];

  if (closed.length === 0) {
    insights.push({
      title: 'No closed trade data yet',
      description: 'The mentor needs closed trades to detect reliable patterns.',
      severity: 'info',
      evidence: '0 closed trades found.',
      action: 'Close or import at least 10 trades, then review this page again.',
    });
  } else {
    insights.push({
      title: 'Performance baseline',
      description: `Your current closed-trade win rate is ${winRate}% with total P&L of $${totalPnL.toFixed(2)}.`,
      severity: totalPnL >= 0 ? 'success' : 'warning',
      evidence: `${closed.length} closed trades, ${wins.length} wins, ${losses.length} losses, profit factor ${profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}.`,
      action: winRate >= 50 ? 'Protect this edge by only taking trades that match your best setup profile.' : 'Reduce trade frequency and require stronger confluence before taking new setups.',
    });
  }

  if (sessionBest) {
    insights.push({
      title: `Best session: ${sessionBest.key}`,
      description: `${sessionBest.key} is currently your strongest session with a ${sessionBest.winRate}% win rate.`,
      severity: 'success',
      evidence: `${sessionBest.count} trades, $${sessionBest.pnl.toFixed(2)} total P&L.`,
      action: `Prioritize ${sessionBest.key} setups until another session proves stronger with more data.`,
    });
  }

  if (sessionWorst && sessionWorst.count >= 2) {
    insights.push({
      title: `Weak session: ${sessionWorst.key}`,
      description: `${sessionWorst.key} is underperforming compared with your other sessions.`,
      severity: 'warning',
      evidence: `${sessionWorst.count} trades, ${sessionWorst.winRate}% win rate, $${sessionWorst.pnl.toFixed(2)} total P&L.`,
      action: `Trade ${sessionWorst.key} only when score is 75+ and confluence is 3 or higher.`,
    });
  }

  if (strategyBest) {
    insights.push({
      title: `Best strategy: ${strategyBest.key}`,
      description: `${strategyBest.key} is currently your highest-performing strategy profile.`,
      severity: 'success',
      evidence: `${strategyBest.count} trades, ${strategyBest.winRate}% win rate, $${strategyBest.pnl.toFixed(2)} total P&L.`,
      action: `Document your exact checklist for ${strategyBest.key} and repeat only the highest-quality version.`,
    });
  }

  if (strategyWorst && strategyWorst.count >= 2 && strategyWorst.winRate < 50) {
    insights.push({
      title: `Strategy leak: ${strategyWorst.key}`,
      description: `${strategyWorst.key} may be reducing consistency.`,
      severity: 'warning',
      evidence: `${strategyWorst.count} trades, ${strategyWorst.winRate}% win rate, $${strategyWorst.pnl.toFixed(2)} total P&L.`,
      action: `Pause or tighten rules for ${strategyWorst.key} until you review screenshots and replay notes.`,
    });
  }

  if (highRiskTrades.length > 0) {
    insights.push({
      title: 'Risk discipline warning',
      description: `${highRiskTrades.length} closed trades risked more than 2%.`,
      severity: 'danger',
      evidence: `High-risk trade P&L: $${highRiskTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0).toFixed(2)}.`,
      action: 'Cap risk at 1–1.5% until your next 20 trades prove consistent profitability.',
    });
  }

  if (lowFocusTrades.length > 0) {
    insights.push({
      title: 'Mental focus leak',
      description: `${lowFocusTrades.length} trades were taken with mental focus below 10.`,
      severity: 'warning',
      evidence: `Low-focus win rate: ${pct(winningTrades(lowFocusTrades).length, lowFocusTrades.length)}%.`,
      action: 'Create a hard rule: if mental focus is under 10, no trade is allowed.',
    });
  }

  if (psychologyTrades.length === 0 && closed.length > 0) {
    insights.push({
      title: 'Psychology data missing',
      description: 'Issue #4 is now wired, but your existing trades still need psychology reviews before deeper AI patterns appear.',
      severity: 'info',
      evidence: `${closed.length} closed trades, 0 psychology-reviewed trades.`,
      action: 'Open Psychology Journal and add reviews to your last 10 closed trades.',
    });
  }

  if (revengeTrades.length || chasingTrades.length || overconfidentTrades.length) {
    insights.push({
      title: 'Emotional execution detected',
      description: 'The mentor found psychology flags that can damage consistency.',
      severity: 'danger',
      evidence: `${revengeTrades.length} revenge trades, ${chasingTrades.length} chasing trades, ${overconfidentTrades.length} overconfidence trades.`,
      action: 'Use a mandatory cooldown after losses and require a written checklist before re-entry.',
    });
  }

  const strengths = [
    sessionBest ? `${sessionBest.key} session shows the strongest current edge.` : 'You are building enough trade history to detect session strengths.',
    strategyBest ? `${strategyBest.key} is your current best strategy profile.` : 'Strategy performance will become clearer as more trades close.',
    profitFactor >= 1 ? `Profit factor is ${profitFactor === 999 ? 'very strong' : profitFactor.toFixed(2)}.` : 'Risk analytics are now visible and ready for improvement.',
  ];

  const weaknesses = [
    sessionWorst && sessionWorst.count >= 2 ? `${sessionWorst.key} session needs tighter filters.` : 'Session weakness requires more sample size.',
    strategyWorst && strategyWorst.count >= 2 ? `${strategyWorst.key} should be reviewed before taking more trades.` : 'Strategy weakness requires more sample size.',
    psychologyTrades.length < Math.min(10, closed.length) ? 'Psychology reviews are not yet complete enough for full behavior modeling.' : 'Psychology sample size is improving.',
  ];

  const nextActions = [
    'Add psychology reviews to the last 10 closed trades.',
    sessionWorst ? `Apply stricter rules in ${sessionWorst.key} until results improve.` : 'Keep tagging every trade with session, strategy, and score.',
    strategyBest ? `Create a written checklist for ${strategyBest.key}.` : 'Collect more closed trades before changing the strategy plan.',
    'Review the Trade Replay page for every loss larger than your average loss.',
  ];

  const confidence = Math.min(95, Math.max(25, closed.length * 5 + psychologyTrades.length * 3));

  return {
    summary: closed.length
      ? `Mentor reviewed ${closed.length} closed trades and detected ${insights.length} actionable patterns. Confidence is ${confidence}% based on available trade and psychology data.`
      : 'Mentor is ready, but it needs closed trades before it can provide reliable guidance.',
    confidence,
    insights,
    strengths,
    weaknesses,
    nextActions,
    bestSetup: strategyBest && sessionBest ? `${strategyBest.key} during ${sessionBest.key}` : undefined,
    worstPattern: strategyWorst && sessionWorst ? `${strategyWorst.key} during ${sessionWorst.key}` : undefined,
  };
}

export function analyzeTradeWithMentor(trade: Trade, historicalTrades: Trade[]): AIAnalysis {
  const report = generateMentorReport(historicalTrades);
  const riskWarnings: string[] = [];

  if (trade.risk > 2) riskWarnings.push('Risk is above 2%. Reduce size before entering.');
  if (trade.mentalFocus < 10) riskWarnings.push('Mental focus is below 10. Do not trade in this state.');
  if (trade.psychologicalMetrics?.wasRevengeTrading) riskWarnings.push('Revenge-trading flag detected. Stop and reset.');
  if (trade.psychologicalMetrics?.wasChasing) riskWarnings.push('Chasing flag detected. Wait for price to come to your level.');

  return {
    mentorSummary: `${trade.pair} ${trade.session} ${trade.strategy}: score ${trade.score}/100. ${trade.decision === 'TAKE' ? 'Eligible only if risk and psychology are clean.' : 'Not a confirmed A+ setup yet.'}`,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    suggestedImprovements: report.nextActions,
    riskWarnings,
    naturalLanguageFindings: report.insights.map((insight) => `${insight.title}: ${insight.action}`),
    confidence: report.confidence,
    lastAnalyzedAt: new Date().toISOString(),
  };
}

export function answerTradingQuestion(question: string, trades: Trade[]): string {
  const q = question.toLowerCase();
  const closed = closedTrades(trades);
  const report = generateMentorReport(trades);

  if (q.includes('best') && q.includes('session')) {
    const best = findBestGroup(groupBy(closed, (trade) => trade.session));
    return best ? `Your best session is ${best.key}: ${best.winRate}% win rate over ${best.count} trades with $${best.pnl.toFixed(2)} P&L.` : 'I need more closed trades to identify your best session.';
  }

  if (q.includes('worst') && q.includes('session')) {
    const worst = findWorstGroup(groupBy(closed, (trade) => trade.session));
    return worst ? `Your weakest session is ${worst.key}: ${worst.winRate}% win rate over ${worst.count} trades with $${worst.pnl.toFixed(2)} P&L.` : 'I need more closed trades to identify your weakest session.';
  }

  if (q.includes('strategy')) {
    const best = findBestGroup(groupBy(closed, (trade) => trade.strategy));
    return best ? `Your strongest strategy is ${best.key}: ${best.winRate}% win rate over ${best.count} trades. Keep using strict rules around that setup.` : 'I need more closed trades to compare strategies.';
  }

  if (q.includes('risk')) {
    const highRisk = closed.filter((trade) => trade.risk > 2);
    return highRisk.length ? `You have ${highRisk.length} high-risk trades above 2%. Reduce risk to 1–1.5% until consistency improves.` : 'Your risk profile looks controlled; I do not see closed trades above 2% risk.';
  }

  if (q.includes('psychology') || q.includes('emotion') || q.includes('revenge')) {
    const reviewed = closed.filter((trade) => trade.psychologicalMetrics).length;
    return reviewed ? `I found psychology data on ${reviewed} trades. Main recommendation: ${report.nextActions[0]}` : 'No psychology-reviewed trades yet. Add entries in Psychology Journal so I can detect emotional patterns.';
  }

  return report.summary;
}
