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

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>Trading Utilities</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">Economic Calendar</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Economic Calendar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            High-impact macro events, central bank releases, and news volatility filters.
          </p>
        </div>

        {upcomingHighImpact && (
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <AlertTriangle size={16} className="text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                Warning: {upcomingHighImpact.title} ({upcomingHighImpact.currency})
              </span>
              <span className="text-slate-500 dark:text-slate-400 block sm:inline sm:ml-2">
                Approaching at {upcomingHighImpact.time} GMT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Pills */}
          <div className="flex items-center rounded-lg p-0.5 bg-slate-100 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800">
            {['ALL', 'USD', 'EUR', 'GBP', 'JPY'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrencyFilter(c)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  currencyFilter === c
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Impact Selector */}
          <div className="flex items-center rounded-lg p-0.5 bg-slate-100 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((imp) => (
              <button
                key={imp}
                type="button"
                onClick={() => setImpactFilter(imp)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  impactFilter === imp
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {imp === 'ALL' ? 'All Impacts' : imp}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search economic releases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#0D121F] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-[#121826] border border-slate-200 dark:border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-[#0D121F] border-b border-slate-200 dark:border-[#1E293B] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#151D2E]/60 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {ev.time}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {ev.currency}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        ev.impact === 'HIGH'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                          : ev.impact === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                      }`}
                    >
                      {ev.impact}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                    {ev.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-950 dark:text-white">
                    {ev.actual || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {ev.forecast}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
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
