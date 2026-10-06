import type { AIAnalysis, Trade } from '../data/types';
import { SERVER_BASE } from '../data/AuthContext';

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

export interface MentorAnswer {
  answer: string;
  source: 'ai' | 'local-fallback';
  error?: string;
}

export interface TradingPattern {
  title: string;
  explanation: string;
  evidence: string;
  confidence: number;
  recommendation: string;
}

export interface PersonalTradingProfile {
  totalTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  totalPnl: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  bestSession: string | null;
  worstSession: string | null;
  bestStrategy: string | null;
  worstStrategy: string | null;
  bestSymbol: string | null;
  worstSymbol: string | null;
  performanceBySession: Array<{ key: string; trades: number; winRate: number; pnl: number }>;
  performanceByStrategy: Array<{ key: string; trades: number; winRate: number; pnl: number }>;
  performanceBySymbol: Array<{ key: string; trades: number; winRate: number; pnl: number }>;
  performanceByDayOfWeek: Array<{ key: string; trades: number; winRate: number; pnl: number }>;
  riskViolations: number;
  lowFocusTrades: number;
  revengeTrades: number;
  chasingTrades: number;
  overconfidentTrades: number;
  repeatedMistakes: string[];
  winningPatterns: TradingPattern[];
  losingPatterns: TradingPattern[];
  recentTrades: Array<any>;
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
    if (!key) return groups;
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayOfWeek(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return DAY_NAMES[d.getUTCDay()];
    }
  } catch {}
  return 'Unknown';
}

function summarizeGroup<T extends string>(trades: Trade[], getter: (trade: Trade) => T) {
  return Object.entries(groupBy(trades, getter)).map(([key, items]) => {
    const groupTrades = items as Trade[];
    return {
      key,
      trades: groupTrades.length,
      winRate: pct(winningTrades(groupTrades).length, groupTrades.length),
      pnl: Number(groupTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0).toFixed(2)),
      averageRisk: Number(avg(groupTrades.map((trade) => trade.risk || 0)).toFixed(2)),
      averageScore: Math.round(avg(groupTrades.map((trade) => trade.score || 0))),
    };
  });
}

/**
 * Builds a structured personal trading profile and evidence sets from the user's journal
 */
