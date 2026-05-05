import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradeScorer from './pages/TradeScorer';
import Journal from './pages/Journal';
import Analytics from './pages/Analytics';
import Challenge from './pages/Challenge';
import NotionSync from './pages/NotionSync';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'scorer', Component: TradeScorer },
      { path: 'journal', Component: Journal },
      { path: 'analytics', Component: Analytics },
      { path: 'challenge', Component: Challenge },
      { path: 'notion', Component: NotionSync },
    ],
  },
]);
