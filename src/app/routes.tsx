import { createBrowserRouter, redirect } from 'react-router';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradeScorer from './pages/TradeScorer';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import AdvancedAnalytics from './pages/AdvancedAnalytics';
import TradeReplay from './pages/TradeReplay';
import PsychologyJournal from './pages/PsychologyJournal';
import AIMentor from './pages/AIMentor';
import BrokerIntegration from './pages/BrokerIntegration';
import Challenge from './pages/Challenge';
import DataHub from './pages/DataHub';
import PatternRecognition from './pages/PatternRecognition';
import PropFirmDashboard from './pages/PropFirmDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'prop-firm', Component: PropFirmDashboard },
      { path: 'prop-accounts', Component: PropFirmDashboard },
      { path: 'accounts', Component: PropFirmDashboard },
      { path: 'scorer', Component: TradeScorer },
      { path: 'journal', Component: Journal },
      { path: 'analytics', Component: Analytics },
      { path: 'advanced-analytics', Component: AdvancedAnalytics },
      { path: 'replay', Component: TradeReplay },
      { path: 'psychology', Component: PsychologyJournal },
      { path: 'ai-mentor', Component: AIMentor },
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
