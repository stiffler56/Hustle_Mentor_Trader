import React from 'react';
import { Link } from 'react-router';
import { Flame, Trophy, Target, TrendingUp, Shield, AlertTriangle, CheckCircle2, Play, StopCircle, Sun, Moon } from 'lucide-react';
import { useChallengeContext } from '../data/ChallengeContext';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import type { Session } from '../data/types';

type DayStatus = 'future' | 'rest' | 'win' | 'loss' | 'be' | 'pass' | 'today';

function sessionIsNight(session: Session | null): boolean {
  return session === 'Tokyo' || session === 'Sydney';
}

function DayCell({
  dayNum,
  status,
  session,
}: {
  dayNum: number;
  status: DayStatus;
  session: Session | null;
}) {
  const styles: Record<DayStatus, { bg: string; border: string; color: string }> = {
    future: { bg: 'transparent',               border: '#1c2333',  color: '#374151' },
    rest:   { bg: '#1c2333',                   border: '#1c2333',  color: '#6b7280' },
    win:    { bg: 'rgba(16,185,129,0.2)',       border: '#10b981',  color: '#10b981' },
    loss:   { bg: 'rgba(239,68,68,0.2)',        border: '#f87171',  color: '#f87171' },
    be:     { bg: 'rgba(96,165,250,0.2)',       border: '#60a5fa',  color: '#60a5fa' },
    pass:   { bg: 'rgba(107,114,128,0.1)',      border: '#374151',  color: '#6b7280' },
    today:  { bg: 'rgba(245,158,11,0.2)',       border: '#f59e0b',  color: '#f59e0b' },
  };
  const s = styles[status];
  const night = session ? sessionIsNight(session) : null;

  return (
    <div
      className="rounded-lg flex flex-col items-center justify-between px-1 pt-1.5 pb-1 transition-all"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        minHeight: 52,
      }}
      title={`Day ${dayNum}${session ? ` · ${session}` : ''}`}
    >
      {/* Day number */}
      <span style={{ fontSize: 11, lineHeight: 1 }}>{dayNum}</span>

      {/* Bottom appearance indicator */}
      <div style={{ height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {night === true && (
          <Moon
            size={9}
            style={{ color: '#818cf8', opacity: 0.9 }}
            fill="rgba(129,140,248,0.4)"
          />
        )}
        {night === false && (
          <Sun
            size={9}
            style={{ color: '#fbbf24', opacity: 0.9 }}
            fill="rgba(251,191,36,0.35)"
          />
        )}
      </div>
    </div>
  );
}

const RULES = [
  { icon: Target, text: 'Only log trades with score ≥ 75 (TAKE decision)' },
  { icon: Shield, text: 'XAUUSD · New York session · max 1% risk' },
  { icon: TrendingUp, text: 'Need 3+ confluences before entry' },
  { icon: AlertTriangle, text: 'If mental focus < 15 — skip the day entirely' },
  { icon: CheckCircle2, text: 'Review your journal every weekend' },
];

