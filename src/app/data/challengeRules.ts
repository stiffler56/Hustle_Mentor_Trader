import type { Trade, ChallengeData } from './types';

// ── Single source of truth for every challenge rule ─────────────────────────
export const CHALLENGE_RULE_CONFIG = {
  symbol: 'XAUUSD',
  session: 'New York',
  maxRisk: 1,
  minScore: 75,
  minConfluences: 3,
  minMentalFocus: 15,
  psychologyReviewRequired: true,
} as const;

// ── Types ───────────────────────────────────────────────────────────────────
export interface ChallengeRuleResult {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  hasData: boolean;
  violations: number;
  applicableCount: number;
  affectedTradeIds: string[];
}

export interface DisciplineBreakdown {
  total: number;
  hasData: boolean;
  ruleCompliance: number | null;
  riskDiscipline: number | null;
  setupQuality: number | null;
  psychologyDiscipline: number | null;
  journalCompletion: number | null;
}

export type DayStatus =
  | 'future'
  | 'rest'
  | 'win'
  | 'loss'
  | 'be'
  | 'pass'
  | 'violation'
  | 'today';

export interface ChallengeDayInfo {
  dayNum: number;
  date: string | null;
  status: DayStatus;
  session: string | null;
  tradeCount: number;
  pnl: number;
  violations: number;
  reviewsPending: number;
  trades: Trade[];
}

export interface ChallengeMilestone {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  progress: number;
  target: number;
}

export interface ChallengeActivity {
  id: string;
  dayNum: number;
  date: string;
  text: string;
  tone: 'neutral' | 'positive' | 'negative' | 'info';
}

export interface CoachingCard {
  id: string;
  tone: 'warning' | 'positive';
  title: string;
  message: string;
  recommendation: string;
}

export type MissionStatus = 'not-started' | 'in-progress' | 'completed' | 'needs-attention';

export interface ChallengeSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  totalPnL: number;
  avgScore: number;
  avgRisk: number;
  rulesFollowed: number;
  rulesBroken: number;
  reviewsCompleted: number;
  reviewsPending: number;
  winStreak: number;
  compliantDays: number;
  bestSession: string | null;
  bestStrategy: string | null;
  commonViolation: string | null;
}

