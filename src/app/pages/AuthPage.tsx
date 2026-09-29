import React, { useState } from 'react';
import {
  TrendingUp, Eye, EyeOff, LogIn, UserPlus,
  CheckCircle2, AlertTriangle, ChevronRight,
  ArrowLeft, Mail, KeyRound,
} from 'lucide-react';
import { useAuthContext, supabase } from '../data/AuthContext';

type ViewMode = 'signin' | 'signup' | 'forgot';

function formatAuthError(err?: string | null): string {
  if (!err) return '';
  const lower = err.toLowerCase();
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('fetch failed') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    return 'Unable to reach the server. Please check your connection.';
  }
  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('incorrect email or password')
  ) {
    return 'Invalid email or password. Please try again.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (lower.includes('password should be at least') || lower.includes('min. 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a few moments and try again.';
  }
  if (lower.includes('user not found')) {
    return 'No account found with this email address.';
  }
  return err;
}

export default function AuthPage() {
  const { login, signup, continueAsGuest, authError, clearAuthError } = useAuthContext();

  const [view, setView] = useState<ViewMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const switchView = (nextView: ViewMode) => {
    setView(nextView);
    clearAuthError();
    setResetError('');
    setSignupDone(false);
    setResetSent(false);
    if (nextView === 'forgot' && email && !resetEmail) {
      setResetEmail(email.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let ok = false;
    if (view === 'signin') {
      ok = await login(email.trim(), password);
    } else if (view === 'signup') {
      ok = await signup(email.trim(), password);
      if (ok) setSignupDone(true);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(formatAuthError(err.message || 'Failed to send reset link.'));
    } finally {
      setResetLoading(false);
    }
  };

  const displayError = formatAuthError(authError);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #060912 0%, #0d1225 60%, #0a1020 100%)' }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 40px rgba(245,158,11,0.35)' }}
          >
            <TrendingUp size={26} color="#000" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider" style={{ color: '#f59e0b', letterSpacing: '0.15em' }}>
            HU$TLE TRADING
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Your personal trading edge — tracked & synced
          </p>
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: '#0d1117', border: '1px solid #1c2333', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
        >
          {view !== 'forgot' ? (
            /* Tabs: Sign In / Create Account */
            <div className="flex" style={{ borderBottom: '1px solid #1c2333' }}>
              {([['signin', 'Sign In', LogIn], ['signup', 'Create Account', UserPlus]] as const).map(([v, label, Icon]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchView(v)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all"
                  style={{
                    background: view === v ? 'rgba(245,158,11,0.08)' : 'transparent',
                    color: view === v ? '#f59e0b' : '#6b7280',
                    borderBottom: view === v ? '2px solid #f59e0b' : '2px solid transparent',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            /* Forgot Password Header */
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1c2333' }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#f59e0b' }}>
                <KeyRound size={15} />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => switchView('signin')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to Sign In</span>
              </button>
            </div>
          )}

          <div className="p-6">
            {view === 'forgot' ? (
              /* ── Forgot / Reset Password View ── */
              resetSent ? (
                <div className="text-center py-4 space-y-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
                  >
                    <CheckCircle2 size={28} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className="text-base font-medium mb-1" style={{ color: '#e5e7eb' }}>Check your email</p>
                    <p className="text-xs leading-relaxed max-w-xs mx-auto" style={{ color: '#9ca3af' }}>
                      We've sent a password reset link to <span className="font-semibold text-gray-200">{resetEmail}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchView('signin')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 mt-4"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                    Enter the email associated with your account and we'll send a link to reset your password.
                  </p>

                  <div>
                    <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="you@email.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm focus:border-amber-500"
                      style={{ background: '#0a0e1a', border: '1px solid #1c2333', color: '#e5e7eb', outline: 'none' }}
                    />
                  </div>

                  {resetError && (
                    <div
                      className="flex items-start gap-2.5 p-3 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                      <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{resetError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
                  >
                    {resetLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        <span>Sending reset link…</span>
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => switchView('signin')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition-colors hover:text-gray-200"
                    style={{ color: '#6b7280' }}
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Sign In</span>
                  </button>
                </form>
              )
            ) : signupDone ? (
              /* ── Signup success state ── */
              <div className="text-center py-4 space-y-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)' }}
                >
                  <CheckCircle2 size={28} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p className="text-base font-medium mb-1" style={{ color: '#e5e7eb' }}>Account created!</p>
                  <p className="text-sm" style={{ color: '#6b7280' }}>
                    Welcome to HU$TLE TRADING. You're now signed in.
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#4b5563' }}>
                    Your trades will auto-sync to this account on every device.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Sign In / Sign Up Form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b7280' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:border-amber-500"
                    style={{ background: '#0a0e1a', border: '1px solid #1c2333', color: '#e5e7eb', outline: 'none' }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-widest" style={{ color: '#6b7280' }}>
                      Password
                    </label>
                    {view === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs text-amber-500/80 hover:text-amber-400 hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: '#4b5563' }}>Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder={view === 'signup' ? 'Create a strong password' : 'Your password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm pr-11 focus:border-amber-500"
                      style={{ background: '#0a0e1a', border: '1px solid #1c2333', color: '#e5e7eb', outline: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors p-1"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {displayError && (
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{displayError}</p>
                  </div>
                )}

                {view === 'signup' && (
                  <p className="text-xs leading-relaxed" style={{ color: '#4b5563' }}>
                    Creating an account saves your trades to the cloud for access on any device.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000' }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>{view === 'signin' ? 'Signing in…' : 'Creating account…'}</span>
                    </>
                  ) : view === 'signin' ? (
                    <>
                      <LogIn size={15} />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ── Guest mode section (only on Sign In / Sign Up) ── */}
            {view !== 'forgot' && !signupDone && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
                  <span className="text-xs" style={{ color: '#374151' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: '#1c2333' }} />
                </div>

                <button
                  type="button"
                  onClick={continueAsGuest}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:opacity-80"
                  style={{ border: '1px solid #1c2333', color: '#6b7280', background: 'transparent' }}
                >
                  <span>Continue as Guest</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs" style={{ color: '#4b5563' }}>Offline only</span>
                    <ChevronRight size={13} style={{ color: '#4b5563' }} />
                  </div>
                </button>
                <p className="text-xs text-center mt-2" style={{ color: '#4b5563' }}>
                  Guest data is saved locally on this device only.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
