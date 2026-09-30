import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider, useAuthContext } from './data/AuthContext';
import { TradesProvider } from './data/TradesContext';
import { PropAccountsProvider } from './data/PropAccountsContext';
import { ChallengeProvider } from './data/ChallengeContext';
import { ThemeProvider } from './data/ThemeContext';
import AuthPage from './pages/AuthPage';
import { TrendingUp } from 'lucide-react';

// ── Loading screen (shown while checking for an existing session) ──────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6"
      style={{ background: 'linear-gradient(135deg, #060912 0%, #0d1225 100%)' }}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 40px rgba(245,158,11,0.3)' }}>
        <TrendingUp size={28} color="#000" />
      </div>
      <div className="text-center">
        <p className="text-lg tracking-widest mb-1" style={{ color: '#f59e0b', letterSpacing: '0.15em' }}>
          HU$TLE TRADING
        </p>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#f59e0b', animationDelay: `${i * 200}ms`, opacity: 0.7 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inner app — rendered only after auth state is known ────────────────────
function InnerApp() {
  const { authLoading, isAuthenticated, isGuest } = useAuthContext();

  // 1. Still checking for an existing session → show splash
  if (authLoading) return <LoadingScreen />;

  // 2. Not authenticated and not in guest mode → show auth gate
  if (!isAuthenticated && !isGuest) return <AuthPage />;

  // 3. Authenticated or guest → render the full app
  return (
    <TradesProvider>
      <PropAccountsProvider>
        <ChallengeProvider>
          <RouterProvider router={router} />
        </ChallengeProvider>
      </PropAccountsProvider>
    </TradesProvider>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