// ── Date helpers (timezone safe: pure YYYY-MM-DD arithmetic) ────────────────
export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = parseDateStr(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

export function diffDays(fromDate: string, toDate: string): number {
  return Math.round((parseDateStr(toDate).getTime() - parseDateStr(fromDate).getTime()) / 86400000);
}

// ── Rule descriptors ────────────────────────────────────────────────────────
interface RuleDescriptor {
  id: string;
  label: string;
  description: string;
  advice: string;
  isApplicable: (t: Trade) => boolean;
  isCompliant: (t: Trade) => boolean;
}

const hasNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function normalizeTradeSymbol(trade: Trade): string {
  const raw = trade.pair || trade.symbol || '';
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const RULE_DESCRIPTORS: RuleDescriptor[] = [
  {
    id: 'score',
    label: 'Setup score',
    description: `Score ≥ ${CHALLENGE_RULE_CONFIG.minScore}`,
    advice: 'Score every setup before entry. Only TAKE decisions at 75+ belong in the challenge.',
    isApplicable: t => hasNumber(t.score),
    isCompliant: t => t.score >= CHALLENGE_RULE_CONFIG.minScore,
  },
  {
    id: 'risk',
    label: 'Risk limit',
    description: `Risk ≤ ${CHALLENGE_RULE_CONFIG.maxRisk}% per trade`,
    advice: 'Reduce position size before taking another challenge trade.',
    isApplicable: t => hasNumber(t.risk),
    isCompliant: t => t.risk <= CHALLENGE_RULE_CONFIG.maxRisk,
  },
  {
    id: 'confluences',
    label: 'Confluences',
    description: `At least ${CHALLENGE_RULE_CONFIG.minConfluences} confluences`,
    advice: 'Wait for full confluence before entry. No discretionary entries.',
    isApplicable: t => hasNumber(t.confluences),
    isCompliant: t => t.confluences >= CHALLENGE_RULE_CONFIG.minConfluences,
  },
  {
    id: 'symbol',
    label: 'Allowed symbol',
    description: `Only ${CHALLENGE_RULE_CONFIG.symbol} trades count`,
    advice: `Stay on ${CHALLENGE_RULE_CONFIG.symbol}. Off-symbol trades do not count toward the challenge.`,
    isApplicable: t => Boolean((t.pair || t.symbol || '').trim()),
    isCompliant: t => normalizeTradeSymbol(t) === CHALLENGE_RULE_CONFIG.symbol,
  },
  {
    id: 'session',
    label: 'Allowed session',
    description: `Only ${CHALLENGE_RULE_CONFIG.session} session`,
    advice: `Trade only during the ${CHALLENGE_RULE_CONFIG.session} session.`,
    isApplicable: t => Boolean(t.session),
    isCompliant: t => t.session === CHALLENGE_RULE_CONFIG.session,
  },
  {
    id: 'focus',
    label: 'Mental focus',
    description: `Mental focus ≥ ${CHALLENGE_RULE_CONFIG.minMentalFocus}`,
    advice: 'If focus is below the minimum, skip trading until you reset.',
    isApplicable: t => hasNumber(t.mentalFocus),
    isCompliant: t => t.mentalFocus >= CHALLENGE_RULE_CONFIG.minMentalFocus,
  },
  {
    id: 'review',
    label: 'Post-trade review',
    description: 'Journal review required for closed trades',
    advice: 'Complete your post-trade review in the journal before the next session.',
    isApplicable: t => t.status === 'CLOSED' && Boolean(t.result),
    isCompliant: t => Boolean(t.psychologicalMetrics),
  },
];

export function getRuleAdvice(ruleId: string): string {
  return RULE_DESCRIPTORS.find(d => d.id === ruleId)?.advice ?? 'Follow the challenge rules.';
}

export function getRuleLabel(ruleId: string): string {
  return RULE_DESCRIPTORS.find(d => d.id === ruleId)?.label ?? ruleId;
}

// ── Per-trade evaluation ────────────────────────────────────────────────────
export interface TradeRuleCheck {
  ruleId: string;
  label: string;
  applicable: boolean;
  passed: boolean;
}

export function evaluateTradeRules(trade: Trade): TradeRuleCheck[] {
  return RULE_DESCRIPTORS.map(d => {
    const applicable = d.isApplicable(trade);
    return {
      ruleId: d.id,
      label: d.label,
      applicable,
      passed: !applicable || d.isCompliant(trade),
    };
  });
}

export function getTradeViolations(trade: Trade): { id: string; label: string }[] {
  return RULE_DESCRIPTORS
    .filter(d => d.isApplicable(trade) && !d.isCompliant(trade))
    .map(d => ({ id: d.id, label: d.label }));
}

// ── Challenge-wide rule compliance ──────────────────────────────────────────
export function evaluateChallengeRules(trades: Trade[]): ChallengeRuleResult[] {
  return RULE_DESCRIPTORS.map(d => {
    const applicable = trades.filter(d.isApplicable);
    const violating = applicable.filter(t => !d.isCompliant(t));
    return {
      id: d.id,
      label: d.label,
      description: d.description,
      hasData: applicable.length > 0,
      passed: applicable.length > 0 && violating.length === 0,
      violations: violating.length,
      applicableCount: applicable.length,
      affectedTradeIds: violating.map(t => t.id),
    };
  });
}

// ── Discipline score breakdown ──────────────────────────────────────────────
const DISCIPLINE_WEIGHTS = {
  ruleCompliance: 0.3,
  riskDiscipline: 0.25,
  setupQuality: 0.2,
  psychologyDiscipline: 0.15,
  journalCompletion: 0.1,
} as const;

function percentage(pass: number, total: number): number | null {
  return total > 0 ? Math.round((pass / total) * 100) : null;
}

export function calculateDisciplineBreakdown(
  trades: Trade[],
  rules: ChallengeRuleResult[]
): DisciplineBreakdown {
  const rulesWithData = rules.filter(r => r.hasData);
  const ruleCompliance = rulesWithData.length
    ? Math.round((rulesWithData.filter(r => r.passed).length / rulesWithData.length) * 100)
    : null;

  const riskTrades = trades.filter(t => hasNumber(t.risk));
  const riskDiscipline = percentage(
    riskTrades.filter(t => t.risk <= CHALLENGE_RULE_CONFIG.maxRisk).length,
    riskTrades.length
  );

  const setupTrades = trades.filter(t => hasNumber(t.score) && hasNumber(t.confluences));
  const setupQuality = percentage(
    setupTrades.filter(
      t => t.score >= CHALLENGE_RULE_CONFIG.minScore && t.confluences >= CHALLENGE_RULE_CONFIG.minConfluences
    ).length,
    setupTrades.length
  );

  const psychTrades = trades.filter(t => hasNumber(t.mentalFocus));
  const psychologyDiscipline = percentage(
    psychTrades.filter(t => {
      if (t.mentalFocus < CHALLENGE_RULE_CONFIG.minMentalFocus) return false;
      if (t.psychologicalMetrics?.wasRevengeTrading) return false;
      if (t.psychologicalMetrics?.wasChasing) return false;
      return true;
    }).length,
    psychTrades.length
  );

  const closed = trades.filter(t => t.status === 'CLOSED' && Boolean(t.result));
  const journalCompletion = percentage(
    closed.filter(t => Boolean(t.psychologicalMetrics)).length,
    closed.length
  );

  const parts = [
    { weight: DISCIPLINE_WEIGHTS.ruleCompliance, value: ruleCompliance },
    { weight: DISCIPLINE_WEIGHTS.riskDiscipline, value: riskDiscipline },
    { weight: DISCIPLINE_WEIGHTS.setupQuality, value: setupQuality },
    { weight: DISCIPLINE_WEIGHTS.psychologyDiscipline, value: psychologyDiscipline },
    { weight: DISCIPLINE_WEIGHTS.journalCompletion, value: journalCompletion },
  ];
  const available = parts.filter(p => p.value !== null);
  const totalWeight = available.reduce((a, p) => a + p.weight, 0);
  const total = available.length
    ? Math.round(available.reduce((a, p) => a + p.weight * (p.value as number), 0) / totalWeight)
    : 0;

  return {
    total,
    hasData: available.length > 0,
    ruleCompliance,
    riskDiscipline,
    setupQuality,
    psychologyDiscipline,
    journalCompletion,
  };
}

export function disciplineInterpretation(b: DisciplineBreakdown): { text: string; color: string } {
  if (!b.hasData) return { text: 'Not enough data', color: '#6b7280' };
  if (b.total >= 85) return { text: 'Excellent consistency', color: '#10b981' };
  if (b.total >= 70) return { text: 'Good progress', color: '#60a5fa' };
  return { text: 'Needs attention', color: '#f59e0b' };
}

// ── Today's mission status ──────────────────────────────────────────────────
export function getMissionStatus(todayTrades: Trade[]): MissionStatus {
  if (todayTrades.length === 0) return 'not-started';
  if (todayTrades.some(t => getTradeViolations(t).length > 0)) return 'needs-attention';
  const closed = todayTrades.filter(t => t.status === 'CLOSED' && Boolean(t.result));
  const openCount = todayTrades.length - closed.length;
  const unreviewed = closed.filter(t => !t.psychologicalMetrics).length;
  if (openCount > 0 || unreviewed > 0) return 'in-progress';
  return 'completed';
}

export function missionStatusLabel(status: MissionStatus): { text: string; color: string } {
  switch (status) {
    case 'completed': return { text: 'Completed', color: '#10b981' };
    case 'in-progress': return { text: 'In progress', color: '#60a5fa' };
    case 'needs-attention': return { text: 'Needs attention', color: '#f87171' };
    default: return { text: 'Not started', color: '#9ca3af' };
  }
}

// ── 30-day calendar model ───────────────────────────────────────────────────
export function buildChallengeDays(
  challenge: ChallengeData,
  challengeTrades: Trade[]
): ChallengeDayInfo[] {
  const today = getTodayString();
  const startDate = challenge.isActive ? challenge.startDate : null;

  return Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const date = startDate ? addDaysToDate(startDate, i) : null;

    const base: ChallengeDayInfo = {
      dayNum,
      date,
      status: 'future',
      session: null,
      tradeCount: 0,
      pnl: 0,
      violations: 0,
      reviewsPending: 0,
      trades: [],
    };
    if (!date) return base;

    const dayTrades = challengeTrades.filter(t => t.date === date);
    const violations = dayTrades.reduce((a, t) => a + getTradeViolations(t).length, 0);
    const closed = dayTrades.filter(t => t.status === 'CLOSED' && Boolean(t.result));
    const pnl = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);
    const reviewsPending = closed.filter(t => !t.psychologicalMetrics).length;
    const session = dayTrades[0]?.session ?? null;

    let status: DayStatus;
    if (date > today) {
      status = 'future';
    } else if (date === today) {
      status = 'today';
    } else if (dayTrades.length === 0) {
      status = 'rest';
    } else if (violations > 0) {
      status = 'violation';
    } else {
      const hasWin = dayTrades.some(t => t.result === 'WIN');
      const hasLoss = dayTrades.some(t => t.result === 'LOSS');
      const allPass = dayTrades.every(t => t.result === undefined);
      if (allPass) status = 'pass';
      else if (hasWin && !hasLoss) status = 'win';
      else if (hasLoss && !hasWin) status = 'loss';
      else status = 'be';
    }

    return { dayNum, date, status, session, tradeCount: dayTrades.length, pnl, violations, reviewsPending, trades: dayTrades };
  });
}

