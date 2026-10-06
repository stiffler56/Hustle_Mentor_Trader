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
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTradesContext } from '../data/TradesContext';
import { useChallengeContext } from '../data/ChallengeContext';
import { useTheme } from '../data/ThemeContext';

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
  const { trades } = useTradesContext();
  const { challenge, dayNumber } = useChallengeContext();
  const { isDayMode, toggleTheme } = useTheme();

  // Persistent sidebar expand/collapse state
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hustle_sidebar_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hustle_sidebar_expanded', String(next));
      } catch {}
      return next;
    });
  };

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

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDayMode ? 'bg-[#EBEAE8] text-[#111827]' : 'bg-[#0B0C0E] text-white'
      }`}
    >
      {/* ── Navigation Sidebar Container ── */}
      <aside
        className={`h-full shrink-0 flex flex-col transition-all duration-300 ease-in-out z-20 ${
          isExpanded ? 'w-60' : 'w-[72px]'
        } ${
          isDayMode
            ? 'bg-white border-r border-[#E5E4E2]'
            : 'bg-[#0B0C0E] border-r border-[#1E2026]'
        }`}
      >
        {/* Brand Header */}
        {isExpanded ? (
          <div
            className={`flex items-center justify-between p-3.5 border-b shrink-0 ${
              isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
            }`}
          >
            <div
              className="flex items-center gap-2.5 cursor-pointer min-w-0"
              onClick={() => navigate('/')}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5D5FEF] shadow-md shadow-indigo-500/20 text-white shrink-0">
                <TrendingUp size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-wider uppercase">CYPHER</span>
                  <span className="text-[8px] font-extrabold px-1 rounded bg-[#5D5FEF]/20 text-[#5D5FEF] border border-[#5D5FEF]/30">
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
              onClick={handleToggleExpand}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isDayMode
                  ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
                  : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
              }`}
              title="Collapse Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center py-3.5 border-b shrink-0 ${
              isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
            }`}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#5D5FEF] shadow-md shadow-indigo-500/20 text-white cursor-pointer"
              onClick={() => navigate('/')}
              title="Cypher Trading"
            >
              <TrendingUp size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-[#5D5FEF] mt-1 font-mono">
              CYPHER
            </span>
            <button
              type="button"
              onClick={handleToggleExpand}
              className={`mt-2 p-1 rounded-lg transition-colors cursor-pointer ${
                isDayMode
                  ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
                  : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
              }`}
              title="Expand Sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          className={`flex-1 py-3 flex flex-col gap-1.5 overflow-y-auto ${
            isExpanded ? 'px-2' : 'px-2 items-center'
          }`}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, badgeType, aliasPaths }) => {
            const active = isItemActive(to, aliasPaths);

            if (isExpanded) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  title={label}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#5D5FEF] text-white shadow-md shadow-indigo-500/25'
                      : isDayMode
                      ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F2F1EF]'
                      : 'text-[#8E95A5] hover:text-white hover:bg-[#131418]'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{label}</span>
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
            }

            return (
              <NavLink
                key={to}
                to={to}
                title={label}
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

        {/* Bottom Theme Mode Switcher */}
        {isExpanded ? (
          <div
            className={`p-3 border-t shrink-0 ${
              isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
            }`}
          >
            <button
              type="button"
              onClick={toggleTheme}
              title={isDayMode ? 'Switch to Night Mode' : 'Switch to Day Mode'}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isDayMode
                  ? 'bg-[#F2F1EF] text-[#111827] hover:bg-[#E5E4E2]'
                  : 'bg-[#131418] text-white hover:bg-[#181A20]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isDayMode ? (
                  <Sun size={16} className="text-[#5D5FEF]" />
                ) : (
                  <Moon size={16} className="text-[#6366F1]" />
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
        ) : (
          <div
            className={`p-3 flex flex-col items-center border-t shrink-0 ${
              isDayMode ? 'border-[#E5E4E2]' : 'border-[#1E2026]'
            }`}
          >
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
              {isDayMode ? (
                <Sun size={17} className="text-[#5D5FEF]" />
              ) : (
                <Moon size={17} className="text-[#6366F1]" />
              )}
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content Area (Clean flex-1 with zero overlap) ── */}
      <main
        className={`flex-1 flex flex-col min-w-0 h-full ${
          isBrokerPage ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
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
  );
}

export default Layout;