export function buildPersonalTradingProfile(trades: Trade[]): PersonalTradingProfile {
  const closed = closedTrades(trades);
  const wins = winningTrades(closed);
  const losses = losingTrades(closed);
  const breakEven = closed.filter((t) => t.result === 'BE');
  const totalPnl = Number(closed.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2));
  const winRate = pct(wins.length, closed.length);
  const averageWin = Number(avg(wins.map((t) => t.pnl || 0)).toFixed(2));
  const averageLoss = Number(Math.abs(avg(losses.map((t) => t.pnl || 0))).toFixed(2));
  const grossLossTotal = Math.abs(losses.reduce((sum, t) => sum + Math.min(0, t.pnl || 0), 0));
  const grossWinTotal = wins.reduce((sum, t) => sum + Math.max(0, t.pnl || 0), 0);
  const profitFactor = grossLossTotal > 0 ? Number((grossWinTotal / grossLossTotal).toFixed(2)) : wins.length > 0 ? 999 : 0;

  const sessionGroups = groupBy(closed, (t) => t.session);
  const strategyGroups = groupBy(closed, (t) => t.strategy);
  const symbolGroups = groupBy(closed, (t) => t.pair || t.symbol || 'OTHER');
  const dayGroups = groupBy(closed, (t) => getDayOfWeek(t.date));

  const bestSessionObj = findBestGroup(sessionGroups);
  const worstSessionObj = findWorstGroup(sessionGroups);
  const bestStrategyObj = findBestGroup(strategyGroups);
  const worstStrategyObj = findWorstGroup(strategyGroups);
  const bestSymbolObj = findBestGroup(symbolGroups);
  const worstSymbolObj = findWorstGroup(symbolGroups);

  const performanceBySession = summarizeGroup(closed, (t) => t.session);
  const performanceByStrategy = summarizeGroup(closed, (t) => t.strategy);
  const performanceBySymbol = summarizeGroup(closed, (t) => t.pair || t.symbol || 'OTHER');
  const performanceByDayOfWeek = summarizeGroup(closed, (t) => getDayOfWeek(t.date));

  const riskViolations = closed.filter((t) => (t.risk || 0) > 2).length;
  const lowFocusTrades = closed.filter((t) => (t.mentalFocus || 0) < 15).length;
  const revengeTrades = closed.filter((t) => t.psychologicalMetrics?.wasRevengeTrading).length;
  const chasingTrades = closed.filter((t) => t.psychologicalMetrics?.wasChasing).length;
  const overconfidentTrades = closed.filter((t) => t.psychologicalMetrics?.wasOverconfident).length;

  const repeatedMistakes: string[] = [];
  if (riskViolations >= 2) repeatedMistakes.push(`${riskViolations} trades risked over 2% of capital.`);
  if (lowFocusTrades >= 2) repeatedMistakes.push(`${lowFocusTrades} trades executed with low mental clarity (focus < 15).`);
  if (revengeTrades >= 1) repeatedMistakes.push(`${revengeTrades} revenge trading instances recorded after losses.`);
  if (chasingTrades >= 1) repeatedMistakes.push(`${chasingTrades} setups flagged for chasing price after missing entries.`);
  if (worstSessionObj && worstSessionObj.count >= 3 && worstSessionObj.winRate <= 35) {
    repeatedMistakes.push(`Consistently leaking P&L in ${worstSessionObj.key} (${worstSessionObj.winRate}% win rate).`);
  }

  // Winning patterns
  const winningPatterns: TradingPattern[] = [];
  if (bestStrategyObj && bestStrategyObj.count >= 2) {
    winningPatterns.push({
      title: `${bestStrategyObj.key} Playbook Edge`,
      explanation: `Your highest returning setup structure is ${bestStrategyObj.key}.`,
      evidence: `${bestStrategyObj.count} trades, ${bestStrategyObj.winRate}% win rate, $${bestStrategyObj.pnl.toFixed(2)} net P&L.`,
      confidence: Math.min(95, bestStrategyObj.count * 15),
      recommendation: `Require this setup archetype before allocating capital. Document its entry checklist.`,
    });
  }

  const winAvgConf = avg(wins.map((t) => t.confluences || 0));
  const lossAvgConf = avg(losses.map((t) => t.confluences || 0));
  if (wins.length >= 2 && winAvgConf > lossAvgConf + 0.5) {
    winningPatterns.push({
      title: 'High Confluence Alignment',
      explanation: 'Winning trades correlate with patience and multiple confluence points.',
      evidence: `Winning trades average ${winAvgConf.toFixed(1)} confluences vs ${lossAvgConf.toFixed(1)} on losing trades.`,
      confidence: 85,
      recommendation: 'Do not enter any position without at least 3 verified confluences.',
    });
  }

  if (bestSessionObj && bestSessionObj.count >= 2) {
    winningPatterns.push({
      title: `${bestSessionObj.key} Session Dominance`,
      explanation: `Execution clarity is highest during ${bestSessionObj.key}.`,
      evidence: `${bestSessionObj.count} trades, ${bestSessionObj.winRate}% win rate, $${bestSessionObj.pnl.toFixed(2)} total profit.`,
      confidence: Math.min(90, bestSessionObj.count * 15),
      recommendation: `Focus your daily trading routine around the ${bestSessionObj.key} market open.`,
    });
  }

  // Losing patterns
  const losingPatterns: TradingPattern[] = [];
  if (worstSessionObj && worstSessionObj.count >= 2 && worstSessionObj.winRate < 45) {
    losingPatterns.push({
      title: `${worstSessionObj.key} Session Drain`,
      explanation: `Losses are heavily concentrated during ${worstSessionObj.key}.`,
      evidence: `${worstSessionObj.count} trades, ${worstSessionObj.winRate}% win rate, $${worstSessionObj.pnl.toFixed(2)} total P&L.`,
      confidence: Math.min(90, worstSessionObj.count * 18),
      recommendation: `Avoid ${worstSessionObj.key} for your next 10 trades or cut position size by half.`,
    });
  }

  if (riskViolations > 0) {
    losingPatterns.push({
      title: 'Position Sizing Overshoot',
      explanation: 'Trades exceeding 2% risk create outsized drawdown swings.',
      evidence: `${riskViolations} trades risked over 2% of capital.`,
      confidence: 90,
      recommendation: 'Cap risk strictly at 1.0% per trade regardless of setup excitement.',
    });
  }

  if (revengeTrades > 0 || chasingTrades > 0) {
    losingPatterns.push({
      title: 'Emotional Reactivity',
      explanation: 'Entering trades quickly after a loss or chasing breakouts leads to poor entries.',
      evidence: `${revengeTrades} revenge flags and ${chasingTrades} chasing flags logged.`,
      confidence: 92,
      recommendation: 'Enforce a mandatory 30-minute terminal cooldown following any closed loss.',
    });
  }

  // Sanitize and limit recent trades to 30, truncating text and stripping screenshot base64
  const recentTrades = closed.slice(0, 30).map((t) => ({
    id: t.id,
    date: t.date,
    pair: (t.pair || t.symbol || 'XAUUSD').replace('/', '').toUpperCase(),
    session: t.session,
    strategy: t.strategy,
    orderType: t.orderType,
    score: t.score,
    decision: t.decision,
    risk: t.risk,
    rrRatio: t.rrRatio,
    confluences: t.confluences,
    mentalFocus: t.mentalFocus,
    result: t.result,
    pnl: t.pnl,
    notes: t.notes ? t.notes.slice(0, 150) : undefined,
    psychology: t.psychologicalMetrics ? {
      preTradeEmotionalState: t.psychologicalMetrics.preTradeEmotionalState?.slice(0, 60),
      postTradeEmotionalState: t.psychologicalMetrics.postTradeEmotionalState?.slice(0, 60),
      wasRevengeTrading: t.psychologicalMetrics.wasRevengeTrading,
      wasChasing: t.psychologicalMetrics.wasChasing,
      wasOverconfident: t.psychologicalMetrics.wasOverconfident,
      lessonsLearned: t.psychologicalMetrics.lessonsLearned?.slice(0, 150),
    } : null,
  }));

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakEven: breakEven.length,
    winRate,
    totalPnl,
    averageWin,
    averageLoss,
    profitFactor,
    bestSession: bestSessionObj?.key || null,
    worstSession: worstSessionObj?.key || null,
    bestStrategy: bestStrategyObj?.key || null,
    worstStrategy: worstStrategyObj?.key || null,
    bestSymbol: bestSymbolObj?.key || null,
    worstSymbol: worstSymbolObj?.key || null,
    performanceBySession,
    performanceByStrategy,
    performanceBySymbol,
    performanceByDayOfWeek,
    riskViolations,
    lowFocusTrades,
    revengeTrades,
    chasingTrades,
    overconfidentTrades,
    repeatedMistakes,
    winningPatterns,
    losingPatterns,
    recentTrades,
  };
}

