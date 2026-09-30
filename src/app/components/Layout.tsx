import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
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
  ChevronUp,
  ChevronRight,
  TrendingUp,
  Menu,
  X,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useAuthContext } from '../data/AuthContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import { useTheme } from '../data/ThemeContext';
import type { Trade } from '../data/types';

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
  aliasPaths?: string[];
  badgeType?: 'accounts' | 'trades' | 'challenge';
}

const MAIN_NAV_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Layers, badgeType: 'accounts', aliasPaths: ['/prop-firm', '/prop-accounts'] },
  { to: '/journal', label: 'Journal', icon: BookOpen, badgeType: 'trades' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, aliasPaths: ['/advanced-analytics'] },
];

const UTILITY_NAV_ITEMS: NavItemConfig[] = [
  { to: '/tools/scorer', label: 'Tools / Trade Scorer', icon: Wrench, aliasPaths: ['/scorer'] },
  { to: '/utilities/copier', label: 'Trade Copier', icon: Radio },
  { to: '/utilities/replay', label: 'Trade Replay', icon: PlayCircle, aliasPaths: ['/replay'] },
  { to: '/utilities/mentor', label: 'AI Mentor', icon: Bot, aliasPaths: ['/ai-mentor'] },
  { to: '/utilities/calendar', label: 'Economic Calendar', icon: Calendar },
];

const SECONDARY_NAV_ITEMS: NavItemConfig[] = [
  { to: '/broker-integration', label: 'Broker Integration', icon: Link2, aliasPaths: ['/broker'] },
  { to: '/challenge', label: '30-Day Challenge', icon: Flame, badgeType: 'challenge' },
];

function EdgeCard({ trades }: { trades: Trade[] }) {
  const { colors } = useTheme();
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.result);
  const nyTrades = closed.filter((t) => t.session === 'New York');
  const nyWins = nyTrades.filter((t) => t.result === 'WIN').length;
  const nyWR = nyTrades.length ? Math.round((nyWins / nyTrades.length) * 100) : 0;

  const highFocus = closed.filter((t) => t.mentalFocus >= 20);
  const hfWins = highFocus.filter((t) => t.result === 'WIN').length;
  const hfWR = highFocus.length ? Math.round((hfWins / highFocus.length) * 100) : 0;

  return (
    <div
      className="mx-3 mb-2 rounded-xl p-3"
      style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
    >
      <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: '#3B82F6' }}>
        Your Edge
      </p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>XAUUSD NY Session</span>
          <span style={{ color: '#10B981' }}>{nyWR}% WR</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>Focus 20+ trades</span>
          <span style={{ color: '#10B981' }}>{hfWR}% WR</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>Best Strategy</span>
          <span style={{ color: '#3B82F6' }}>D1/H4 FVG</span>
        </div>
      </div>
    </div>
  );
}

