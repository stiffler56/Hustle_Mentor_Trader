import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  AlertTriangle,
  ExternalLink,
  X,
  ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { Trade } from '../data/types';
import { useTheme } from '../data/ThemeContext';
import {
  type DayData,
  calculateMonthDays,
  calculateMonthStats,
  formatMoney,
  getTradeDateStr,
} from '../utils/calendarUtils';

interface TradeCalendarProps {
  trades: Trade[];
}

const PROFIT = '#10b981';
const LOSS_COLOR = '#f87171';
const WARNING = '#f59e0b';
const INFO = '#60a5fa';

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const navigate = useNavigate();
  const { colors } = useTheme();

  // Initial month: find latest trade month if current month has no trades
  const initialDate = useMemo(() => {
    if (!trades.length) return new Date();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const hasCurrentMonthTrades = trades.some(t => getTradeDateStr(t).startsWith(currentMonthStr));
    if (hasCurrentMonthTrades) return now;

    const sortedTrades = [...trades]
      .map(t => getTradeDateStr(t))
      .filter(Boolean)
      .sort()
      .reverse();

    if (sortedTrades.length > 0) {
      const parts = sortedTrades[0].split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    return now;
  }, [trades]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    return calculateMonthDays(year, month, trades);
  }, [year, month, trades]);

  const monthStats = useMemo(() => {
    return calculateMonthStats(calendarDays);
  }, [calendarDays]);

  // Max absolute P&L for heatmap color grading
  const maxAbsPnl = useMemo(() => {
    const currentMonthTrades = calendarDays.filter(d => d.isCurrentMonth && d.count > 0);
    if (!currentMonthTrades.length) return 300;
    const max = Math.max(...currentMonthTrades.map(d => Math.abs(d.pnl)));
    return Math.max(max, 100);
  }, [calendarDays]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (day: DayData) => {
    if (day.count > 0) {
      setSelectedDay(day);
    } else {
      navigate(`/journal?date=${day.dateStr}`);
    }
  };

  const navigateToJournalDate = (dateStr: string) => {
    navigate(`/journal?date=${dateStr}`);
  };

  // Cell heatmap background calculator
  const getCellStyles = (day: DayData) => {
    if (day.count === 0) {
      return {
        background: colors.inputBg,
        borderColor: colors.border,
        textColor: colors.textMuted,
      };
    }

    const intensity = Math.min(Math.abs(day.pnl) / maxAbsPnl, 1);

    if (day.pnl > 0) {
      const alpha = 0.08 + intensity * 0.22;
      const borderAlpha = 0.25 + intensity * 0.45;
      return {
        background: `rgba(16, 185, 129, ${alpha.toFixed(2)})`,
        borderColor: `rgba(16, 185, 129, ${borderAlpha.toFixed(2)})`,
        textColor: PROFIT,
      };
    }

    if (day.pnl < 0) {
      const alpha = 0.08 + intensity * 0.22;
      const borderAlpha = 0.25 + intensity * 0.45;
      return {
        background: `rgba(248, 113, 113, ${alpha.toFixed(2)})`,
        borderColor: `rgba(248, 113, 113, ${borderAlpha.toFixed(2)})`,
        textColor: LOSS_COLOR,
      };
    }

    return {
      background: 'rgba(96, 165, 250, 0.12)',
      borderColor: 'rgba(96, 165, 250, 0.4)',
      textColor: INFO,
    };
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all shadow-sm"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* ── Header Bar ── */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${WARNING}1f` }}
          >
            <Calendar size={18} style={{ color: WARNING }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>
                Trade Heatmap Calendar
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: WARNING, border: '1px solid rgba(245,158,11,0.25)' }}
              >
                TradeZella Style
              </span>
            </div>
            <h2 className="text-lg lg:text-xl leading-tight font-semibold" style={{ color: colors.text }}>
              {monthYearLabel}
            </h2>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg transition-colors hover:opacity-80 active:scale-95"
            style={{ color: colors.textMuted, background: colors.inputBg, border: `1px solid ${colors.border}` }}
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              color: WARNING,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg transition-colors hover:opacity-80 active:scale-95"
            style={{ color: colors.textMuted, background: colors.inputBg, border: `1px solid ${colors.border}` }}
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── Monthly Performance KPI Bar ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 px-5 py-3.5"
        style={{ borderBottom: `1px solid ${colors.border}`, background: colors.inputBg }}
      >
        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Net P&L</p>
          <p
            className="text-base font-bold mt-0.5"
            style={{ color: monthStats.totalPnL >= 0 ? PROFIT : LOSS_COLOR }}
          >
            {formatMoney(monthStats.totalPnL)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>
            {monthStats.winningDays}W - {monthStats.losingDays}L days
          </p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Win Rate</p>
          <p className="text-base font-bold mt-0.5" style={{ color: colors.text }}>
            {monthStats.winRate}%
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>
            {monthStats.wins}W / {monthStats.losses}L trades
          </p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Total Trades</p>
          <p className="text-base font-bold mt-0.5" style={{ color: colors.text }}>
            {monthStats.totalTrades}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>
            across {monthStats.tradingDaysCount} active days
          </p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Best Day</p>
          <p className="text-base font-bold mt-0.5" style={{ color: monthStats.bestDay > 0 ? PROFIT : colors.text }}>
            {monthStats.bestDay > 0 ? `+$${Math.round(monthStats.bestDay)}` : '$0'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>top daily gain</p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Worst Day</p>
          <p className="text-base font-bold mt-0.5" style={{ color: monthStats.worstDay < 0 ? LOSS_COLOR : colors.text }}>
            {monthStats.worstDay < 0 ? `-$${Math.abs(Math.round(monthStats.worstDay))}` : '$0'}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>max daily drawdown</p>
        </div>

        <div className="rounded-xl p-2.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px]" style={{ color: colors.textMuted }}>Patterns</p>
          <div className="flex items-center gap-2 mt-1">
            {monthStats.highVolumeDays > 0 ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(245,158,11,0.15)', color: WARNING }}
                title={`${monthStats.highVolumeDays} high volume days`}
              >
                <Flame size={11} /> {monthStats.highVolumeDays}
              </span>
            ) : null}
            {monthStats.mistakeDays > 0 ? (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', color: LOSS_COLOR }}
                title={`${monthStats.mistakeDays} mistake/revenge days`}
              >
                <AlertTriangle size={11} /> {monthStats.mistakeDays}
              </span>
            ) : null}
            {monthStats.highVolumeDays === 0 && monthStats.mistakeDays === 0 && (
              <span className="text-[11px] font-medium" style={{ color: PROFIT }}>
                Clean month
              </span>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: colors.textFaint }}>flags detected</p>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="p-4 lg:p-5 overflow-x-auto">
        <div className="min-w-[620px]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold py-1 uppercase tracking-wider"
                style={{ color: colors.textMuted }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 42-day Month Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const cellStyle = getCellStyles(day);
              const isSelected = selectedDay?.dateStr === day.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className="group relative rounded-xl p-2 min-h-[78px] sm:min-h-[86px] flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] hover:z-10 select-none"
                  style={{
                    background: cellStyle.background,
                    border: `1px solid ${isSelected ? WARNING : cellStyle.borderColor}`,
                    opacity: day.isCurrentMonth ? 1 : 0.25,
                    boxShadow: isSelected
                      ? `0 0 0 2px ${WARNING}, 0 4px 12px rgba(245,158,11,0.2)`
                      : day.isToday
                      ? `0 0 0 2px ${WARNING}`
                      : undefined,
                  }}
                  title={
                    day.count > 0
                      ? `${day.dateStr}: ${day.count} trade${day.count > 1 ? 's' : ''} | P&L: ${formatMoney(day.pnl)}`
                      : `${day.dateStr}: No trades (Click to journal)`
                  }
                >
                  {/* Top row: Day Number + Badges */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold leading-none"
                      style={{ color: day.isToday ? WARNING : day.isCurrentMonth ? colors.text : colors.textMuted }}
                    >
                      {day.date.getDate()}
                    </span>

                    <div className="flex items-center gap-1">
                      {day.isOvertrading && day.count > 0 && (
                        <span
                          className="flex items-center justify-center w-3.5 h-3.5 rounded-full"
                          style={{ background: 'rgba(245,158,11,0.2)', color: WARNING }}
                          title="High volume / potential overtrading"
                        >
                          <Flame size={9} />
                        </span>
                      )}

                      {day.isMistakeHeavy && day.count > 0 && (
                        <span
                          className="flex items-center justify-center w-3.5 h-3.5 rounded-full"
                          style={{ background: 'rgba(239,68,68,0.2)', color: LOSS_COLOR }}
                          title="Mistake / revenge trade detected"
                        >
                          <AlertTriangle size={9} />
                        </span>
                      )}

                      {day.count > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded font-medium"
                          style={{
                            background: day.isCurrentMonth ? 'rgba(255,255,255,0.08)' : colors.border,
                            color: colors.textSub,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {day.count}t
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom section: Win/Loss Dots + Net P&L */}
                  {day.count > 0 ? (
                    <div className="mt-auto pt-1">
                      <div className="flex items-center gap-0.5 mb-1 overflow-hidden">
                        {Array.from({ length: Math.min(day.wins, 4) }).map((_, i) => (
                          <div
                            key={`w${i}`}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: PROFIT }}
                          />
                        ))}
                        {Array.from({ length: Math.min(day.losses, 4) }).map((_, i) => (
                          <div
                            key={`l${i}`}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: LOSS_COLOR }}
                          />
                        ))}
                        {Array.from({ length: Math.min(day.breakevens, 2) }).map((_, i) => (
                          <div
                            key={`b${i}`}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: INFO }}
                          />
                        ))}
                        {day.count > 8 && (
                          <span className="text-[8px] leading-none ml-0.5" style={{ color: colors.textMuted }}>
                            +{day.count - 8}
                          </span>
                        )}
                      </div>

                      <p
                        className="text-xs sm:text-[13px] font-bold tracking-tight leading-none"
                        style={{ color: cellStyle.textColor }}
                      >
                        {formatMoney(day.pnl)}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-auto opacity-0 group-hover:opacity-60 transition-opacity">
                      <p className="text-[10px]" style={{ color: colors.textMuted }}>+ Log</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legend & Helper ── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs"
        style={{ borderTop: `1px solid ${colors.border}`, background: colors.inputBg }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(16,185,129,0.7)' }} />
            <span style={{ color: colors.textMuted }}>Profit Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: 'rgba(248,113,113,0.3)', border: '1px solid rgba(248,113,113,0.7)' }} />
            <span style={{ color: colors.textMuted }}>Loss Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />
            <span style={{ color: colors.textMuted }}>No Trades</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame size={12} style={{ color: WARNING }} />
            <span style={{ color: colors.textMuted }}>High Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} style={{ color: LOSS_COLOR }} />
            <span style={{ color: colors.textMuted }}>Mistake / Revenge</span>
          </div>
        </div>

        <p className="text-[11px]" style={{ color: colors.textFaint }}>
          Click any day to inspect trades or filter Journal
        </p>
      </div>

      {/* ── Day Details Modal ── */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                    {selectedDay.date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  {selectedDay.isToday && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(245,158,11,0.2)', color: WARNING }}
                    >
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                  {selectedDay.count} trade{selectedDay.count === 1 ? '' : 's'} recorded · Net P&L:{' '}
                  <span
                    className="font-semibold"
                    style={{ color: selectedDay.pnl >= 0 ? PROFIT : LOSS_COLOR }}
                  >
                    {formatMoney(selectedDay.pnl)}
                  </span>
                </p>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: colors.inputBg, color: colors.textMuted }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Daily Diagnostic Alerts */}
            {(selectedDay.isOvertrading || selectedDay.isMistakeHeavy) && (
              <div
                className="px-6 py-3 space-y-2"
                style={{ background: 'rgba(245,158,11,0.06)', borderBottom: `1px solid ${colors.border}` }}
              >
                {selectedDay.isOvertrading && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: WARNING }}>
                    <Flame size={14} className="shrink-0" />
                    <span>
                      <strong>High Trading Frequency:</strong> {selectedDay.count} trades taken today. Watch out for overtrading fatigue.
                    </span>
                  </div>
                )}
                {selectedDay.isMistakeHeavy && (
                  <div className="flex items-start gap-2 text-xs" style={{ color: LOSS_COLOR }}>
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Discipline Alert:</strong>{' '}
                      {selectedDay.mistakeReasons.length > 0
                        ? selectedDay.mistakeReasons.join(' · ')
                        : 'Multiple losses on this day. Replay entries before taking more risk.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of Trades on this Day */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {selectedDay.trades.map(trade => {
                const isWin = trade.result === 'WIN';
                const isLoss = trade.result === 'LOSS';
                const pnl = trade.pnl ?? 0;

                return (
                  <div
                    key={trade.id}
                    className="rounded-xl p-4 transition-all"
                    style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: colors.text }}>
                            {trade.pair}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: trade.orderType === 'Buy' ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.15)',
                              color: trade.orderType === 'Buy' ? PROFIT : LOSS_COLOR,
                            }}
                          >
                            {trade.orderType}
                          </span>
                          <span className="text-xs" style={{ color: colors.textMuted }}>
                            {trade.session} · {trade.strategy}
                          </span>
                        </div>
                        {trade.notes && (
                          <p className="text-xs mt-2 italic" style={{ color: colors.textSub }}>
                            &ldquo;{trade.notes}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          {isWin && <CheckCircle2 size={14} style={{ color: PROFIT }} />}
                          {isLoss && <XCircle size={14} style={{ color: LOSS_COLOR }} />}
                          <span
                            className="text-sm font-bold"
                            style={{ color: pnl >= 0 ? PROFIT : LOSS_COLOR }}
                          >
                            {trade.pnl !== undefined ? formatMoney(pnl) : 'Open'}
                          </span>
                        </div>
                        <span className="text-[11px]" style={{ color: colors.textMuted }}>
                          Score: {trade.score}/100 ({trade.decision})
                        </span>
                      </div>
                    </div>

                    {/* Screenshot indicators */}
                    {(trade.screenshotBefore || trade.screenshotAfter) && (
                      <div className="flex items-center gap-2 mt-3 pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                        <ImageIcon size={12} style={{ color: colors.textMuted }} />
                        <span className="text-[11px]" style={{ color: colors.textMuted }}>
                          Screenshots attached (Before: {trade.screenshotBefore ? 'Yes' : 'No'} | After: {trade.screenshotAfter ? 'Yes' : 'No'})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-between gap-3 px-6 py-4"
              style={{ borderTop: `1px solid ${colors.border}`, background: colors.surface }}
            >
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium hover:opacity-80 transition-all"
                style={{ background: colors.inputBg, border: `1px solid ${colors.border}`, color: colors.text }}
              >
                Close
              </button>

              <button
                onClick={() => {
                  const dateStr = selectedDay.dateStr;
                  setSelectedDay(null);
                  navigateToJournalDate(dateStr);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
                }}
              >
                <span>Open in Trade Journal</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradeCalendar;