export function getCompliantDayDates(days: ChallengeDayInfo[]): string[] {
  const today = getTodayString();
  return days
    .filter(d => d.date !== null && d.date <= today && d.tradeCount > 0 && d.violations === 0)
    .map(d => d.date as string);
}

export function longestDayStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (diffDays(sorted[i - 1], sorted[i]) === 1) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }
  return best;
}

// ── Milestones ──────────────────────────────────────────────────────────────
export function buildMilestones(
  challengeTrades: Trade[],
  days: ChallengeDayInfo[],
  isCompleted: boolean,
  dayNumber: number
): ChallengeMilestone[] {
  const today = getTodayString();
  const compliantDates = getCompliantDayDates(days);
  const compliantTrades = challengeTrades.filter(t => getTradeViolations(t).length === 0).length;
  const activeDays = days.filter(d => d.date !== null && d.date <= today && d.tradeCount > 0).length;

  const make = (
    id: string,
    title: string,
    description: string,
    rawProgress: number,
    target: number,
    achieved?: boolean
  ): ChallengeMilestone => ({
    id,
    title,
    description,
    progress: Math.max(0, Math.min(rawProgress, target)),
    target,
    achieved: achieved ?? rawProgress >= target,
  });

  return [
    make('first-trade', 'First trade logged', 'Log your first challenge trade', challengeTrades.length, 1),
    make('three-days', '3 disciplined days', '3 days with zero rule violations', compliantDates.length, 3),
    make('seven-streak', '7-day streak', '7 consecutive days with zero rule violations', longestDayStreak(compliantDates), 7),
    make('ten-compliant', '10 compliant trades', '10 trades that followed every challenge rule', compliantTrades, 10),
    make('fifteen-days', '15-day consistency', 'Trade on 15 different challenge days', activeDays, 15),
    make('twenty-compliant', '20 compliant trades', '20 trades that followed every challenge rule', compliantTrades, 20),
    make('completed', 'Challenge completed', 'Finish all 30 days of the challenge', dayNumber, 30, isCompleted),
  ];
}

