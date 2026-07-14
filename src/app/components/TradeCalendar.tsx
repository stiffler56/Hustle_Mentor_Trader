import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trade } from '../data/types';

interface TradeCalendarProps {
  trades: Trade[];
}

interface DayData {
  date: Date;
  trades: Trade[];
  pnl: number;
  count: number;
}

export function TradeCalendar({ trades }: TradeCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    // Starting Sunday
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: DayData[] = [];
    const current = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dateStr = current.toISOString().split('T')[0];
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.closedAt || trade.createdAt || trade.date)
          .toISOString()
          .split('T')[0];
        return tradeDate === dateStr;
      });

      const pnl = dayTrades.reduce((sum, trade) => {
        const profit = (trade.profit || 0) - (trade.loss || 0);
        return sum + profit;
      }, 0);

      days.push({
        date: new Date(current),
        trades: dayTrades,
        pnl,
        count: dayTrades.length,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate, trades]);

  // Week days header
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Month/Year navigation
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

  // Get color based on P&L
  const getDayColor = (pnl: number, count: number) => {
    if (count === 0) return 'bg-slate-800';
    if (pnl > 0) return 'bg-emerald-900/40 border border-emerald-700/50';
    if (pnl < 0) return 'bg-red-900/40 border border-red-700/50';
    return 'bg-slate-800';
  };

  const getTextColor = (pnl: number) => {
    if (pnl > 0) return 'text-emerald-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-lg border border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trading Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-amber-400 hover:bg-slate-800 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Month/Year display */}
      <div className="text-center mb-4">
        <p className="text-lg font-semibold text-white">{monthYear}</p>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth =
              day.date.getMonth() === currentDate.getMonth();
            const isToday =
              day.date.toDateString() === new Date().toDateString();

            return (
              <div
                key={idx}
                className={`
                  aspect-square p-2 rounded-lg cursor-pointer transition-all
                  ${getDayColor(day.pnl, day.count)}
                  ${isToday ? 'ring-2 ring-amber-400' : ''}
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  hover:scale-105 hover:shadow-lg
                `}
                title={`${day.count} trades • P&L: $${day.pnl.toFixed(2)}`}
              >
                <div className="h-full flex flex-col justify-between">
                  {/* Date number */}
                  <div className="text-xs font-semibold text-slate-300">
                    {day.date.getDate()}
                  </div>

                  {/* Trade count and P&L */}
                  <div className="space-y-0.5">
                    {day.count > 0 && (
                      <>
                        <div className="text-xs text-slate-400">
                          {day.count} {day.count === 1 ? 'trade' : 'trades'}
                        </div>
                        <div
                          className={`text-xs font-bold ${getTextColor(
                            day.pnl
                          )}`}
                        >
                          {day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(0)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-900/40 border border-emerald-700/50" />
          <span className="text-slate-400">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-900/40 border border-red-700/50" />
          <span className="text-slate-400">Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-800" />
          <span className="text-slate-400">No trades</span>
        </div>
      </div>
    </div>
  );
}

export default TradeCalendar;