export function generateMentorReport(trades: Trade[]): MentorReport {
  const profile = buildPersonalTradingProfile(trades);
  const closed = closedTrades(trades);
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
      description: `Your current closed-trade win rate is ${profile.winRate}% with total P&L of $${profile.totalPnl.toFixed(2)}.`,
      severity: profile.totalPnl >= 0 ? 'success' : 'warning',
      evidence: `${profile.closedTrades} closed trades, ${profile.wins} wins, ${profile.losses} losses, profit factor ${profile.profitFactor === 999 ? 'infinite' : profile.profitFactor.toFixed(2)}.`,
      action: profile.winRate >= 50 ? 'Protect this edge by only taking trades that match your best setup profile.' : 'Reduce trade frequency and require stronger confluence before taking new setups.',
    });
  }

  profile.winningPatterns.forEach((p) => {
    insights.push({
      title: p.title,
      description: p.explanation,
      severity: 'success',
      evidence: p.evidence,
      action: p.recommendation,
    });
  });

  profile.losingPatterns.forEach((p) => {
    insights.push({
      title: p.title,
      description: p.explanation,
      severity: p.title.includes('Sizing') || p.title.includes('Emotional') ? 'danger' : 'warning',
      evidence: p.evidence,
      action: p.recommendation,
    });
  });

  const strengths = [
    profile.bestSession ? `${profile.bestSession} session shows your clearest market edge.` : 'Building initial session baseline.',
    profile.bestStrategy ? `${profile.bestStrategy} is currently your highest-performing strategy.` : 'Building strategy sample size.',
    profile.profitFactor >= 1 ? `Profit factor is ${profile.profitFactor === 999 ? 'infinite' : profile.profitFactor.toFixed(2)}.` : 'Risk discipline is active and improving.',
  ];

  const weaknesses = [
    profile.worstSession ? `${profile.worstSession} session requires stricter execution filters.` : 'Session leak requires larger sample.',
    profile.riskViolations > 0 ? `${profile.riskViolations} trades risked over 2%.` : 'Position sizing discipline intact.',
    profile.revengeTrades > 0 ? `${profile.revengeTrades} emotional trades flagged.` : 'Emotional execution controlled.',
  ];

  const nextActions = [
    profile.worstSession ? `For your next 10 trades, avoid ${profile.worstSession} or trade half risk.` : 'Maintain strict risk management on every entry.',
    profile.bestStrategy ? `Require at least 3 confluences for ${profile.bestStrategy}.` : 'Wait for confirmed confluences before entry.',
    'Follow a mandatory cooldown period following any loss.',
  ];

  const confidence = Math.min(95, Math.max(25, closed.length * 5));

  return {
    summary: closed.length
      ? `Hustle Mentor analyzed ${closed.length} closed trades. Found ${insights.length} actionable patterns with ${confidence}% confidence based on recorded data.`
      : 'Hustle Mentor is ready. Log your first trades to unlock personalized pattern analysis.',
    confidence,
    insights,
    strengths,
    weaknesses,
    nextActions,
    bestSetup: profile.bestStrategy && profile.bestSession ? `${profile.bestStrategy} during ${profile.bestSession}` : undefined,
    worstPattern: profile.worstStrategy && profile.worstSession ? `${profile.worstStrategy} during ${profile.worstSession}` : undefined,
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

/**
 * Journal-aware rule-based offline fallback engine.
 * Never invents prices or news, handles low-sample states honestly, and always ends with one practical action.
 */
function answerTradingQuestionLocally(question: string, trades: Trade[]): string {
  const q = question.toLowerCase();
  const profile = buildPersonalTradingProfile(trades);
  const closedCount = profile.closedTrades;

  // Empty state
  if (closedCount === 0) {
    return `I’m ready to become your trading mentor.\n\nLog your first trade and I’ll start learning your sessions, setups, risk habits, and repeated mistakes.`;
  }

  const sampleCaveat = closedCount < 10
    ? `\n\n*Early signal — only ${closedCount} trade${closedCount === 1 ? '' : 's'} available. Treat this as a preliminary signal, not a final conclusion.*`
    : '';

  // 1. "Why am I losing?" / Loss analysis
  if (q.includes('why') && (q.includes('losing') || q.includes('loss') || q.includes('fail') || q.includes('leak'))) {
    if (profile.losses === 0) {
      return `Your journal does not currently have any recorded losing trades across ${closedCount} closed entries. Focus on preserving this discipline with controlled 1% risk.`;
    }

    const worstSessionText = profile.worstSession
      ? `• **Session Leak**: Losses are highest in **${profile.worstSession}** (${profile.performanceBySession.find((s) => s.key === profile.worstSession)?.winRate}% win rate).`
      : '';
    const riskLeak = profile.riskViolations > 0
      ? `• **Risk Violations**: ${profile.riskViolations} trades risked over 2% of capital, magnifying drawdown.`
      : '';
    const emotionalLeak = (profile.revengeTrades > 0 || profile.chasingTrades > 0 || profile.lowFocusTrades > 0)
      ? `• **Psychology Leaks**: ${profile.revengeTrades} revenge flags, ${profile.chasingTrades} chasing flags, and ${profile.lowFocusTrades} low-focus executions.`
      : '';

    const worstStrat = profile.worstStrategy
      ? `• **Underperforming Setup**: **${profile.worstStrategy}** currently has your lowest hit rate.`
      : '';

    return `Here is what your journal shows about your losing trades:\n\n` +
      `Your current win rate is **${profile.winRate}%** (${profile.wins}W / ${profile.losses}L) with an average loss of **$${profile.averageLoss.toFixed(2)}**.\n\n` +
      `**Key Factors Behind Losses:**\n` +
      `${worstSessionText}\n` +
      `${worstStrat}\n` +
      `${riskLeak}\n` +
      `${emotionalLeak}\n\n` +
      `**Action:**\n` +
      `For your next 10 trades, do not take entries unless you have at least 3 confluences, and skip ${profile.worstSession || 'unclear sessions'}.` +
      sampleCaveat;
  }

  // 2. "Where's my edge?" / Edge & strengths
  if (q.includes('edge') || q.includes('strength') || (q.includes('best') && !q.includes('session') && !q.includes('strategy') && !q.includes('symbol'))) {
    const bestStrat = profile.bestStrategy || 'Order Block';
    const bestSess = profile.bestSession || 'New York';
    const bestSym = profile.bestSymbol || 'XAUUSD';

    return `Your edge is currently concentrated in the following parameters:\n\n` +
      `• **Top Strategy**: **${bestStrat}** with positive expectancy.\n` +
      `• **Top Session**: **${bestSess}** session.\n` +
      `• **Top Instrument**: **${bestSym}**.\n` +
      `• **Payoff Ratio**: Average win is **$${profile.averageWin.toFixed(2)}** vs average loss of **$${profile.averageLoss.toFixed(2)}**.\n\n` +
      `**Recommendation:**\n` +
      `Focus purely on high-grade ${bestStrat} setups in ${bestSess}. Do not dilute your edge by overtrading other sessions.` +
      sampleCaveat;
  }

  // 3. "Am I following my plan?" / Discipline check
  if (q.includes('plan') || q.includes('disciplin') || q.includes('rule')) {
    const disciplineScore = Math.max(0, 100 - (profile.riskViolations * 15 + profile.revengeTrades * 15 + profile.chasingTrades * 10));
    return `**Plan Adherence Analysis:**\n\n` +
      `• **Risk Discipline**: ${profile.riskViolations === 0 ? 'Clean (100% of trades kept within risk parameters)' : `${profile.riskViolations} trades broke the 2% maximum risk limit`}.\n` +
      `• **Emotional Discipline**: ${profile.revengeTrades === 0 && profile.chasingTrades === 0 ? 'No emotional revenge or chasing flags logged' : `${profile.revengeTrades} revenge entries and ${profile.chasingTrades} chasing entries`}.\n` +
      `• **Execution Score**: Estimated rule execution index is **${disciplineScore}/100**.\n\n` +
      `**Action:**\n` +
      `Review your trade checklist before clicking execute on your next setup.` +
      sampleCaveat;
  }

  // 4. "How do I get better?" / Improvement protocol
  if (q.includes('better') || q.includes('improv') || q.includes('grow')) {
    return `**Three Steps to Increase Profitability:**\n\n` +
      `1. **Eliminate Your Primary Leak**: ${profile.worstSession ? `Stop trading ${profile.worstSession} session.` : 'Keep risk fixed at 1% per position.'}\n` +
      `2. **Double Down on Your Edge**: Execute only ${profile.bestStrategy || 'your highest-scored'} setups.\n` +
      `3. **Review Mistakes in Trade Replay**: Tag before/after screenshots on every loss.\n\n` +
      `**Action:**\n` +
      `Reduce sizing by 50% on your next 5 trades to focus purely on flawless process over profit.` +
      sampleCaveat;
  }

  // 5. Setups with highest win rate
  if (q.includes('setup') || (q.includes('highest') && q.includes('win rate')) || (q.includes('win rate') && q.includes('strategy'))) {
    const sortedStrats = [...profile.performanceByStrategy].sort((a, b) => b.winRate - a.winRate);
    const list = sortedStrats.map((s) => `• **${s.key}**: ${s.winRate}% WR (${s.trades} trades, $${s.pnl} P&L)`).join('\n');
    return `**Strategy Win Rate Comparison:**\n\n` +
      `${list || 'No strategy data logged yet.'}\n\n` +
      `**Action:**\n` +
      `Prioritize ${sortedStrats[0]?.key || 'high-confluence setups'} for your upcoming watchlist.` +
      sampleCaveat;
  }

  // 6. Most profitable symbol
  if (q.includes('symbol') || q.includes('pair') || q.includes('profitable')) {
    const sortedSymbols = [...profile.performanceBySymbol].sort((a, b) => b.pnl - a.pnl);
    const list = sortedSymbols.map((s) => `• **${s.key}**: $${s.pnl} P&L (${s.trades} trades, ${s.winRate}% WR)`).join('\n');
    return `**Symbol Performance Breakdown:**\n\n` +
      `${list || 'No symbol data logged yet.'}\n\n` +
      `**Action:**\n` +
      `Trade ${sortedSymbols[0]?.key || 'your top symbol'} during its primary volatility session.` +
      sampleCaveat;
  }

  // 7. When do I trade best? / Sessions & Days
  if (q.includes('when') || (q.includes('trade') && q.includes('best')) || q.includes('session')) {
    const sortedSessions = [...profile.performanceBySession].sort((a, b) => b.winRate - a.winRate);
    const list = sortedSessions.map((s) => `• **${s.key}**: ${s.winRate}% WR ($${s.pnl} P&L, ${s.trades} trades)`).join('\n');
    return `**Session Timing Performance:**\n\n` +
      `${list || 'No session data logged yet.'}\n\n` +
      `**Action:**\n` +
      `Set an alarm for the ${sortedSessions[0]?.key || 'New York'} session open and avoid trading outside active liquidity windows.` +
      sampleCaveat;
  }

  // 8. Days to avoid
  if (q.includes('avoid') || q.includes('days') || q.includes('day of week')) {
    const sortedDays = [...profile.performanceByDayOfWeek].sort((a, b) => a.pnl - b.pnl);
    const worstDay = sortedDays[0];
    return `**Day of Week Analysis:**\n\n` +
      sortedDays.map((d) => `• **${d.key}**: $${d.pnl} P&L (${d.winRate}% WR, ${d.trades} trades)`).join('\n') +
      `\n\n**Action:**\n` +
      `If trading on ${worstDay?.key || 'lower-volume days'}, halve your normal risk allowance.` +
      sampleCaveat;
  }

  // 9. Gold / XAUUSD & Macro news handling
  if (q.includes('xau') || q.includes('gold') || q.includes('cpi') || q.includes('fomc') || q.includes('nfp') || q.includes('news') || q.includes('fundamental')) {
    const goldTrades = closedTrades(trades).filter((t) => (t.pair || t.symbol || '').toUpperCase().includes('XAU'));
    const goldWins = winningTrades(goldTrades).length;
    const goldPnl = goldTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const goldSummary = goldTrades.length > 0
      ? `Your journal records **${goldTrades.length} closed XAUUSD trades** with a **${pct(goldWins, goldTrades.length)}% win rate** and **$${goldPnl.toFixed(2)} net P&L**.`
      : `Your journal currently has no closed trades specifically tagged as XAUUSD / Gold.`;

    return `**XAUUSD & News Execution Analysis:**\n\n` +
      `${goldSummary}\n\n` +
      `*Note: I can analyze how your journal performed around data you recorded, but current fundamental news and live macroeconomic data require a connected live news feed. I do not speculate on unverified future price direction.*\n\n` +
      `**Action:**\n` +
      `Never enter market orders in the first 5 minutes of high-impact news (CPI/NFP). Wait for post-news 15-minute market structure shift.` +
      sampleCaveat;
  }

  // General default fallback
  return `**Hustle Mentor Journal Review:**\n\n` +
    `Across **${closedCount} closed trades**, you hold a **${profile.winRate}% win rate** with **$${profile.totalPnl.toFixed(2)} net P&L**.\n\n` +
    `• **Edge**: ${profile.bestStrategy || 'High confluence setups'} during ${profile.bestSession || 'New York'}.\n` +
    `• **Caution**: ${profile.worstSession ? `Avoid ${profile.worstSession} session leakage.` : 'Keep risk strictly at 1%.'}\n\n` +
    `**Action:**\n` +
    `Score your next setup using the Pre-Trade Quality Scorer before taking risk.` +
    sampleCaveat;
}

function buildMentorPayload(question: string, trades: Trade[]) {
  const profile = buildPersonalTradingProfile(trades);
  const report = generateMentorReport(trades);
  const closed = closedTrades(trades);

  return {
    question,
    personalTradingProfile: profile,
    fallbackAnswer: answerTradingQuestionLocally(question, trades),
    report,
    summary: {
      totalTrades: profile.totalTrades,
      closedTrades: profile.closedTrades,
      wins: profile.wins,
      losses: profile.losses,
      breakEven: profile.breakEven,
      winRate: profile.winRate,
      totalPnl: profile.totalPnl,
      averageWin: profile.averageWin,
      averageLoss: profile.averageLoss,
      profitFactor: profile.profitFactor,
      bestSession: profile.bestSession,
      worstSession: profile.worstSession,
      bestStrategy: profile.bestStrategy,
      worstStrategy: profile.worstStrategy,
      bestSymbol: profile.bestSymbol,
      worstSymbol: profile.worstSymbol,
      repeatedMistakes: profile.repeatedMistakes,
    },
    performance: {
      bySession: profile.performanceBySession,
      byStrategy: profile.performanceByStrategy,
      bySymbol: profile.performanceBySymbol,
      byDayOfWeek: profile.performanceByDayOfWeek,
    },
    recentClosedTrades: profile.recentTrades,
  };
}

export async function answerTradingQuestion(question: string, trades: Trade[]): Promise<MentorAnswer> {
  const payload = buildMentorPayload(question, trades);

  try {
    const response = await fetch(`${SERVER_BASE}/ai-mentor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Mentor request failed with status ${response.status}`);
    }

    return {
      answer: data.answer || payload.fallbackAnswer,
      source: data.source === 'groq' ? 'ai' : 'local-fallback',
      error: data.error,
    };
  } catch (error: any) {
    return {
      answer: payload.fallbackAnswer,
      source: 'local-fallback',
      error: error.message?.includes('fetch') ? 'Offline mode active.' : error.message,
    };
  }
}
