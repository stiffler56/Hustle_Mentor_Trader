import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  BarChart3,
  Wrench,
  Radio,
  PlayCircle,
  Bot,
  Calendar,
  Link2,
  Flame,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  RefreshCw,
  LogOut,
  Loader2,
  Plus,
  Sparkles,
  CheckCircle2,
  Sun,
  Moon,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useAuthContext } from '../data/AuthContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade } from '../data/types';
import { QuickTradeModal } from './prop-firm/QuickTradeModal';

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
  aliasPaths?: string[];
  badgeType?: 'accounts' | 'trades' | 'challenge';
}

const NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Layers, badgeType: 'accounts', aliasPaths: ['/prop-firm', '/prop-accounts'] },
  { to: '/journal', label: 'Journal', icon: BookOpen, badgeType: 'trades' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, aliasPaths: ['/advanced-analytics'] },
  { to: '/tools/scorer', label: 'Trade Scorer', icon: Wrench, aliasPaths: ['/scorer'] },
  { to: '/utilities/copier', label: 'Trade Copier', icon: Radio },
  { to: '/utilities/replay', label: 'Trade Replay', icon: PlayCircle, aliasPaths: ['/replay'] },
  { to: '/utilities/mentor', label: 'AI Mentor', icon: Bot, aliasPaths: ['/ai-mentor'] },
  { to: '/utilities/calendar', label: 'Economic Calendar', icon: Calendar },
  { to: '/challenge', label: 'Challenge', icon: Flame, badgeType: 'challenge' },
  { to: '/broker-integration', label: 'Broker Sync', icon: Link2, aliasPaths: ['/broker'] },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trades, syncNow, isBrokerSyncing } = useTradesContext();
  const { challenge, dayNumber } = useChallengeContext();
  const { accounts, selectedAccount, setSelectedAccountId } = usePropAccountsContext();
  const { isDayMode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [dateRangeText, setDateRangeText] = useState('This Month');
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [currencyMode, setCurrencyMode] = useState<'$' | '%'>('$');

  const accountRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openTrades = trades.filter((t) => t.status === 'OPEN').length;

  const isItemActive = (to: string, aliasPaths?: string[]) => {
    if (to === '/') return location.pathname === '/';
    if (location.pathname === to || location.pathname.startsWith(`${to}/`)) return true;
    if (
      aliasPaths &&
      aliasPaths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))
    ) {
      return true;
    }
    return false;
  };

  const activeAccountLabel = selectedAccount
    ? `${selectedAccount.accountNumber} • $${Math.round(selectedAccount.initialBalance / 1000)}k ${selectedAccount.propDetails?.phase || 'Active'}`
    : accounts[0]
    ? `${accounts[0].accountNumber} • $${Math.round(accounts[0].initialBalance / 1000)}k`
    : 'FundingPips #20823275 • $50k';

  return (
    <div className={`flex h-screen overflow-hidden ${isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'}`}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Navigation Sidebar (TradeZella Slim Left Strip with Violet Accents) ── */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 lg:translate-x-0 ${
          isDayMode
            ? 'bg-white border-r border-[#E5E4E2]'
            : 'bg-[#0B0C0E] border-r border-[#1E2026]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 72, flexShrink: 0 }}
      >
        {/* Brand Icon / Logo */}
        <div className="flex flex-col items-center justify-center py-4 border-b border-[#E5E4E2] dark:border-[#1E2026]">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5D5FEF] shadow-md shadow-indigo-500/20 text-white cursor-pointer" onClick={() => navigate('/')}>
            <TrendingUp size={18} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-[#5D5FEF] mt-1.5 font-mono">
            CYPHER
          </span>
          <button className="mt-2 lg:hidden text-[#6B7280] dark:text-[#8E95A5]" onClick={() => setMobileOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Icon Navigation Items */}
        <nav className="flex-1 py-3 px-2 flex flex-col items-center gap-2 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, badgeType, aliasPaths }) => {
            const active = isItemActive(to, aliasPaths);
            return (
              <NavLink
                key={to}
                to={to}
                title={label}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
                  active
                    ? 'bg-[#5D5FEF] text-white shadow-md shadow-indigo-500/25'
                    : isDayMode
                    ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
                    : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
                }`}
              >
                <Icon size={19} />
                {badgeType === 'trades' && openTrades > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#059669] ring-2 ring-white dark:ring-[#0B0C0E]" />
                )}
                {badgeType === 'challenge' && challenge.isActive && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full bg-[#5D5FEF] text-white">
                    {dayNumber}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Theme Mode Switcher Pill */}
        <div className="p-3 flex flex-col items-center border-t border-[#E5E4E2] dark:border-[#1E2026]">
          <button
            type="button"
            onClick={toggleTheme}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isDayMode
                ? 'bg-[#F2F1EF] text-[#111827] hover:bg-[#E5E4E2]'
                : 'bg-[#131418] text-white hover:bg-[#181A20]'
            }`}
          >
            {isDayMode ? <Sun size={17} className="text-[#5D5FEF]" /> : <Moon size={17} className="text-[#6366F1]" />}
          </button>
        </div>
      </aside>

      {/* ── Main App Content ── */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isDayMode ? 'bg-[#EBEAE8]' : 'bg-[#0B0C0E]'}`}>
        {/* Universal Top Header Bar */}
        <header
          className={`h-14 border-b px-4 lg:px-6 flex items-center justify-between shrink-0 z-30 transition-colors ${
            isDayMode
              ? 'bg-white border-[#E5E4E2] text-[#111827]'
              : 'bg-[#0B0C0E] border-[#1E2026] text-white'
          }`}
        >
          {/* Left Title / Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg lg:hidden text-[#6B7280] hover:text-[#111827] dark:text-[#8E95A5] dark:hover:text-white"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5D5FEF]">
                Cypher Terminal
              </span>
              <span className="text-[#9CA3AF] text-xs">/</span>
              <span className="text-xs font-medium text-[#6B7280] dark:text-[#8E95A5]">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right Utility Pill Cluster */}
          <div className="flex items-center gap-2.5">
            {/* 1. Date ▾ Selector Pill */}
            <div className="relative" ref={dateRef}>
              <button
                type="button"
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shadow-xs ${
                  isDayMode
                    ? 'bg-white border-[#E5E4E2] text-[#111827] hover:bg-[#F7F7F6]'
                    : 'bg-[#131418] border-[#1E2026] text-white hover:bg-[#181A20]'
                }`}
              >
                <span>{dateRangeText}</span>
                <ChevronDown size={13} className="opacity-60" />
              </button>

              {dateDropdownOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-40 rounded-xl py-1.5 border shadow-xl z-50 ${
                    isDayMode
                      ? 'bg-white border-[#E5E4E2] text-[#111827]'
                      : 'bg-[#131418] border-[#1E2026] text-white'
                  }`}
                >
                  {['Today', 'This Week', 'This Month', 'Last 30 Days', 'All Time'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDateRangeText(d);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center justify-between ${
                        dateRangeText === d
                          ? 'text-[#5D5FEF] font-bold bg-[#EEF0FF] dark:bg-[#181A20]'
                          : isDayMode
                          ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F7F6]'
                          : 'text-[#8E95A5] hover:text-white hover:bg-[#181A20]'
                      }`}
                    >
                      <span>{d}</span>
                      {dateRangeText === d && <CheckCircle2 size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Accounts ▾ Dropdown Pill */}
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shadow-xs max-w-[210px] truncate ${
                  isDayMode
                    ? 'bg-white border-[#E5E4E2] text-[#111827] hover:bg-[#F7F7F6]'
                    : 'bg-[#131418] border-[#1E2026] text-white hover:bg-[#181A20]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                <span className="truncate">{activeAccountLabel}</span>
                <ChevronDown size={13} className="opacity-60 shrink-0" />
              </button>

              {accountDropdownOpen && (
                <div
                  className={`absolute right-0 mt-1.5 w-64 rounded-xl py-1.5 border shadow-xl z-50 ${
                    isDayMode
                      ? 'bg-white border-[#E5E4E2] text-[#111827]'
                      : 'bg-[#131418] border-[#1E2026] text-white'
                  }`}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider border-b border-[#E5E4E2] dark:border-[#1E2026]">
                    Select Account
                  </div>
                  {accounts.map((acc) => {
                    const isSelected = selectedAccount?.id === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setAccountDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-[#EEF0FF] text-[#5D5FEF] font-bold dark:bg-[#181A20] dark:text-[#6366F1]'
                            : isDayMode
                            ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F7F6]'
                            : 'text-[#8E95A5] hover:text-white hover:bg-[#181A20]'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate font-medium">{acc.name || acc.accountNumber}</p>
                          <p className="text-[10px] text-[#9CA3AF]">
                            {acc.accountNumber} • ${Math.round(acc.initialBalance / 1000)}k
                          </p>
                        </div>
                        {isSelected && <CheckCircle2 size={13} className="text-[#5D5FEF] shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Currency / Unit Toggles (G, $, %) & Refresh */}
            <div
              className={`flex items-center rounded-lg p-0.5 border ${
                isDayMode
                  ? 'bg-white border-[#E5E4E2] text-[#6B7280]'
                  : 'bg-[#131418] border-[#1E2026] text-[#8E95A5]'
              }`}
            >
              <button
                type="button"
                onClick={() => setCurrencyMode('$')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  currencyMode === '$'
                    ? isDayMode
                      ? 'bg-[#EEF0FF] text-[#5D5FEF]'
                      : 'bg-[#1E2026] text-white'
                    : 'hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                $
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('%')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  currencyMode === '%'
                    ? isDayMode
                      ? 'bg-[#EEF0FF] text-[#5D5FEF]'
                      : 'bg-[#1E2026] text-white'
                    : 'hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => syncNow()}
                title="Refresh and sync data"
                className="p-1 hover:text-[#5D5FEF] transition-colors ml-0.5"
              >
                <RefreshCw size={12} className={isBrokerSyncing ? 'animate-spin text-[#5D5FEF]' : ''} />
              </button>
            </div>

            {/* 4. Primary CTA: "Ask Cypher / + Log Trade" in Vibrant Purple */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/utilities/mentor')}
                className={`hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  isDayMode
                    ? 'bg-white hover:bg-[#F7F7F6] border-[#E5E4E2] text-[#5D5FEF]'
                    : 'bg-[#181A20] hover:bg-[#1E2026] border-[#1E2026] text-white'
                }`}
                title="Ask Cypher AI Coach"
              >
                <Sparkles size={13} className="text-[#5D5FEF]" />
                <span>Ask Cypher</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickTradeOpen(true)}
                className="bg-[#5D5FEF] hover:bg-[#4F51D8] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>+ Log Trade</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <QuickTradeModal
        account={selectedAccount}
        isOpen={isQuickTradeOpen}
        onClose={() => setIsQuickTradeOpen(false)}
      />
    </div>
  );
}
export default Layout;

