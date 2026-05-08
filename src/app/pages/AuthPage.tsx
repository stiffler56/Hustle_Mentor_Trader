import React, { useState } from 'react';
import {
  TrendingUp, Eye, EyeOff, LogIn, UserPlus,
  Cloud, CheckCircle2, AlertTriangle, ChevronRight,
  BarChart3, Zap, Shield,
} from 'lucide-react';
import { useAuthContext } from '../data/AuthContext';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const { login, signup, continueAsGuest, authError, clearAuthError, authLoading: ctxLoading } = useAuthContext();

  const [tab,      setTab]      = useState<Tab>('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const switchTab = (t: Tab) => { setTab(t); clearAuthError(); setDone(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let ok = false;
    if (tab === 'signin') {
      ok = await login(email.trim(), password);
    } else {
      ok = await signup(email.trim(), password);
      if (ok) setDone(true);
    }
    setLoading(false);
  };

  // ── Features strip ────────────────────────────────────────────────────────
  const features = [
    { icon: Cloud,    label: 'Sync across all your devices' },
    { icon: Shield,   label: 'Your trades, stored privately' },
    { icon: BarChart3,label: 'Full performance analytics' },
    { icon: Zap,      label: 'Live trade scoring system' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #060912 0%, #0d1225 60%, #0a1020 100%)' }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 40px rgba(245,158,11,0.35)' }}>
            <TrendingUp size={26} color="#000" />
          </div>
          <h1 className="text-2xl tracking-wider" style={{ color: '#f59e0b', letterSpacing: '0.15em' }}>
            HU$TLE TRADING
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Your personal trading edge — tracked & synced
          </p>
        </div>

        {/* ── Card ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid #1c2333', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: '1px solid #1c2333' }}>
            {([['signin', 'Sign In', LogIn], ['signup', 'Create Account', UserPlus]] as const).map(([t, label, Icon]) => (
              <button key={t} onClick={() => switchTab(t)}
                className="flex-1 flex items-center justify-center gap-2 py-4 text-sm transition-all"
                style={{
                  background: tab === t ? 'rgba(245,158,11,0.08)' : 'transparent',
                  color: tab === t ? '#f59e0b' : '#6b7280',
                  borderBottom: tab === t ? '2px solid #f59e0b' : '2px solid transparent',
                }}>
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {done ? (
              /* ── Signup success state ── */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={28} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p className="text-base mb-1" style={{ color: '#e5e7eb' }}>Account created!</p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    Welcome to HU$TLE TRADING. You're now signed in.
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#4b5563' }}>
                    Your trades will auto-sync to this account on every device.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>
                    Email address
                  </label>
                  <input
                    type="email" required autoFocus
                    placeholder="you@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: '#0a0e1a', border: '1px solid #1c2333', color: '#e5e7eb', outline: 'none' }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>
                      Password
                    </label>
                    {tab === 'signup' && (
                      <span className="text-xs" style={{ color: '#4b5563' }}>Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required
                      placeholder={tab === 'signup' ? 'Create a strong password' : 'Your password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm pr-12"
                      style={{ background: '#0a0e1a', border: '1px solid #1c2333', color: '#e5e7eb', outline: 'none' }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity">
                      {showPw
                        ? <EyeOff size={16} style={{ color: '#9ca3af' }} />
                        : <Eye    size={16} style={{ color: '#9ca3af' }} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {authError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{authError}</p>
                  </div>
                )}

                {tab === 'signup' && (
                  <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>
                    Creating an account saves your trades to the cloud so you can access them from any device.
                    No email verification required — you're in immediately.
                  </p>
                )}

                <button type="submit"
                  disabled={loading || !email || !password}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 mt-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}>
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
                    </>
                  ) : tab === 'signin' ? (
                    <><LogIn size={15} /> Sign In & Load My Trades</>
                  ) : (
                    <><UserPlus size={15} /> Create Account & Sync</>
                  )}
                </button>
              </form>
            )}

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
              <span className="text-xs" style={{ color: '#374151' }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
            </div>

            {/* ── Guest mode ── */}
            <button onClick={continueAsGuest}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
              style={{ border: '1px solid #1c2333', color: '#6b7280', background: 'transparent' }}>
              <span>Continue without account</span>
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: '#374151' }}>Offline only</span>
                <ChevronRight size={13} style={{ color: '#374151' }} />
              </div>
            </button>
            <p className="text-xs text-center mt-2" style={{ color: '#374151' }}>
              Guest mode stores data locally — no cloud sync or multi-device access.
            </p>
          </div>
        </div>

        {/* ── Feature strip ── */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Icon size={12} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span className="text-xs" style={{ color: '#4b5563' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