export default function Challenge() {
  const { challenge, startChallenge, stopChallenge, dayNumber, daysLeft, isCompleted } = useChallengeContext();
  const { trades } = useTradesContext();
  const { colors } = useTheme();

  // Get challenge trades
  const challengeTrades = trades.filter(t => challenge.tradeIds.includes(t.id));
  const closedChallengeTrades = challengeTrades.filter(t => t.status === 'CLOSED' && t.result);
  const wins = closedChallengeTrades.filter(t => t.result === 'WIN').length;
  const losses = closedChallengeTrades.filter(t => t.result === 'LOSS').length;
  const winRate = closedChallengeTrades.length
    ? Math.round((wins / closedChallengeTrades.length) * 100)
    : 0;
  const totalPnL = closedChallengeTrades.reduce((a, t) => a + (t.pnl ?? 0), 0);
  const avgScore = challengeTrades.length
    ? Math.round(challengeTrades.reduce((a, t) => a + t.score, 0) / challengeTrades.length)
    : 0;

  // Discipline score: % of logged challenge trades with score >= 75
  const disciplineScore = challengeTrades.length
    ? Math.round((challengeTrades.filter(t => t.score >= 75).length / challengeTrades.length) * 100)
    : 0;

  // Winning streak calculation
  let streak = 0;
  const sorted = [...closedChallengeTrades].sort((a, b) => b.date.localeCompare(a.date));
  for (const t of sorted) {
    if (t.result === 'WIN') streak++;
    else break;
  }

  // Build 30-day grid
  const gridDays = Array.from({ length: 30 }, (_, i) => {
    const dn = i + 1;
    if (!challenge.isActive || !challenge.startDate) return { dayNum: dn, status: 'future' as DayStatus, session: null as Session | null };

    const dayDate = new Date(challenge.startDate);
    dayDate.setDate(dayDate.getDate() + i);
    const dayStr = dayDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const dayTrades = challengeTrades.filter(t => t.date === dayStr);
    // Pick the session from the first trade of the day (if any)
    const daySession: Session | null = dayTrades[0]?.session ?? null;

    if (dayStr > today) return { dayNum: dn, status: 'future' as DayStatus, session: null as Session | null };
    if (dayStr === today) {
      if (dayTrades.length === 0) return { dayNum: dn, status: 'today' as DayStatus, session: null as Session | null };
    }

    if (dayTrades.length === 0) return { dayNum: dn, status: 'rest' as DayStatus, session: null as Session | null };

    const hasWin  = dayTrades.some(t => t.result === 'WIN');
    const hasLoss = dayTrades.some(t => t.result === 'LOSS');
    const allPass = dayTrades.every(t => t.result === undefined);

    if (allPass)              return { dayNum: dn, status: 'pass' as DayStatus, session: daySession };
    if (hasWin && !hasLoss)   return { dayNum: dn, status: 'win'  as DayStatus, session: daySession };
    if (hasLoss && !hasWin)   return { dayNum: dn, status: 'loss' as DayStatus, session: daySession };
    return                           { dayNum: dn, status: 'be'   as DayStatus, session: daySession };
  });

  const progressPct = challenge.isActive ? Math.round((dayNumber / 30) * 100) : 0;

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
        {!challenge.isActive ? (
          <button
            onClick={startChallenge}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
          >
            <Play size={14} /> Start Challenge #{challenge.challengeNumber}
          </button>
        ) : (
          <button
            onClick={() => { if (confirm('Stop the current challenge?')) stopChallenge(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
            style={{ border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            <StopCircle size={14} /> Stop Challenge
          </button>
        )}
      </div>

      {/* Completed banner */}
      {isCompleted && (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <Trophy size={32} style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-base" style={{ color: '#f59e0b' }}>Challenge Completed!</p>
            <p className="text-sm mt-0.5" style={{ color: colors.textSub }}>
              You completed 30 days of disciplined trading. Win rate: {winRate}% · P&L: ${totalPnL >= 0 ? '+' : ''}{totalPnL}
            </p>
          </div>
        </div>
      )}

      {/* Active status bar */}
      {challenge.isActive && !isCompleted && (
        <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm" style={{ color: colors.text }}>Day {dayNumber} of 30</span>
              <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                {daysLeft} days left
              </span>
            </div>
            <span className="text-xs" style={{ color: colors.textMuted }}>Started {challenge.startDate}</span>
          </div>
          <div className="h-2 rounded-full" style={{ background: colors.border }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Challenge WR', value: `${winRate}%`, color: winRate >= 55 ? '#10b981' : '#f87171' },
          { label: 'Discipline Score', value: `${disciplineScore}%`, color: disciplineScore >= 80 ? '#10b981' : '#f59e0b' },
          { label: 'Win Streak', value: `${streak}`, color: streak >= 3 ? '#10b981' : colors.text },
          { label: 'Challenge P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL}`, color: totalPnL >= 0 ? '#10b981' : '#f87171' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: colors.textMuted }}>{s.label}</p>
            <p className="text-2xl" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Calendar */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-sm mb-4" style={{ color: colors.textSub }}>30-Day Progress Calendar</p>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {gridDays.map(({ dayNum, status, session }) => (
              <DayCell key={dayNum} dayNum={dayNum} status={status} session={session} />
            ))}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            {[
              { label: 'Win', color: '#10b981' }, { label: 'Loss', color: '#f87171' },
              { label: 'BE', color: '#60a5fa' }, { label: 'Today', color: '#f59e0b' },
              { label: 'Rest', color: '#6b7280' }, { label: 'Future', color: '#374151' },
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
          {/* Challenge stats */}
          <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: colors.textSub }}>Challenge Stats</p>
            <div className="space-y-2">
              {[
                { label: 'Trades Logged', value: `${challengeTrades.length}` },
                { label: 'Wins', value: `${wins}`, color: '#10b981' },
                { label: 'Losses', value: `${losses}`, color: '#f87171' },
                { label: 'Avg Score', value: `${avgScore || '—'}` },
              ].map(s => (
                <div key={s.label} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid ${colors.rowBorder}` }}>
                  <span className="text-xs" style={{ color: colors.textSub }}>{s.label}</span>
                  <span className="text-xs" style={{ color: s.color ?? colors.text }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: colors.textSub }}>Challenge Rules</p>
            <div className="space-y-2">
              {RULES.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <r.icon size={12} style={{ color: '#f59e0b', marginTop: 1, flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: colors.textSub }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}