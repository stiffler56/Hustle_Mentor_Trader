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

      // Calculate daily P&L
      const pnl = dayTrades.reduce((sum, trade) => {
        return sum + (trade.pnl || 0);
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
    if (count === 0) return 'bg-gray-700 border border-gray-600';
    if (pnl > 0) return 'bg-green-900 border-2 border-green-500';
    if (pnl < 0) return 'bg-red-900 border-2 border-red-500';
    return 'bg-gray-700 border border-gray-600';
  };

  const getTextColor = (pnl: number) => {
    if (pnl > 0) return 'text-green-300';
    if (pnl < 0) return 'text-red-300';
    return 'text-gray-400';
  };

  // Calculate month stats
  const monthStats = useMemo(() => {
    const monthTrades = calendarDays
      .filter(day => day.date.getMonth() === currentDate.getMonth())
      .flatMap(day => day.trades);
    
    const totalPnL = monthTrades.reduce((sum, trade) => {
      return sum + (trade.pnl || 0);
    }, 0);

    const wins = monthTrades.filter(t => t.result === 'WIN').length;
    const losses = monthTrades.filter(t => t.result === 'LOSS').length;

    return {
      totalTrades: monthTrades.length,
      totalPnL,
      wins,
      losses,
      winRate: monthTrades.length > 0 ? ((wins / monthTrades.length) * 100).toFixed(1) : '0',
    };
  }, [calendarDays, currentDate]);

  return (
    <div className="w-full rounded-2xl border border-gray-700 p-6" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Trading Calendar</h2>
          <p className="text-sm text-gray-400 mt-1">{monthYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-amber-400 hover:bg-gray-700 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Month Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Total Trades</p>
          <p className="text-lg font-bold text-white">{monthStats.totalTrades}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Total P&L</p>
          <p className={`text-lg font-bold ${monthStats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {monthStats.totalPnL >= 0 ? '+' : ''}${monthStats.totalPnL.toFixed(0)}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">Win Rate</p>
          <p className="text-lg font-bold text-white">{monthStats.winRate}%</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400">W/L</p>
          <p className="text-lg font-bold text-white">{monthStats.wins}W / {monthStats.losses}L</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-3">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-400 py-2"
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
                  ${isToday ? 'ring-2 ring-amber-400 ring-offset-2' : ''}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  hover:scale-105 hover:shadow-lg
                `}
                title={`${day.count} trades • P&L: $${day.pnl.toFixed(2)}`}
              >
                <div className="h-full flex flex-col justify-between">
                  {/* Date number */}
                  <div className="text-xs font-bold text-white">
                    {day.date.getDate()}
                  </div>

                  {/* Trade count and P&L */}
                  <div className="space-y-0.5">
                    {day.count > 0 && (
                      <>
                        <div className="text-xs text-gray-300">
                          {day.count}T
                        </div>
                        <div
                          className={`text-xs font-bold ${getTextColor(
                            day.pnl
                          )}`}
                        >
                          {day.pnl >= 0 ? '+' : ''}${Math.abs(day.pnl).toFixed(0)}
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
      <div className="mt-6 flex items-center justify-center gap-8 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-900 border-2 border-green-500" />
          <span className="text-gray-400">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-900 border-2 border-red-500" />
          <span className="text-gray-400">Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-700 border border-gray-600" />
          <span className="text-gray-400">No trades</span>
        </div>
      </div>

      {/* Debug info */}
      {trades.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded text-xs text-yellow-400">
          ℹ️ No trades yet. Add some trades to see them on the calendar!
        </div>
      )}
    </div>
  );
}

export default TradeCalendar;
