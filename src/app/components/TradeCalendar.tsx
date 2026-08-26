import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { Trade } from '../data/types';
import { useTheme } from '../data/ThemeContext';

interface TradeCalendarProps {
  trades: Trade[];
}

interface DayData {
  date: Date;
  trades: Trade[];
  pnl: number;
  wins: number;
  losses: number;
  count: number;
}

const PROFIT = '#10b981';
const LOSS_COLOR = '#f87171';
const WARNING = '#f59e0b';

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { colors } = useTheme();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: DayData[] = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.closedAt || trade.createdAt || trade.date)
          .toISOString()
          .split('T')[0];
        return tradeDate === dateStr;
      });

      const pnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const wins = dayTrades.filter(t => t.result === 'WIN').length;
      const losses = dayTrades.filter(t => t.result === 'LOSS').length;

      days.push({
        date: new Date(current),
        trades: dayTrades,
        pnl,
        wins,
        losses,
        count: dayTrades.length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, trades]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthStats = useMemo(() => {
    const monthTrades = calendarDays
      .filter(day => day.date.getMonth() === currentDate.getMonth())
      .flatMap(day => day.trades);

    const totalPnL = monthTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const wins = monthTrades.filter(t => t.result === 'WIN').length;
    const losses = monthTrades.filter(t => t.result === 'LOSS').length;
    const decided = monthTrades.filter(t => t.result === 'WIN' || t.result === 'LOSS').length;

    return {
      totalTrades: monthTrades.length,
      totalPnL,
      wins,
      losses,
      winRate: decided > 0 ? ((wins / decided) * 100).toFixed(0) : '0',
    };
  }, [calendarDays, currentDate]);

  const tradingDays = calendarDays.filter(
    d => d.count > 0 && d.date.getMonth() === currentDate.getMonth()
  ).length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${WARNING}1f` }}>
            <Calendar size={17} style={{ color: WARNING }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: colors.textMuted }}>Trade Calendar</p>
            <h2 className="text-lg leading-tight" style={{ color: colors.text }}>{monthYear}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goToPreviousMonth} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.textMuted }}>
            <ChevronLeft size={18} />
          </button>
          <button onClick={goToToday} className="px-3 py-1 text-xs rounded-lg transition-colors hover:opacity-80" style={{ color: WARNING }}>
            Today
          </button>
          <button onClick={goToNextMonth} className="p-2 rounded-lg transition-colors hover:opacity-80" style={{ color: colors.textMuted }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        {[
          { label: 'Trades', value: `${monthStats.totalTrades}`, sub: `${tradingDays} days` },
          { label: 'Net P&L', value: `${monthStats.totalPnL >= 0 ? '+' : ''}$${Math.round(monthStats.totalPnL).toLocaleString()}`, color: monthStats.totalPnL >= 0 ? PROFIT : LOSS_COLOR },
          { label: 'Win Rate', value: `${monthStats.winRate}%` },
          { label: 'W / L', value: `${monthStats.wins}W / ${monthStats.losses}L` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-3" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }}>
            <p className="text-xs" style={{ color: colors.textMuted }}>{stat.label}</p>
            <p className="text-sm mt-1" style={{ color: (stat as any).color || colors.text }}>{stat.value}</p>
            {(stat as any).sub && <p className="text-xs mt-0.5" style={{ color: colors.textFaint }}>{(stat as any).sub}</p>}
          </div>
        ))}
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs py-1" style={{ color: colors.textMuted }}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = day.date.getMonth() === currentDate.getMonth();
            const isToday = day.date.toDateString() === new Date().toDateString();
            const hasProfit = day.count > 0 && day.pnl > 0;
            const hasLoss = day.count > 0 && day.pnl < 0;
            const isBreakeven = day.count > 0 && day.pnl === 0;

            let cellBg = colors.inputBg;
            let cellBorder = colors.border;
            if (hasProfit) {
              cellBg = 'rgba(16,185,129,0.08)';
              cellBorder = 'rgba(16,185,129,0.3)';
            } else if (hasLoss) {
              cellBg = 'rgba(248,113,113,0.08)';
              cellBorder = 'rgba(248,113,113,0.3)';
            } else if (isBreakeven) {
              cellBg = 'rgba(96,165,250,0.08)';
              cellBorder = 'rgba(96,165,250,0.3)';
            }

            return (
              <div
                key={idx}
                className="rounded-lg p-1.5 min-h-[68px] flex flex-col justify-between transition-all"
                style={{
                  background: cellBg,
                  border: `1px solid ${cellBorder}`,
                  opacity: isCurrentMonth ? 1 : 0.3,
                  boxShadow: isToday ? `0 0 0 2px ${WARNING}` : undefined,
                }}
                title={day.count > 0 ? `${day.count} trade${day.count > 1 ? 's' : ''} · P&L: $${day.pnl.toFixed(2)}` : ''}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: isToday ? WARNING : colors.textSub }}>
                    {day.date.getDate()}
                  </span>
                  {day.count > 0 && (
                    <span className="text-[10px] px-1 rounded" style={{ background: `${colors.border}`, color: colors.textMuted }}>
                      {day.count}
                    </span>
                  )}
                </div>

                {day.count > 0 && (
                  <div className="mt-auto">
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: Math.min(day.wins, 5) }).map((_, i) => (
                        <div key={`w${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: PROFIT }} />
                      ))}
                      {Array.from({ length: Math.min(day.losses, 5) }).map((_, i) => (
                        <div key={`l${i}`} className="w-1.5 h-1.5 rounded-full" style={{ background: LOSS_COLOR }} />
                      ))}
                    </div>
                    <p className="text-[11px] leading-none" style={{ color: day.pnl >= 0 ? PROFIT : LOSS_COLOR }}>
                      {day.pnl >= 0 ? '+' : ''}{Math.round(day.pnl)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 px-5 py-3 text-xs" style={{ borderTop: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)' }} />
          <span style={{ color: colors.textMuted }}>Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)' }} />
          <span style={{ color: colors.textMuted }}>Loss</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: colors.inputBg, border: `1px solid ${colors.border}` }} />
          <span style={{ color: colors.textMuted }}>No trades</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: WARNING, boxShadow: `0 0 0 2px ${WARNING}40` }} />
          <span style={{ color: colors.textMuted }}>Today</span>
        </div>
      </div>
    </div>
  );
}

export default TradeCalendar;
