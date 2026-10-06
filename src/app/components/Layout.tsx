import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { usePropAccountsContext } from '../data/PropAccountsContext';
import { useTheme } from '../data/ThemeContext';

interface NavItemConfig {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string; style?: React.CSSProperties }>;
  aliasPaths?: string[];
  badgeType?: 'accounts' | 'trades' | 'challenge';
}

const MAIN_ITEMS: NavItemConfig[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/accounts', label: 'Accounts', icon: Layers, badgeType: 'accounts', aliasPaths: ['/prop-firm', '/prop-accounts'] },
  { to: '/journal', label: 'Journal', icon: BookOpen, badgeType: 'trades' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, aliasPaths: ['/advanced-analytics'] },
];

const TOOLS_ITEMS: NavItemConfig[] = [
  { to: '/tools/scorer', label: 'Trade Scorer', icon: Wrench, aliasPaths: ['/scorer'] },
  { to: '/utilities/copier', label: 'Trade Copier', icon: Radio },
  { to: '/utilities/replay', label: 'Trade Replay', icon: PlayCircle, aliasPaths: ['/replay'] },
  { to: '/utilities/mentor', label: 'Hustle Mentor', icon: Bot, aliasPaths: ['/ai-mentor'] },
  { to: '/utilities/calendar', label: 'Economic Calendar', icon: Calendar },
];

