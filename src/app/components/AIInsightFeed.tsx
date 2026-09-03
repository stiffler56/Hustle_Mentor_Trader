import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  Brain,
  Sparkles,
  Target,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  Zap,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { Trade } from '../data/types';
import { useTheme } from '../data/ThemeContext';
import { generateMentorReport, type MentorInsight } from '../utils/aiMentor';

interface InsightCardData {
  id: string;
  category: 'discipline' | 'setup' | 'session' | 'mistake';
  title: string;
  explanation: string;
  action: string;
  severity: 'success' | 'warning' | 'danger' | 'info';
  metric?: string;
  evidence?: string;
}

const PROFIT = '#10b981';
const LOSS = '#f87171';
const WARNING = '#f59e0b';
const INFO = '#60a5fa';

function getSeverityColor(sev: 'success' | 'warning' | 'danger' | 'info'): string {
  if (sev === 'success') return PROFIT;
  if (sev === 'danger') return LOSS;
  if (sev === 'warning') return WARNING;
  return INFO;
}

function getCategoryIcon(cat: 'discipline' | 'setup' | 'session' | 'mistake') {
  if (cat === 'session') return Clock;
  if (cat === 'setup') return Target;
  if (cat === 'mistake') return ShieldAlert;
  return Flame;
}

