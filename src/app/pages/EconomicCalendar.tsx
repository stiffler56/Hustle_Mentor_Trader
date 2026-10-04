import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  AlertTriangle,
  TrendingUp,
  Globe,
  Flame,
  ChevronDown,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useTheme } from '../data/ThemeContext';

interface EconomicEvent {
  id: string;
  time: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  forecast: string;
  previous: string;
  actual?: string;
  isPast?: boolean;
}

const EVENTS: EconomicEvent[] = [
  {
    id: 'ev-1',
    time: '13:30',
    currency: 'USD',
    impact: 'HIGH',
    title: 'Core CPI (MoM)',
    forecast: '0.3%',
    previous: '0.3%',
    actual: '0.2%',
    isPast: true,
  },
  {
    id: 'ev-2',
    time: '13:30',
    currency: 'USD',
    impact: 'HIGH',
    title: 'CPI (YoY)',
    forecast: '2.9%',
    previous: '3.1%',
    actual: '2.8%',
    isPast: true,
  },
  {
    id: 'ev-3',
    time: '14:45',
    currency: 'USD',
    impact: 'MEDIUM',
    title: 'Flash Manufacturing PMI',
    forecast: '51.2',
    previous: '50.7',
    actual: '51.5',
    isPast: true,
  },
  {
    id: 'ev-4',
    time: '18:00',
    currency: 'USD',
    impact: 'HIGH',
    title: 'FOMC Meeting Minutes',
    forecast: '—',
    previous: '—',
    isPast: false,
  },
  {
    id: 'ev-5',
    time: '09:00',
    currency: 'EUR',
    impact: 'HIGH',
    title: 'ECB Monetary Policy Statement',
    forecast: '3.25%',
    previous: '3.50%',
    isPast: false,
  },
  {
    id: 'ev-6',
    time: '10:30',
    currency: 'GBP',
    impact: 'HIGH',
    title: 'BoE Official Bank Rate',
    forecast: '4.75%',
    previous: '5.00%',
    isPast: false,
  },
  {
    id: 'ev-7',
    time: '14:30',
    currency: 'USD',
    impact: 'HIGH',
    title: 'Non-Farm Employment Change (NFP)',
    forecast: '175K',
    previous: '142K',
    isPast: false,
  },
  {
    id: 'ev-8',
    time: '14:30',
    currency: 'USD',
    impact: 'MEDIUM',
    title: 'Unemployment Rate',
    forecast: '4.2%',
    previous: '4.3%',
    isPast: false,
  },
];

