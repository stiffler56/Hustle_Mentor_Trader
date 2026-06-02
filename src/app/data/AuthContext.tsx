import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
export const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-4363d7a5`;
const GUEST_KEY = 'hustle_guest_v1';

// ── Types ────────────────────────────────────────────────────────────────────
export interface AuthContextType {
  /** true while checking for an existing session on first load */
  authLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  userId: string;
  userEmail: string;
  accessToken: string;
  authError: string;
  login:  (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Synchronously detect guest mode so there's no flash
  const [isGuest, setIsGuest] = useState<boolean>(
    () => localStorage.getItem(GUEST_KEY) === 'true'
  );
  const [accessToken, setAccessToken] = useState('');
  const [userId,      setUserId]      = useState('');
  const [userEmail,   setUserEmail]   = useState('');
  // Only show loading spinner if not already in guest mode
  const [authLoading, setAuthLoading] = useState<boolean>(
    () => localStorage.getItem(GUEST_KEY) !== 'true'
  );
  const [authError, setAuthError] = useState('');

  const isAuthenticated = !!accessToken;

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (isGuest) return;

    let active = true;

    const checkSession = async () => {
      try {
        const result = await supabase.auth.getSession();
        if (!active) return;
        const session = result?.data?.session;
        if (session?.access_token && session?.user) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? '');
        }
      } catch {
        // Network unavailable — user will see login screen and can sign in when online
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    checkSession();

    let unsub: (() => void) | undefined;
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.access_token && session?.user) {
          setAccessToken(session.access_token);
          setUserId(session.user.id);
          setUserEmail(session.user.email ?? '');
        } else if (!session) {
          setAccessToken('');
          setUserId('');
          setUserEmail('');
        }
      });
      unsub = () => subscription.unsubscribe();
    } catch {
      // Auth subscription failed — offline
    }

    return () => {
      active = false;
      unsub?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAccessToken(data.session?.access_token ?? '');
      setUserId(data.user?.id ?? '');
      setUserEmail(email);
      setIsGuest(false);
      localStorage.removeItem(GUEST_KEY);
      return true;
    } catch (err: any) {
      setAuthError(err.message?.includes('Invalid') ? 'Incorrect email or password.' : err.message || 'Login failed.');
      return false;
    }
  };

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = async (email: string, password: string): Promise<boolean> => {
    setAuthError('');
    try {
      // Server creates user with email_confirm: true (no verification email)
      const res = await fetch(`${SERVER_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Signup failed');

      // Sign in immediately after creating the account
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAccessToken(data.session?.access_token ?? '');
      setUserId(data.user?.id ?? '');
      setUserEmail(email);
      setIsGuest(false);
      localStorage.removeItem(GUEST_KEY);
      return true;
    } catch (err: any) {
      const msg = err.message || 'Signup failed';
      setAuthError(msg.includes('already') || msg.includes('registered') ? 'An account with this email already exists. Try signing in.' : msg);
      return false;
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    supabase.auth.signOut();
    setAccessToken('');
    setUserId('');
    setUserEmail('');
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  };

  // ── Guest mode ────────────────────────────────────────────────────────────
  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem(GUEST_KEY, 'true');
  };

  const clearAuthError = () => setAuthError('');

  return (
    <AuthContext.Provider value={{
      authLoading, isAuthenticated, isGuest,
      userId, userEmail, accessToken, authError,
      login, signup, logout, continueAsGuest, clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}