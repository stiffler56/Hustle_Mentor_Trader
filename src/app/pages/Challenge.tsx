import React from 'react';
import {
  Flame, Trophy, Target, TrendingUp, Shield, AlertTriangle, CheckCircle2,
  Play, StopCircle, Sun, Moon, CalendarDays, BookOpen, Brain, Scale, Gauge,
} from 'lucide-react';
import { useChallengeContext } from '../data/ChallengeContext';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import {
  CHALLENGE_RULE_CONFIG,
  addDaysToDate,
  buildChallengeDays,
  calculateDisciplineBreakdown,
  disciplineInterpretation,
  evaluateChallengeRules,
  getMissionStatus,
  getTodayString,
  missionStatusLabel,
  buildChallengeSummary,
} from '../data/challengeRules';
import type { ChallengeDayInfo, DayStatus } from '../data/challengeRules';

function sessionIsNight(session: string | null): boolean | null {
  if (!session) return null;
  return session === 'Tokyo' || session === 'Sydney';
}

// ── Small shared UI helpers ─────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { colors } = useTheme();
  return (
    <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}`, ...style }}>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>{label}</p>
      <p className="text-2xl" style={{ color: color ?? colors.text }}>{value}</p>
    </div>
  );
}

function MiniBar({ value, color }: { value: number | null; color: string }) {
  const { colors } = useTheme();
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.rowBorder }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value ?? 0}%`, background: color }}
      />
    </div>
  );
}

function DayCell({ day }: { day: ChallengeDayInfo }) {
  const { colors } = useTheme();
  const styles: Record<DayStatus, { bg: string; border: string; color: string }> = {
    future: { bg: 'transparent', border: colors.border, color: colors.textFaint },
    rest: { bg: colors.inputBg, border: colors.border, color: colors.textMuted },
    win: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', color: '#10b981' },
    loss: { bg: 'rgba(239,68,68,0.15)', border: '#f87171', color: '#f87171' },
    be: { bg: 'rgba(96,165,250,0.15)', border: '#60a5fa', color: '#60a5fa' },
    pass: { bg: 'rgba(107,114,128,0.1)', border: colors.border, color: colors.textMuted },
    violation: { bg: 'rgba(239,68,68,0.15)', border: '#f87171', color: '#f87171' },
    today: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', color: '#f59e0b' },
  };
  const s = styles[day.status];
  const night = sessionIsNight(day.session);

  return (
    <div
      className="rounded-lg flex flex-col items-center justify-between px-1 pt-1.5 pb-1 transition-all"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, minHeight: 52 }}
      title={`Day ${day.dayNum}${day.session ? ` · ${day.session}` : ''}`}
    >
      <span style={{ fontSize: 11, lineHeight: 1 }}>{day.dayNum}</span>
      <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {night === true && <Moon size={9} style={{ color: '#818cf8', opacity: 0.9 }} fill="rgba(129,140,248,0.4)" />}
        {night === false && <Sun size={9} style={{ color: '#fbbf24', opacity: 0.9 }} fill="rgba(251,191,36,0.35)" />}
      </div>
    </div>
  );
}

