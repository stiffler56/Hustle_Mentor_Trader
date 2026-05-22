import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Zap,
  BookOpen,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Menu,
  X,
  Flame,
  Database,
  Sun,
  Moon,
  HardDrive,
  Cloud,
  RefreshCw,
  LogOut,
  Github,
  Loader2,
  LineChart,
  PlayCircle,
  Brain,
  Link2,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useAuthContext } from '../data/AuthContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { useTheme } from '../data/ThemeContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scorer', label: 'Trade Scorer', icon: Zap },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/advanced-analytics', label: 'Advanced Analytics', icon: LineChart },
  { to: '/replay', label: 'Trade Replay', icon: PlayCircle },
  { to: '/psychology', label: 'Psychology Journal', icon: Brain },
  { to: '/ai-mentor', label: 'AI Mentor', icon: Zap },
  { to: '/broker', label: 'Broker Integration', icon: Link2 },
  { to: '/challenge', label: '30-Day Challenge', icon: Flame },
  { to: '/notion', label: 'Notion Import', icon: Database },
  { to: '/github', label: 'GitHub Sync', icon: Github },
  { to: '/data', label: 'Data Manager', icon: HardDrive },
  { to: '/patterns', label: 'Pattern Recognition', icon: TrendingUp },
];

function EdgeCard({ trades }: { trades: ReturnType<typeof useTradesContext>['trades'] }) {
  const { colors } = useTheme();
  const closed = trades.filter(t => t.status === 'CLOSED' && t.result);
  const nyTrades = closed.filter(t => t.session === 'New York');
  const nyWins = nyTrades.filter(t => t.result === 'WIN').length;
  const nyWR = nyTrades.length ? Math.round((nyWins / nyTrades.length) * 100) : 0;

  const highFocus = closed.filter(t => t.mentalFocus >= 20);
  const hfWins = highFocus.filter(t => t.result === 'WIN').length;
  const hfWR = highFocus.length ? Math.round((hfWins / highFocus.length) * 100) : 0;

  return (
    <div className="mx-3 mb-2 rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#f59e0b' }}>Your Edge</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>XAUUSD NY Session</span>
          <span style={{ color: '#10b981' }}>{nyWR}% WR</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>Focus 20+ trades</span>
          <span style={{ color: '#10b981' }}>{hfWR}% WR</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: colors.textSub }}>Best Strategy</span>
          <span style={{ color: '#f59e0b' }}>D1/H4 FVG</span>
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

  const dot = syncStatus === 'synced'  ? { color: '#10b981', label: 'Synced',   pulse: false }
            : syncStatus === 'syncing' ? { color: '#f59e0b', label: 'Syncing…', pulse: true  }
            : syncStatus === 'error'   ? { color: '#f87171', label: 'Error',    pulse: false }
            :                            { color: '#374151', label: 'Offline',  pulse: false };

  if (!isAuthenticated) return null;

  return (
    <div className="mx-3 mb-2 rounded-xl px-3 py-2.5"
      style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
      {/* Row 1: email + actions */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${dot.pulse ? 'animate-pulse' : ''}`}
            style={{ background: dot.color }} />
          <p className="text-xs truncate" style={{ color: colors.textSub }}>{userEmail}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button onClick={syncNow} title="Sync now" disabled={syncStatus === 'syncing'}
            className="opacity-50 hover:opacity-100 transition-opacity">
            <RefreshCw size={11} style={{ color: colors.textSub }}
              className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          </button>
          <button onClick={logout} title="Sign out"
            className="opacity-50 hover:opacity-100 transition-opacity">
            <LogOut size={11} style={{ color: colors.textSub }} />
          </button>
        </div>
      </div>
      {/* Row 2: status */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: dot.color }}>{dot.label}</span>
        {lastSynced && <span className="text-xs" style={{ color: colors.textFaint }}>{fmt(lastSynced)}</span>}
      </div>
      {syncStatus === 'error' && syncError && (
        <p className="text-xs mt-1" style={{ color: '#f87171' }}>{syncError}</p>
      )}
    </div>
  );
}

// ── Loading overlay while trades are being fetched ─────────────────────────
function TradesLoadingBanner() {
  const { colors } = useTheme();
  const { tradesLoading } = useTradesContext();
  if (!tradesLoading) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs"
      style={{ background: 'rgba(245,158,11,0.08)', borderBottom: `1px solid rgba(245,158,11,0.15)`, color: '#f59e0b' }}>
      <Loader2 size={12} className="animate-spin" />
      Loading your trades from cloud…
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { trades } = useTradesContext();
  const { challenge, dayNumber } = useChallengeContext();
  const { isDayMode, toggleTheme, colors } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const openTrades = trades.filter(t => t.status === 'OPEN').length;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.appBg, color: colors.text }}>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 240, background: colors.sidebar, borderRight: `1px solid ${colors.border}`, flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <TrendingUp size={16} color="#000" />
          </div>
          <div>
            <p className="text-sm" style={{ color: '#f59e0b', letterSpacing: '0.05em' }}>HU$TLE</p>
            <p className="text-xs" style={{ color: colors.textMuted, marginTop: -2 }}>TRADING</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={18} style={{ color: colors.textMuted }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: active ? '#f59e0b' : colors.textSub,
                  border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
                {label === 'Journal' && openTrades > 0 && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#f59e0b', color: '#000' }}>
                    {openTrades}
                  </span>
                )}
                {label === '30-Day Challenge' && challenge.isActive && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                    D{dayNumber}
                  </span>
                )}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Edge card */}
        <EdgeCard trades={trades} />

        {/* Cloud sync status */}
        <CloudSyncPanel />

        {/* Theme toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
            style={{
              background: isDayMode ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.08)',
              border: `1px solid ${isDayMode ? 'rgba(251,191,36,0.25)' : 'rgba(96,165,250,0.2)'}`,
              color: isDayMode ? '#f59e0b' : '#93c5fd',
            }}
          >
            <div className="flex items-center gap-2">
              {isDayMode ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDayMode ? 'Day Mode' : 'Night Mode'}</span>
            </div>
            <div
              className="flex items-center rounded-full p-0.5 transition-all"
              style={{
                background: isDayMode ? 'rgba(251,191,36,0.2)' : 'rgba(96,165,250,0.15)',
                width: 36, height: 20,
                justifyContent: isDayMode ? 'flex-end' : 'flex-start',
              }}
            >
              <div className="rounded-full" style={{ width: 14, height: 14, background: isDayMode ? '#f59e0b' : '#60a5fa', transition: 'all 0.2s' }} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 lg:hidden" style={{ borderBottom: `1px solid ${colors.border}`, background: colors.sidebar }}>
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={20} style={{ color: colors.textSub }} />
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#f59e0b' }} />
            <span className="text-sm" style={{ color: '#f59e0b' }}>HU$TLE TRADING</span>
          </div>
          {challenge.isActive && (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              <Flame size={10} /> Day {dayNumber}/30
            </span>
          )}
          <button onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all"
            style={{ background: isDayMode ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.08)', border: `1px solid ${isDayMode ? 'rgba(251,191,36,0.2)' : 'rgba(96,165,250,0.15)'}` }}
            title={isDayMode ? 'Switch to Night' : 'Switch to Day'}>
            {isDayMode ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#93c5fd' }} />}
          </button>
        </div>

        {/* Trades loading banner */}
        <TradesLoadingBanner />

        <main className="flex-1 overflow-y-auto" style={{ background: colors.appBg }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
