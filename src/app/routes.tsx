import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradeScorer from './pages/TradeScorer';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import TradeReplay from './pages/TradeReplay';
import AIMentor from './pages/AIMentor';
import BrokerIntegration from './pages/BrokerIntegration';
import Challenge from './pages/Challenge';
import DataHub from './pages/DataHub';
import PatternRecognition from './pages/PatternRecognition';
import AccountsPage from './pages/AccountsPage';
import TradeCopier from './pages/TradeCopier';
import EconomicCalendar from './pages/EconomicCalendar';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'accounts', Component: AccountsPage },
      { path: 'prop-firm', loader: () => redirect('/accounts') },
      { path: 'prop-accounts', loader: () => redirect('/accounts') },
      { path: 'journal', Component: Journal },
      { path: 'analytics', Component: Analytics },
      { path: 'advanced-analytics', loader: () => redirect('/analytics') },

      // Trading Utilities
      { path: 'tools/scorer', Component: TradeScorer },
      { path: 'scorer', Component: TradeScorer },
      { path: 'utilities/copier', Component: TradeCopier },
      { path: 'utilities/replay', Component: TradeReplay },
      { path: 'replay', Component: TradeReplay },
      { path: 'utilities/mentor', Component: AIMentor },
      { path: 'ai-mentor', Component: AIMentor },
      { path: 'utilities/calendar', Component: EconomicCalendar },

      // Secondary Utilities & Platform
      { path: 'psychology', loader: () => redirect('/journal') },
      { path: 'broker-integration', Component: BrokerIntegration },
      { path: 'broker', Component: BrokerIntegration },
      { path: 'challenge', Component: Challenge },
      { path: 'data-hub', Component: DataHub },
      { path: 'patterns', Component: PatternRecognition },
      { path: 'notion', loader: () => redirect('/data-hub') },
      { path: 'github', loader: () => redirect('/data-hub') },
      { path: 'data', loader: () => redirect('/data-hub') },
    ],
  },
]);