// ── Recent activity feed ────────────────────────────────────────────────────
export function buildChallengeActivity(
  challengeTrades: Trade[],
  startDate: string | null,
  limit = 8
): ChallengeActivity[] {
  if (!startDate) return [];

  const sorted = [...challengeTrades].sort((a, b) =>
    (b.date + '|' + (b.createdAt || '')).localeCompare(a.date + '|' + (a.createdAt || ''))
  );

  const events: ChallengeActivity[] = [];
  for (const t of sorted) {
    const dayNum = Math.max(1, diffDays(startDate, t.date) + 1);
    const name = t.pair || t.symbol || 'Trade';
    events.push({ id: `${t.id}-log`, dayNum, date: t.date, text: `${name} trade logged`, tone: 'neutral' });

    const violations = getTradeViolations(t);
    if (violations.length > 0) {
      events.push({
        id: `${t.id}-viol`,
        dayNum,
        date: t.date,
        text: `${violations[0].label} violated`,
        tone: 'negative',
      });
    } else {
      events.push({ id: `${t.id}-rules`, dayNum, date: t.date, text: 'All challenge rules followed', tone: 'positive' });
    }

    if (t.psychologicalMetrics) {
      events.push({ id: `${t.id}-review`, dayNum, date: t.date, text: 'Psychology review completed', tone: 'info' });
    }
  }

  return events.slice(0, limit);
}

