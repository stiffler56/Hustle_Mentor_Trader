import { createBrowserRouter } from 'react-router';
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
import NotionSync from './pages/NotionSync';
import DataManager from './pages/DataManager';
import GitHubSyncPage from './pages/GitHubSync';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'scorer', Component: TradeScorer },
      { path: 'journal', Component: Journal },
      { path: 'analytics', Component: Analytics },
      { path: 'advanced-analytics', Component: AdvancedAnalytics },
      { path: 'replay', Component: TradeReplay },
      { path: 'psychology', Component: PsychologyJournal },
      { path: 'ai-mentor', Component: AIMentor },
      { path: 'broker', Component: BrokerIntegration },
      { path: 'challenge', Component: Challenge },
      { path: 'notion', Component: NotionSync },
      { path: 'data', Component: DataManager },
      { path: 'github', Component: GitHubSyncPage },
    ],
  },
]);