export default function Challenge() {
  const { challenge, startChallenge, stopChallenge, dayNumber, daysLeft, isCompleted } = useChallengeContext();
  const { trades } = useTradesContext();
  const { colors } = useTheme();

  const challengeTrades = trades.filter(t => challenge.tradeIds.includes(t.id));
  const todayStr = getTodayString();
  const todayTrades = challengeTrades.filter(t => t.date === todayStr);

  const rules = evaluateChallengeRules(challengeTrades);
  const todayRules = evaluateChallengeRules(todayTrades);
  const discipline = calculateDisciplineBreakdown(challengeTrades, rules);
  const interpretation = disciplineInterpretation(discipline);
  const days = buildChallengeDays(challenge, challengeTrades);
  const summary = buildChallengeSummary(challengeTrades, rules, days);
  const missionStatus = getMissionStatus(todayTrades);
  const missionLabel = missionStatusLabel(missionStatus);

  const rulesFollowed = rules.filter(r => r.hasData && r.passed).length;
  const rulesBroken = rules.filter(r => r.violations > 0).length;

  const progressPct = challenge.isActive ? Math.round((dayNumber / 30) * 100) : 0;
  const expectedEnd = challenge.startDate ? addDaysToDate(challenge.startDate, 29) : null;

  const statusText = !challenge.isActive ? 'Not Started' : isCompleted ? 'Completed' : 'Active';
  const statusColor = !challenge.isActive ? colors.textMuted : isCompleted ? '#10b981' : '#f59e0b';
  const pnlColor = summary.totalPnL >= 0 ? '#10b981' : '#f87171';

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={20} style={{ color: '#f59e0b' }} />
            <h1 className="text-xl" style={{ color: colors.text }}>30-Day Discipline Challenge</h1>
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Trade only when your edge is present. Build discipline. Build consistency.
          </p>
        </div>
        {challenge.isActive && (
          <button
            onClick={() => { if (confirm('Stop the current challenge?')) stopChallenge(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            <StopCircle size={14} /> Stop Challenge
          </button>
        )}
      </div>

      {/* Hero */}
      {challenge.isActive ? (
        <div
          className="rounded-2xl p-5 lg:p-6"
          style={{ background: `linear-gradient(135deg, rgba(245,158,11,0.12), ${colors.surface})`, border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={18} style={{ color: '#f59e0b' }} />
                <span className="text-base" style={{ color: colors.text }}>30-Day Discipline Challenge</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${statusColor}22`, color: statusColor }}>
                  {statusText}
                </span>
              </div>
              <p className="text-3xl lg:text-4xl" style={{ color: colors.text }}>Day {dayNumber} of 30</p>
              <p className="text-sm mt-1" style={{ color: colors.textSub }}>
                {daysLeft} days remaining · Challenge #{challenge.challengeNumber}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right">
              <span className="text-xs" style={{ color: colors.textMuted }}>Start date</span>
              <span className="text-xs" style={{ color: colors.text }}>{challenge.startDate}</span>
              <span className="text-xs" style={{ color: colors.textMuted }}>Ends</span>
              <span className="text-xs" style={{ color: colors.text }}>{expectedEnd}</span>
              <span className="text-xs" style={{ color: colors.textMuted }}>Progress</span>
              <span className="text-xs" style={{ color: colors.text }}>{progressPct}%</span>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: colors.textSub }}>Day {dayNumber} / 30</span>
              <span className="text-xs" style={{ color: colors.textSub }}>{progressPct}%</span>
            </div>
            <div className="h-2.5 rounded-full" style={{ background: colors.border }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6 lg:p-8 text-center"
          style={{ background: colors.surface, border: `1px dashed ${colors.border}` }}
        >
          <Flame size={28} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
          <p className="text-lg" style={{ color: colors.text }}>Start your discipline challenge</p>
          <p className="text-sm mt-1 mb-5" style={{ color: colors.textMuted }}>
            Trade only when your edge is present. Build consistency over 30 days.
          </p>
          <button
            onClick={startChallenge}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Play size={14} /> Start Challenge #{challenge.challengeNumber}
          </button>
        </div>
      )}

      {/* Completed banner */}
      {isCompleted && (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Trophy size={32} style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-base" style={{ color: '#f59e0b' }}>Challenge Completed!</p>
            <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>
              Win rate: {summary.winRate}% · P&L: ${summary.totalPnL >= 0 ? '+' : ''}{summary.totalPnL}
            </p>
          </div>
        </div>
      )}

      {/* Today's Mission */}
      {challenge.isActive && (
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: colors.text }}>Today's Mission</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${missionLabel.color}22`, color: missionLabel.color }}>
              Mission status: {missionLabel.text}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {todayRules.map(rule => {
              const status = !rule.hasData
                ? { text: 'No data yet', color: colors.textMuted }
                : rule.passed
                  ? { text: 'Followed', color: '#10b981' }
                  : { text: `Broken ×${rule.violations}`, color: '#f87171' };
              return (
                <div key={rule.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: colors.inputBg, border: `1px solid ${colors.rowBorder}` }}>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: colors.textSub }}>{rule.label}</p>
                    <p className="text-[11px] truncate" style={{ color: colors.textMuted }}>{rule.description}</p>
                  </div>
                  <span className="text-[11px] whitespace-nowrap" style={{ color: status.color }}>{status.text}</span>
                </div>
              );
            })}
          </div>
          {summary.reviewsPending > 0 && (
            <p className="text-xs mt-3" style={{ color: colors.textMuted }}>
              Required action: Complete your post-trade review for {summary.reviewsPending} closed trade{summary.reviewsPending > 1 ? 's' : ''}.
            </p>
          )}
        </Card>
      )}

      {/* Summary statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Challenge WR" value={`${summary.winRate}%`} color={summary.winRate >= 55 ? '#10b981' : '#f87171'} />
        <StatCard label="Discipline Score" value={discipline.hasData ? `${discipline.total}` : '—'} color={interpretation.color} />
        <StatCard label="Win Streak" value={`${summary.winStreak}`} color={summary.winStreak >= 3 ? '#10b981' : colors.text} />
        <StatCard label="Challenge P&L" value={`${summary.totalPnL >= 0 ? '+' : ''}$${summary.totalPnL}`} color={pnlColor} />
        <StatCard label="Trades Logged" value={`${summary.totalTrades}`} />
        <StatCard label="Rules Followed" value={`${rulesFollowed}`} color="#10b981" />
        <StatCard label="Rules Broken" value={`${rulesBroken}`} color={rulesBroken > 0 ? '#f87171' : colors.text} />
        <StatCard label="Reviews Completed" value={`${summary.reviewsCompleted}`} />
        <StatCard label="Avg Setup Score" value={summary.totalTrades ? `${summary.avgScore}` : '—'} />
        <StatCard label="Avg Risk" value={summary.totalTrades ? `${summary.avgRisk}%` : '—'} color={summary.avgRisk > CHALLENGE_RULE_CONFIG.maxRisk ? '#f87171' : colors.text} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Calendar */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={14} style={{ color: colors.textSub }} />
            <p className="text-sm" style={{ color: colors.textSub }}>30-Day Progress Calendar</p>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {days.map(day => <DayCell key={day.dayNum} day={day} />)}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            {[
              { label: 'Win', color: '#10b981' }, { label: 'Loss', color: '#f87171' },
              { label: 'BE', color: '#60a5fa' }, { label: 'Today', color: '#f59e0b' },
              { label: 'Rest', color: '#6b7280' }, { label: 'Future', color: '#374151' },
              { label: 'Violation', color: '#ef4444' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color, opacity: 0.7 }} />
                <span className="text-xs" style={{ color: colors.textMuted }}>{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <Sun size={10} style={{ color: '#fbbf24' }} />
              <span className="text-xs" style={{ color: colors.textMuted }}>Day session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon size={10} style={{ color: '#818cf8' }} />
              <span className="text-xs" style={{ color: colors.textMuted }}>Night session</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Discipline breakdown */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Gauge size={14} style={{ color: '#f59e0b' }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: colors.textSub }}>Discipline Score</p>
            </div>
            <div className="flex items-end justify-between mb-1">
              <span className="text-3xl" style={{ color: interpretation.color }}>
                {discipline.hasData ? discipline.total : '—'}
                {discipline.hasData && <span className="text-base" style={{ color: colors.textMuted }}> / 100</span>}
              </span>
              <span className="text-xs" style={{ color: interpretation.color }}>{interpretation.text}</span>
            </div>
            <div className="space-y-3 mt-4">
              {[
                { label: 'Rule compliance', value: discipline.ruleCompliance, color: '#10b981' },
                { label: 'Risk discipline', value: discipline.riskDiscipline, color: '#f59e0b' },
                { label: 'Setup quality', value: discipline.setupQuality, color: '#60a5fa' },
                { label: 'Psychology', value: discipline.psychologyDiscipline, color: '#a78bfa' },
                { label: 'Journal completion', value: discipline.journalCompletion, color: '#34d399' },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: colors.textSub }}>{row.label}</span>
                    <span className="text-xs" style={{ color: row.value === null ? colors.textMuted : colors.text }}>
                      {row.value === null ? 'No data' : `${row.value}`}
                    </span>
                  </div>
                  <MiniBar value={row.value} color={row.color} />
                </div>
              ))}
            </div>
          </Card>

          {/* Rule compliance */}
          <Card>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} style={{ color: '#f59e0b' }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: colors.textSub }}>Rule Compliance</p>
            </div>
            <p className="text-xs mb-3" style={{ color: colors.textMuted }}>
              {rulesFollowed} rule{rulesFollowed === 1 ? '' : 's'} followed · {rulesBroken} broken
            </p>
            <div className="space-y-2">
              {rules.map(rule => {
                const icon = !rule.hasData
                  ? <Shield size={12} style={{ color: colors.textMuted, marginTop: 1, flexShrink: 0 }} />
                  : rule.passed
                    ? <CheckCircle2 size={12} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
                    : <AlertTriangle size={12} style={{ color: '#f87171', marginTop: 1, flexShrink: 0 }} />;
                const statusText = !rule.hasData ? 'No data yet' : rule.passed ? 'Followed' : `Broken ×${rule.violations}`;
                const statusColor = !rule.hasData ? colors.textMuted : rule.passed ? '#10b981' : '#f87171';
                return (
                  <div key={rule.id} className="flex items-start gap-2">
                    {icon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs" style={{ color: colors.textSub }}>{rule.label}</span>
                        <span className="text-[11px] whitespace-nowrap" style={{ color: statusColor }}>{statusText}</span>
                      </div>
                      <span className="text-[11px]" style={{ color: colors.textMuted }}>{rule.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Guidance legend */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={14} style={{ color: '#f59e0b' }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: colors.textSub }}>Challenge Rules</p>
            </div>
            <div className="space-y-2">
              {[
                { icon: Target, text: `Only log trades with score ≥ ${CHALLENGE_RULE_CONFIG.minScore} (TAKE decision)` },
                { icon: Shield, text: `${CHALLENGE_RULE_CONFIG.symbol} · ${CHALLENGE_RULE_CONFIG.session} session · max ${CHALLENGE_RULE_CONFIG.maxRisk}% risk` },
                { icon: TrendingUp, text: `Need ${CHALLENGE_RULE_CONFIG.minConfluences}+ confluences before entry` },
                { icon: Brain, text: `If mental focus < ${CHALLENGE_RULE_CONFIG.minMentalFocus} — skip the day entirely` },
                { icon: Scale, text: 'Review your journal after every closed trade' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <r.icon size={12} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: colors.textSub }}>{r.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