// ─── Cloud Sync Panel ──────────────────────────────────────────────────────
function CloudSyncPanel() {
  const { colors } = useTheme();
  const { isAuthenticated, userEmail, logout } = useAuthContext();
  const { syncStatus, lastSynced, syncNow, syncError } = useTradesContext();

  const fmt = (d: Date | null) => {
    if (!d) return '';
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 10) return 'Just now';
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const dot =
    syncStatus === 'synced'
      ? { color: '#10b981', label: 'Synced', pulse: false }
      : syncStatus === 'syncing'
      ? { color: '#3b82f6', label: 'Syncing…', pulse: true }
      : syncStatus === 'error'
      ? { color: '#ef4444', label: 'Error', pulse: false }
      : { color: '#64748b', label: 'Offline', pulse: false };

  if (!isAuthenticated) return null;

  return (
    <div
      className="mx-3 mb-2 rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}
    >
      {/* Row 1: email + actions */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${dot.pulse ? 'animate-pulse' : ''}`}
            style={{ background: dot.color }}
          />
          <p className="text-xs truncate font-medium" style={{ color: colors.textSub }}>
            {userEmail}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            onClick={syncNow}
            title="Sync now"
            disabled={syncStatus === 'syncing'}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            <RefreshCw
              size={11}
              style={{ color: colors.textSub }}
              className={syncStatus === 'syncing' ? 'animate-spin' : ''}
            />
          </button>
          <button onClick={logout} title="Sign out" className="opacity-50 hover:opacity-100 transition-opacity">
            <LogOut size={11} style={{ color: colors.textSub }} />
          </button>
        </div>
      </div>
      {/* Row 2: status */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: dot.color }}>
          {dot.label}
        </span>
        {lastSynced && <span className="text-xs" style={{ color: colors.textFaint }}>{fmt(lastSynced)}</span>}
      </div>
      {syncStatus === 'error' && syncError && (
        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
          {syncError}
        </p>
      )}
    </div>
  );
}

// ── Loading overlay while trades are being fetched ─────────────────────────
function TradesLoadingBanner() {
  const { tradesLoading } = useTradesContext();
  if (!tradesLoading) return null;
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 text-xs font-medium"
      style={{
        background: 'rgba(37,99,235,0.08)',
        borderBottom: `1px solid rgba(37,99,235,0.2)`,
        color: '#3B82F6',
      }}
    >
      <Loader2 size={12} className="animate-spin" />
      Loading your trades from cloud…
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { trades } = useTradesContext();
  const { challenge, dayNumber } = useChallengeContext();
  const { accounts } = usePropAccountsContext();
  const { isDayMode, toggleTheme, colors } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persistent collapsible state for Trading Utilities
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hustle_sidebar_utilities_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleUtilities = () => {
    setIsUtilitiesOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hustle_sidebar_utilities_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.appBg, color: colors.text }}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: 240, background: colors.sidebar, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg shadow-md shadow-blue-500/20"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <TrendingUp size={16} color="#FFFFFF" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wider" style={{ color: '#3B82F6' }}>
              HU$TLE
            </p>
            <p className="text-[10px] font-semibold tracking-widest" style={{ color: colors.textMuted, marginTop: -2 }}>
              TRADING
            </p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 py-3 space-y-4 px-2 overflow-y-auto">
          {/* A. Main Navigation (Core Daily Workflow) */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
              Core Workflow
            </p>
            {MAIN_NAV_ITEMS.map(({ to, label, icon: Icon, badgeType, aliasPaths }) => {
              const active = isItemActive(to, aliasPaths);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: active ? 'rgba(37,99,235,0.14)' : 'transparent',
                    color: active ? '#3B82F6' : colors.textSub,
                    border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                  {badgeType === 'accounts' && accounts.length > 0 && (
                    <span
                      className="ml-auto text-xs px-1.5 py-0.2 rounded-full font-bold"
                      style={{
                        background: 'rgba(37,99,235,0.15)',
                        color: '#3b82f6',
                        border: '1px solid rgba(37,99,235,0.3)',
                      }}
                    >
                      {accounts.length}
                    </span>
                  )}
                  {badgeType === 'trades' && openTrades > 0 && (
                    <span
                      className="ml-auto text-xs px-1.5 py-0.2 rounded-full font-bold"
                      style={{ background: '#2563EB', color: '#FFFFFF' }}
                    >
                      {openTrades}
                    </span>
                  )}
                  {active && <ChevronRight size={14} className="ml-auto opacity-80" />}
                </NavLink>
              );
            })}
          </div>

          {/* B. Trading Utilities (Collapsible Group) */}
          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              type="button"
              onClick={toggleUtilities}
              className="w-full text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between px-3 py-2 cursor-pointer hover:text-white transition-colors"
            >
              <span>Trading Utilities</span>
              {isUtilitiesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isUtilitiesOpen && (
              <div className="space-y-1 pl-1">
                {UTILITY_NAV_ITEMS.map(({ to, label, icon: Icon, aliasPaths }) => {
                  const active = isItemActive(to, aliasPaths);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 pl-5 pr-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: active ? 'rgba(37,99,235,0.14)' : 'transparent',
                        color: active ? '#3B82F6' : colors.textSub,
                        border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                      }}
                    >
                      <Icon size={14} className={active ? 'text-blue-500' : 'opacity-70'} />
                      <span className="truncate">{label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* C. Secondary Utilities (Bottom section) */}
          <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
              Discipline & Sync
            </p>
            {SECONDARY_NAV_ITEMS.map(({ to, label, icon: Icon, badgeType, aliasPaths }) => {
              const active = isItemActive(to, aliasPaths);
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? 'rgba(37,99,235,0.14)' : 'transparent',
                    color: active ? '#3B82F6' : colors.textSub,
                    border: active ? '1px solid rgba(37,99,235,0.25)' : '1px solid transparent',
                  }}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  {badgeType === 'challenge' && challenge.isActive && (
                    <span
                      className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                      style={{
                        background: 'rgba(37,99,235,0.2)',
                        color: '#3B82F6',
                        border: '1px solid rgba(37,99,235,0.3)',
                      }}
                    >
                      D{dayNumber}
                    </span>
                  )}
                  {active && <ChevronRight size={13} className="ml-auto opacity-80" />}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Edge card */}
        <EdgeCard trades={trades} />

        {/* Cloud sync status */}
        <CloudSyncPanel />

        {/* Theme toggle */}
        <div className="px-3 pb-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#3B82F6',
            }}
          >
            <div className="flex items-center gap-2">
              {isDayMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDayMode ? 'Day Mode' : 'Night Mode'}</span>
            </div>
            <div
              className="flex items-center rounded-full p-0.5 transition-all"
              style={{
                background: 'rgba(37,99,235,0.2)',
                width: 32,
                height: 18,
                justifyContent: isDayMode ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                className="rounded-full"
                style={{ width: 12, height: 12, background: '#3B82F6', transition: 'all 0.2s' }}
              />
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div
          className="flex items-center gap-3 px-4 py-3 lg:hidden"
          style={{ borderBottom: `1px solid ${colors.border}`, background: colors.sidebar }}
        >
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={20} style={{ color: colors.textSub }} />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#3B82F6' }} />
            <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>
              HU$TLE TRADING
            </span>
          </div>
        </div>

        <TradesLoadingBanner />

        {/* Page View Container */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default Layout;