const ACCOUNT_ITEMS: NavItemConfig[] = [
  { to: '/challenge', label: 'Challenge', icon: Flame, badgeType: 'challenge' },
  { to: '/broker-integration', label: 'Broker Sync', icon: Link2, aliasPaths: ['/broker'] },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { trades } = useTradesContext();
  const { challenge, dayNumber } = useChallengeContext();
  const { accounts } = usePropAccountsContext();
  const { isDayMode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isBrokerPage =
    location.pathname === '/broker-integration' ||
    location.pathname === '/broker' ||
    location.pathname.startsWith('/broker-integration/') ||
    location.pathname.startsWith('/broker/');

  const [hasVisitedBroker, setHasVisitedBroker] = useState(() => isBrokerPage);

  useEffect(() => {
    if (isBrokerPage && !hasVisitedBroker) {
      setHasVisitedBroker(true);
    }
  }, [isBrokerPage, hasVisitedBroker]);

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

  const renderNavItem = ({ to, label, icon: Icon, badgeType, aliasPaths }: NavItemConfig) => {
    const active = isItemActive(to, aliasPaths);
    return (
      <NavLink
        key={to}
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
          active
            ? 'bg-[#5D5FEF] text-white shadow-md shadow-indigo-500/25'
            : isDayMode
            ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
            : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="truncate">{label}</span>
        {badgeType === 'accounts' && accounts.length > 0 && (
          <span
            className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              active
                ? 'bg-white/20 text-white'
                : isDayMode
                ? 'bg-[#E5E4E2] text-[#6B7280]'
                : 'bg-[#181A20] text-[#8E95A5] border border-[#1E2026]'
            }`}
          >
            {accounts.length}
          </span>
        )}
        {badgeType === 'trades' && openTrades > 0 && (
          <span
            className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
              active
                ? 'bg-white/20 text-white'
                : 'bg-[#059669]/15 text-[#059669]'
            }`}
          >
            {openTrades}
          </span>
        )}
        {badgeType === 'challenge' && challenge.isActive && (
          <span
            className={`ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
              active
                ? 'bg-white/20 text-white'
                : 'bg-[#5D5FEF]/15 text-[#5D5FEF]'
            }`}
          >
            D{dayNumber}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'
      }`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Fixed Width Left Sidebar Navigation (240px) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static h-full w-[240px] shrink-0 flex flex-col transition-transform duration-300 ease-in-out ${
          isDayMode
            ? 'bg-white border-r border-[#E5E4E2]'
            : 'bg-[#0B0C0E] border-r border-[#1E2026]'
        } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between px-4 py-4 border-b shrink-0 ${
            isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
          }`}
        >
          <div
            className="flex items-center gap-2.5 cursor-pointer min-w-0"
            onClick={() => {
              navigate('/');
              setMobileOpen(false);
            }}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5D5FEF] shadow-md shadow-indigo-500/20 text-white shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase">CYPHER</span>
                <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-[#5D5FEF]/20 text-[#5D5FEF] border border-[#5D5FEF]/30">
                  PRO
                </span>
              </div>
              <p
                className={`text-[9px] font-semibold tracking-widest truncate ${
                  isDayMode ? 'text-[#6B7280]' : 'text-[#8E95A5]'
                }`}
              >
                TRADING DESK
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDayMode
                ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
                : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
            }`}
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Organized Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Main
            </p>
            <div className="space-y-1">
              {MAIN_ITEMS.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Trading Tools Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Trading Tools
            </p>
            <div className="space-y-1">
              {TOOLS_ITEMS.map((item) => renderNavItem(item))}
            </div>
          </div>

          {/* Account Section */}
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
              Account
            </p>
            <div className="space-y-1">
              {ACCOUNT_ITEMS.map((item) => renderNavItem(item))}
            </div>
          </div>
        </nav>

        {/* Bottom Actions: Ask Cypher + Theme Switcher */}
        <div
          className={`p-3 space-y-2 border-t shrink-0 ${
            isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
          }`}
        >
          {/* Dedicated Hustle Mentor Button */}
          <button
            type="button"
            onClick={() => {
              navigate('/utilities/mentor');
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              location.pathname === '/utilities/mentor' || location.pathname === '/ai-mentor'
                ? 'bg-[#5D5FEF] text-white shadow-md shadow-indigo-500/25'
                : isDayMode
                ? 'bg-[#EEF0FF] text-[#5D5FEF] hover:bg-[#E0E4FF] border border-[#5D5FEF]/30'
                : 'bg-[#181A20] text-white hover:bg-[#20222B] border border-[#2E313D]'
            }`}
          >
            <Sparkles size={16} className="shrink-0 text-[#A78BFA]" />
            <span className="flex-1 text-left truncate">Hustle Mentor</span>
            <ChevronRight size={15} className="ml-auto shrink-0 opacity-70" />
          </button>

          {/* Theme Mode Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isDayMode
                ? 'bg-[#F2F1EF] text-[#111827] hover:bg-[#E5E4E2]'
                : 'bg-[#131418] text-white hover:bg-[#181A20]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isDayMode ? (
                <Sun size={15} className="text-[#5D5FEF]" />
              ) : (
                <Moon size={15} className="text-[#6366F1]" />
              )}
              <span>{isDayMode ? 'Day Mode' : 'Night Mode'}</span>
            </div>
            <div
              className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                isDayMode
                  ? 'bg-[#5D5FEF] justify-end'
                  : 'bg-[#1E2026] justify-start'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main App Content (Clean flex-1 with zero overlap) ── */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full ${
          isDayMode ? 'bg-[#EBEAE8]' : 'bg-[#0B0C0E]'
        }`}
      >
        {/* Mobile Top Bar */}
        <div
          className={`lg:hidden flex items-center justify-between px-4 py-3 border-b shrink-0 ${
            isDayMode ? 'bg-white border-[#E5E4E2]' : 'bg-[#131418] border-[#1E2026]'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              isDayMode
                ? 'bg-[#F2F1EF] border-[#E5E4E2] text-[#111827]'
                : 'bg-[#181A20] border-[#1E2026] text-white'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#5D5FEF] flex items-center justify-center text-white">
              <TrendingUp size={14} />
            </div>
            <span className="text-xs font-black tracking-wider uppercase text-[#5D5FEF]">CYPHER PRO</span>
          </div>
          <div className="w-7" />
        </div>

        {/* Page Content Container */}
        <main
          className={`flex-1 ${isBrokerPage ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {/* Persistent WebTerminal Frame - kept alive in DOM to retain cookies, WebSockets, and state */}
          {hasVisitedBroker && (
            <div
              style={
                isBrokerPage
                  ? { width: '100%', height: '100%', display: 'block', overflow: 'hidden' }
                  : {
                      position: 'fixed',
                      top: '-99999px',
                      left: '-99999px',
                      width: '1px',
                      height: '1px',
                      opacity: 0,
                      pointerEvents: 'none',
                      visibility: 'hidden',
                    }
              }
            >
              <iframe
                src="https://mt5-sim1.fundingpips.com/terminal"
                title="Funding Pips MT5 WebTerminal"
                className="w-full h-full border-0 block"
                allow="clipboard-read; clipboard-write; fullscreen; web-share; autoplay"
              />
            </div>
          )}

          <div className={isBrokerPage ? 'hidden' : 'contents'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