export default function EconomicCalendar() {
  const { isDayMode } = useTheme();
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((ev) => {
      if (currencyFilter !== 'ALL' && ev.currency !== currencyFilter) return false;
      if (impactFilter !== 'ALL' && ev.impact !== impactFilter) return false;
      if (searchQuery && !ev.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [currencyFilter, impactFilter, searchQuery]);

  const upcomingHighImpact = EVENTS.find((ev) => ev.impact === 'HIGH' && !ev.isPast);

  const cardBg = isDayMode ? 'bg-white border-[#E5E4E2] text-[#111827]' : 'bg-[#131418] border-[#1E2026] text-white';
  const subCardBg = isDayMode ? 'bg-[#F9FAFB] border-[#E5E4E2]' : 'bg-[#0F1013] border-[#1E2026]';
  const textPrimary = isDayMode ? 'text-[#111827]' : 'text-white';
  const textSecondary = isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]';

  return (
    <div className={`p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6 min-h-full font-sans ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#6B7280] dark:text-[#8E95A5] mb-1">
            <span>Trading Utilities</span>
            <span className="text-[#9CA3AF]">/</span>
            <span className={`font-semibold ${textPrimary}`}>Economic Calendar</span>
          </div>
          <h1 className={`text-2xl lg:text-3xl font-black tracking-tight ${textPrimary}`}>
            Economic Calendar
          </h1>
          <p className={`text-sm mt-1 ${textSecondary}`}>
            High-impact macro events, central bank releases, and news volatility filters.
          </p>
        </div>

        {upcomingHighImpact && (
          <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs ${
            isDayMode
              ? 'bg-[#FEE2E2] border-[#FCA5A5] text-[#DC2626]'
              : 'bg-[#2D1416] border-[#4C1D24] text-[#F87171]'
          }`}>
            <AlertTriangle size={16} className={isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'} />
            <div>
              <span className={`font-semibold ${isDayMode ? 'text-[#DC2626]' : 'text-[#F87171]'}`}>
                Warning: {upcomingHighImpact.title} ({upcomingHighImpact.currency})
              </span>
              <span className={`block sm:inline sm:ml-2 ${textSecondary}`}>
                Approaching at {upcomingHighImpact.time} GMT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className={`rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs border ${cardBg}`}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Pills */}
          <div className={`flex items-center rounded-lg p-0.5 border ${subCardBg}`}>
            {['ALL', 'USD', 'EUR', 'GBP', 'JPY'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrencyFilter(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  currencyFilter === c
                    ? isDayMode ? 'bg-white text-[#5D5FEF] shadow-xs' : 'bg-[#1E2026] text-white shadow-xs'
                    : textSecondary
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Impact Selector */}
          <div className={`flex items-center rounded-lg p-0.5 border ${subCardBg}`}>
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((imp) => (
              <button
                key={imp}
                type="button"
                onClick={() => setImpactFilter(imp)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  impactFilter === imp
                    ? isDayMode ? 'bg-white text-[#5D5FEF] shadow-xs' : 'bg-[#1E2026] text-white shadow-xs'
                    : textSecondary
                }`}
              >
                {imp === 'ALL' ? 'All Impacts' : imp}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search economic releases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none focus:border-[#5D5FEF] ${
              isDayMode
                ? 'bg-[#F9FAFB] border-[#E5E4E2] text-[#111827] placeholder:text-[#9CA3AF]'
                : 'bg-[#0F1013] border-[#1E2026] text-white placeholder:text-[#525866]'
            }`}
          />
        </div>
      </div>

      {/* Events Table */}
      <div className={`rounded-xl overflow-hidden shadow-xs border ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`border-b text-[10px] font-bold uppercase tracking-wider ${
              isDayMode ? 'bg-[#FAFAFA] border-[#E5E4E2] text-[#6B7280]' : 'bg-[#0F1013] border-[#1E2026] text-[#8E95A5]'
            }`}>
              <tr>
                <th className="py-3 px-4">Time (GMT)</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Impact</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Actual</th>
                <th className="py-3 px-4">Forecast</th>
                <th className="py-3 px-4">Previous</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${isDayMode ? 'divide-[#E5E4E2]' : 'divide-[#1E2026]'}`}>
              {filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className={`transition-colors ${isDayMode ? 'hover:bg-[#F9FAFB]' : 'hover:bg-[#181A20]'}`}
                >
                  <td className={`py-3.5 px-4 font-mono text-xs ${textSecondary}`}>
                    {ev.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`font-bold text-xs px-2 py-0.5 rounded border font-mono ${
                      isDayMode ? 'bg-[#F2F1EF] border-[#E5E4E2] text-[#111827]' : 'bg-[#0F1013] border-[#1E2026] text-white'
                    }`}>
                      {ev.currency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ev.impact === 'HIGH'
                          ? isDayMode
                            ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                            : 'bg-[#2D1416] text-[#F87171] border-[#4C1D24]'
                          : ev.impact === 'MEDIUM'
                          ? isDayMode
                            ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                            : 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                          : isDayMode
                          ? 'bg-[#F2F1EF] text-[#6B7280] border-[#E5E4E2]'
                          : 'bg-[#181A20] text-[#8E95A5] border-[#1E2026]'
                      }`}
                    >
                      {ev.impact}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-semibold ${textPrimary}`}>
                    {ev.title}
                  </td>
                  <td className={`py-3.5 px-4 font-mono text-xs font-bold ${textPrimary}`}>
                    {ev.actual || '—'}
                  </td>
                  <td className={`py-3.5 px-4 font-mono text-xs ${textSecondary}`}>
                    {ev.forecast}
                  </td>
                  <td className={`py-3.5 px-4 font-mono text-xs ${textSecondary}`}>
                    {ev.previous}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