// ── Coaching warnings and encouragement ─────────────────────────────────────
function buildViolationMessage(rule: ChallengeRuleResult, trades: Trade[]): string {
  const affected = trades.filter(t => rule.affectedTradeIds.includes(t.id));
  const plural = rule.violations !== 1;
  switch (rule.id) {
    case 'risk': {
      const maxRisk = affected.length ? Math.max(...affected.map(t => t.risk)) : CHALLENGE_RULE_CONFIG.maxRisk;
      return plural
        ? `${rule.violations} challenge trades used more than ${CHALLENGE_RULE_CONFIG.maxRisk}% risk. Highest was ${maxRisk}%.`
        : `One challenge trade used ${maxRisk}% risk, above the ${CHALLENGE_RULE_CONFIG.maxRisk}% limit.`;
    }
    case 'score':
      return plural
        ? `${rule.violations} challenge trades were logged below a ${CHALLENGE_RULE_CONFIG.minScore} setup score.`
        : `One challenge trade was logged below a ${CHALLENGE_RULE_CONFIG.minScore} setup score.`;
    case 'confluences':
      return plural
        ? `${rule.violations} trades were taken with fewer than ${CHALLENGE_RULE_CONFIG.minConfluences} confluences.`
        : `One trade was taken with fewer than ${CHALLENGE_RULE_CONFIG.minConfluences} confluences.`;
    case 'symbol':
      return plural
        ? `${rule.violations} trades were logged on symbols other than ${CHALLENGE_RULE_CONFIG.symbol}.`
        : `One trade was logged on a symbol other than ${CHALLENGE_RULE_CONFIG.symbol}.`;
    case 'session':
      return plural
        ? `${rule.violations} trades were logged outside the ${CHALLENGE_RULE_CONFIG.session} session.`
        : `One trade was logged outside the ${CHALLENGE_RULE_CONFIG.session} session.`;
    case 'focus':
      return plural
        ? `${rule.violations} trades were logged with mental focus below ${CHALLENGE_RULE_CONFIG.minMentalFocus}.`
        : `One trade was logged with mental focus below ${CHALLENGE_RULE_CONFIG.minMentalFocus}.`;
    case 'review':
      return plural
        ? `${rule.violations} closed trades are still missing a journal review.`
        : `One closed trade is still missing a journal review.`;
    default:
      return `${rule.violations} trade${plural ? 's' : ''} broke this rule.`;
  }
}