export function generateInsightFeed(trades: Trade[]): InsightCardData[] {
  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);
  const cards: InsightCardData[] = [];

  // Low data state
  if (closed.length < 3) {
    cards.push({
      id: 'low-data',
      category: 'discipline',
      title: 'Build your sample baseline',
      explanation: 'Log and close at least 3 to 5 trades with score and session tags so the AI engine can isolate patterns.',
      action: 'Score your upcoming setups before taking live entries and tag before/after screenshots.',
      severity: 'info',
      metric: `${closed.length}/5 trades`,
    });
    return cards;
  }

  // 1. Session Performance Insight (e.g. Underperforming London or Strong NY)
  const sessions = ['New York', 'London', 'Tokyo', 'Sydney'] as const;
  const sessionStats = sessions.map(session => {
    const sTrades = closed.filter(t => t.session === session);
    const sWins = sTrades.filter(t => t.result === 'WIN').length;
    const sLoss = sTrades.filter(t => t.result === 'LOSS').length;
    const sPnl = sTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = sTrades.length ? Math.round((sWins / sTrades.length) * 100) : 0;
    return { session, count: sTrades.length, wins: sWins, losses: sLoss, pnl: sPnl, winRate };
  }).filter(s => s.count >= 2);

  const underperformingSession = sessionStats.find(s => s.winRate < 45 || s.pnl < -100);
  const bestSession = [...sessionStats].sort((a, b) => b.pnl - a.pnl || b.winRate - a.winRate)[0];

  if (underperformingSession) {
    cards.push({
      id: `session-weak-${underperformingSession.session}`,
      category: 'session',
      title: `Your ${underperformingSession.session} session is underperforming`,
      explanation: `${underperformingSession.session} trades have a ${underperformingSession.winRate}% win rate with ${underperformingSession.pnl < 0 ? `-$${Math.abs(Math.round(underperformingSession.pnl))}` : `$${Math.round(underperformingSession.pnl)}`} net P&L across ${underperformingSession.count} trades.`,
      action: `Reduce position size by 50% or skip ${underperformingSession.session} until setups score 75+ with 3+ confluences.`,
      severity: 'warning',
      metric: `${underperformingSession.winRate}% WR`,
      evidence: `${underperformingSession.count} trades logged`,
    });
  } else if (bestSession && bestSession.winRate >= 55) {
    cards.push({
      id: `session-strong-${bestSession.session}`,
      category: 'session',
      title: `${bestSession.session} is your prime money session`,
      explanation: `You have won ${bestSession.wins} of ${bestSession.count} trades (${bestSession.winRate}% win rate) producing +$${Math.round(bestSession.pnl)} in net gains.`,
      action: `Focus your daily risk budget during ${bestSession.session} and avoid forcing entries outside this window.`,
      severity: 'success',
      metric: `+${Math.round(bestSession.pnl)}$`,
      evidence: `${bestSession.winRate}% WR`,
    });
  }

  // 2. Confluence & Setup Quality Insight
  const highConfluence = closed.filter(t => t.confluences >= 3);
  const lowConfluence = closed.filter(t => t.confluences < 3);

  if (highConfluence.length >= 2) {
    const highWins = highConfluence.filter(t => t.result === 'WIN').length;
    const highWR = Math.round((highWins / highConfluence.length) * 100);
    const lowWins = lowConfluence.filter(t => t.result === 'WIN').length;
    const lowWR = lowConfluence.length ? Math.round((lowWins / lowConfluence.length) * 100) : 0;

    if (highWR > lowWR) {
      cards.push({
        id: 'confluence-rule',
        category: 'setup',
        title: 'You win significantly more when confluence is 3+',
        explanation: `Setups with 3+ confluence factors win at ${highWR}% compared to ${lowWR}% on lower confluence trades.`,
        action: 'Require at least 3 independent technical reasons (e.g. FVG + OB + Liquidity sweep) before triggering.',
        severity: 'success',
        metric: `${highWR}% vs ${lowWR}%`,
        evidence: `${highConfluence.length} high-confluence trades`,
      });
    }
  }

  // 3. Best Setup / Playbook Edge
  const strategies = ['D1/H4 FVG', 'Liquidity', 'Order Block', 'ICT Concept', 'Support/Resistance'] as const;
  const stratStats = strategies.map(strategy => {
    const sTrades = closed.filter(t => t.strategy === strategy);
    const wins = sTrades.filter(t => t.result === 'WIN').length;
    const pnl = sTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = sTrades.length ? Math.round((wins / sTrades.length) * 100) : 0;
    return { strategy, count: sTrades.length, wins, pnl, winRate };
  }).filter(s => s.count >= 2);

  const bestStrat = [...stratStats].sort((a, b) => b.pnl - a.pnl || b.winRate - a.winRate)[0];
  if (bestStrat && bestStrat.pnl > 0) {
    cards.push({
      id: `setup-edge-${bestStrat.strategy}`,
      category: 'setup',
      title: `Your best setup is ${bestStrat.strategy}`,
      explanation: `${bestStrat.count} closed trades generated +$${Math.round(bestStrat.pnl)} with a ${bestStrat.winRate}% strike rate.`,
      action: `Prioritize ${bestStrat.strategy} setups and reject trades that do not fit this playbook.`,
      severity: 'success',
      metric: `+${Math.round(bestStrat.pnl)}$ P&L`,
      evidence: `${bestStrat.count} trades`,
    });
  }

  // 4. Discipline & Daily Drawdown / Consecutive Loss rule
  // Check multi-loss days from date groupings
  const dateMap = new Map<string, Trade[]>();
  closed.forEach(t => {
    const d = t.date || (t.closedAt ? t.closedAt.split('T')[0] : '');
    if (d) {
      dateMap.set(d, [...(dateMap.get(d) || []), t]);
    }
  });

  const multiLossDays = [...dateMap.entries()].filter(([_, dTrades]) => {
    const dayLosses = dTrades.filter(t => t.result === 'LOSS').length;
    return dayLosses >= 2;
  });

  if (multiLossDays.length > 0) {
    const totalTradesOnMultiLossDays = multiLossDays.reduce((sum, [_, dTrades]) => sum + dTrades.length, 0);
    const totalPnlOnMultiLossDays = multiLossDays.reduce((sum, [_, dTrades]) => sum + dTrades.reduce((s, t) => s + (t.pnl || 0), 0), 0);

    cards.push({
      id: 'daily-stop-rule',
      category: 'discipline',
      title: 'Avoid new trades after 2 losses in the same day',
      explanation: `On days with 2+ losses, subsequent trades generated ${totalPnlOnMultiLossDays < 0 ? `-$${Math.abs(Math.round(totalPnlOnMultiLossDays))}` : `$${Math.round(totalPnlOnMultiLossDays)}`} across ${totalTradesOnMultiLossDays} trades.`,
      action: 'Set a hard daily circuit breaker: walk away from the screens immediately after 2 consecutive red trades.',
      severity: 'danger',
      metric: 'Circuit Breaker',
      evidence: `${multiLossDays.length} breach days detected`,
    });
  }

  // 5. Emotional execution / Revenge trade detection
  const revengeTrades = closed.filter(t =>
    t.psychologicalMetrics?.wasRevengeTrading ||
    t.notes?.toLowerCase().includes('revenge') ||
    t.notes?.toLowerCase().includes('emotional') ||
    t.notes?.toLowerCase().includes('impatient') ||
    (t.decision === 'PASS' && t.result === 'LOSS')
  );

  if (revengeTrades.length > 0) {
    const revengeLosses = revengeTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    cards.push({
      id: 'revenge-pattern',
      category: 'mistake',
      title: 'Emotional execution appears most often after losing trades',
      explanation: `${revengeTrades.length} trades show revenge or forced entry flags, costing ${revengeLosses < 0 ? `-$${Math.abs(Math.round(revengeLosses))}` : `$${Math.round(revengeLosses)}`} in preventable losses.`,
      action: 'Implement a mandatory 30-minute cooldown rule and require a written scorer review before re-entry.',
      severity: 'danger',
      metric: `${revengeTrades.length} flags`,
      evidence: 'Psychology journal audit',
    });
  }

  // 6. Risk Sizing Discipline
  const oversizedTrades = closed.filter(t => t.risk > 2);
  if (oversizedTrades.length > 0) {
    cards.push({
      id: 'oversized-risk',
      category: 'discipline',
      title: 'High risk (>2%) is leaking capital',
      explanation: `${oversizedTrades.length} trades exceeded your 2% maximum risk rule.`,
      action: 'Strictly cap every trade at 1-1.5% fixed account risk regardless of setup conviction.',
      severity: 'warning',
      metric: `${oversizedTrades.length} high-risk trades`,
    });
  }

  // Cap at top 4-5 high impact cards
  return cards.slice(0, 5);
}