export function buildCoachingCards(
  challengeTrades: Trade[],
  rules: ChallengeRuleResult[]
): CoachingCard[] {
  if (challengeTrades.length === 0) return [];

  const cards: CoachingCard[] = [];
  const today = getTodayString();
  const todayRisks = challengeTrades
    .filter(t => t.date === today && hasNumber(t.risk))
    .map(t => t.risk);
  const maxTodayRisk = todayRisks.length ? Math.max(...todayRisks) : 0;
  const todayRiskBreach = maxTodayRisk > CHALLENGE_RULE_CONFIG.maxRisk;

  if (todayRiskBreach) {
    cards.push({
      id: 'today-risk',
      tone: 'warning',
      title: 'Risk Warning',
      message: `Today's risk is ${maxTodayRisk}%, above your ${CHALLENGE_RULE_CONFIG.maxRisk}% challenge limit.`,
      recommendation: 'Do not open another trade today.',
    });
  }

  const violated = rules
    .filter(r => r.violations > 0 && !(todayRiskBreach && r.id === 'risk'))
    .sort((a, b) => b.violations - a.violations)
    .slice(0, 3);

  for (const rule of violated) {
    cards.push({
      id: `warn-${rule.id}`,
      tone: 'warning',
      title: `${rule.label} needs attention`,
      message: buildViolationMessage(rule, challengeTrades),
      recommendation: getRuleAdvice(rule.id),
    });
  }

  const reviewsPending = rules.find(r => r.id === 'review')?.violations ?? 0;
  if (reviewsPending > 0 && !violated.some(r => r.id === 'review')) {
    cards.push({
      id: 'warn-review',
      tone: 'warning',
      title: 'Journal review incomplete',
      message: `${reviewsPending} closed challenge trade${reviewsPending > 1 ? 's are' : ' is'} still missing a post-trade review.`,
      recommendation: getRuleAdvice('review'),
    });
  }

  const recent = [...challengeTrades]
    .sort((a, b) => (b.date + '|' + (b.createdAt || '')).localeCompare(a.date + '|' + (a.createdAt || '')))
    .slice(0, 5);
  if (recent.length >= 3) {
    const clean = recent.every(t => {
      const ids = getTradeViolations(t).map(v => v.id);
      return !ids.includes('score') && !ids.includes('risk');
    });
    if (clean) {
      cards.push({
        id: 'strong-discipline',
        tone: 'positive',
        title: 'Strong discipline',
        message: `Your last ${recent.length} challenge trades followed the setup score and risk rules.`,
        recommendation: 'Keep the same process for the rest of the challenge.',
      });
    }
  }

  return cards;
}

// ── Summary statistics ──────────────────────────────────────────────────────
function bestGroup(closed: Trade[], key: (t: Trade) => string): string | null {
  const totals = new Map<string, number>();
  for (const t of closed) {
    const k = key(t);
    if (!k) continue;
    totals.set(k, (totals.get(k) ?? 0) + (t.pnl ?? 0));
  }
  let best: string | null = null;
  let bestValue = -Infinity;
  for (const [k, v] of totals) {
    if (v > bestValue) {
      bestValue = v;
      best = k;
    }
  }
  return bestValue > -Infinity ? best : null;
}

export function buildChallengeSummary(
  challengeTrades: Trade[],
  rules: ChallengeRuleResult[],
  days: ChallengeDayInfo[]
): ChallengeSummary {
  const closed = challengeTrades.filter(t => t.status === 'CLOSED' && Boolean(t.result));
  const wins = closed.filter(t => t.result === 'WIN').length;
  const losses = closed.filter(t => t.result === 'LOSS').length;
  const breakEvens = closed.filter(t => t.result === 'BE').length;
  const winRate = closed.length ? Math.round((wins / closed.length) * 100) : 0;
  const totalPnL = closed.reduce((a, t) => a + (t.pnl ?? 0), 0);

  const avgScore = challengeTrades.length
    ? Math.round(challengeTrades.reduce((a, t) => a + (t.score || 0), 0) / challengeTrades.length)
    : 0;
  const riskTrades = challengeTrades.filter(t => hasNumber(t.risk));
  const avgRisk = riskTrades.length
    ? Math.round((riskTrades.reduce((a, t) => a + t.risk, 0) / riskTrades.length) * 10) / 10
    : 0;

  let winStreak = 0;
  const byDate = [...closed].sort((a, b) => b.date.localeCompare(a.date));
  for (const t of byDate) {
    if (t.result === 'WIN') winStreak++;
    else break;
  }

  const reviewsCompleted = closed.filter(t => Boolean(t.psychologicalMetrics)).length;
  const mostViolated = [...rules].sort((a, b) => b.violations - a.violations)[0];

  return {
    totalTrades: challengeTrades.length,
    wins,
    losses,
    breakEvens,
    winRate,
    totalPnL,
    avgScore,
    avgRisk,
    rulesFollowed: rules.filter(r => r.hasData && r.passed).length,
    rulesBroken: rules.filter(r => r.violations > 0).length,
    reviewsCompleted,
    reviewsPending: closed.length - reviewsCompleted,
    winStreak,
    compliantDays: getCompliantDayDates(days).length,
    bestSession: bestGroup(closed, t => t.session || ''),
    bestStrategy: bestGroup(closed, t => t.strategy || ''),
    commonViolation: mostViolated && mostViolated.violations > 0 ? mostViolated.label : null,
  };
}