export function AIInsightFeed({ trades }: { trades: Trade[] }) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'discipline' | 'setup' | 'session' | 'mistake'>('ALL');

  const allInsights = generateInsightFeed(trades);
  const filteredInsights = filter === 'ALL' ? allInsights : allInsights.filter(c => c.category === filter);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* Feed Header */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            <Brain size={20} style={{ color: WARNING }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: colors.textMuted }}>
                AI Behavior & Pattern Insights
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(16,185,129,0.12)', color: PROFIT, border: '1px solid rgba(16,185,129,0.3)' }}
              >
                Live Data Driven
              </span>
            </div>
            <h2 className="text-lg font-bold leading-tight" style={{ color: colors.text }}>
              Practical Trading Advice
            </h2>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
          {(['ALL', 'discipline', 'setup', 'session', 'mistake'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="text-xs px-2.5 py-1 rounded-lg capitalize font-medium transition-all"
              style={{
                background: filter === cat ? 'rgba(245,158,11,0.15)' : colors.inputBg,
                color: filter === cat ? WARNING : colors.textMuted,
                border: `1px solid ${filter === cat ? 'rgba(245,158,11,0.3)' : colors.border}`,
              }}
            >
              {cat === 'ALL' ? 'All Advice' : cat}
            </button>
          ))}
          <Link
            to="/ai-mentor"
            className="text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80 ml-1"
            style={{ color: WARNING, background: colors.inputBg, border: `1px solid ${colors.border}` }}
          >
            <span>Ask Mentor</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsights.map(card => {
          const color = getSeverityColor(card.severity);
          const Icon = getCategoryIcon(card.category);

          return (
            <div
              key={card.id}
              className="rounded-xl p-4 flex flex-col justify-between transition-all hover:translate-y-[-2px]"
              style={{
                background: colors.inputBg,
                border: `1px solid ${colors.border}`,
                boxShadow: `0 4px 12px rgba(0,0,0,0.02)`,
              }}
            >
              <div>
                {/* Header tag */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `${color}18`, color }}
                    >
                      <Icon size={13} />
                    </span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold capitalize" style={{ color }}>
                      {card.category}
                    </span>
                  </div>
                  {card.metric && (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                      style={{ background: `${color}14`, color, border: `1px solid ${color}30` }}
                    >
                      {card.metric}
                    </span>
                  )}
                </div>

                {/* Title & Body */}
                <h3 className="text-sm font-bold leading-snug mb-1.5" style={{ color: colors.text }}>
                  {card.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: colors.textSub }}>
                  {card.explanation}
                </p>
              </div>

              {/* Recommended Action Box */}
              <div
                className="mt-3.5 pt-2.5 rounded-lg p-2.5"
                style={{
                  background: `${color}08`,
                  border: `1px solid ${color}20`,
                }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Zap size={11} style={{ color }} />
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color }}>
                    Recommended Action
                  </span>
                </div>
                <p className="text-xs font-medium leading-normal" style={{ color: colors.text }}>
                  {card.action}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AIInsightFeed;
