import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ChallengeData } from './types';

const KEY = 'hustle_challenge_v1';

const defaultChallenge: ChallengeData = {
  isActive: false,
  startDate: null,
  tradeIds: [],
  challengeNumber: 1,
  isPaused: false,
  pausedAt: null,
  pausedMs: 0,
};

interface ChallengeContextType {
  challenge: ChallengeData;
  startChallenge: () => void;
  stopChallenge: () => void;
  pauseChallenge: () => void;
  resumeChallenge: () => void;
  addChallengeTradeId: (id: string) => void;
  dayNumber: number;   // 1-30, or 0 if not active
  daysLeft: number;
  isCompleted: boolean;
  isPaused: boolean;
}

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [challenge, setChallenge] = useState<ChallengeData>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) return { ...defaultChallenge, ...JSON.parse(s) };
    } catch {}
    return defaultChallenge;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(challenge));
  }, [challenge]);

  const isPaused = Boolean(challenge.isActive && challenge.isPaused);

  // Freeze elapsed time while paused so the day counter does not advance.
  const pausedMs =
    (challenge.pausedMs ?? 0) +
    (isPaused && challenge.pausedAt ? Date.now() - new Date(challenge.pausedAt).getTime() : 0);

  const dayNumber = challenge.isActive && challenge.startDate
    ? Math.min(
        Math.floor((Date.now() - pausedMs - new Date(challenge.startDate).getTime()) / 86400000) + 1,
        30
      )
    : 0;

  const daysLeft = Math.max(0, 30 - dayNumber);
  const isCompleted = challenge.isActive && dayNumber >= 30;

  const startChallenge = () =>
    setChallenge(prev => ({
      ...prev,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      tradeIds: [],
      challengeNumber: prev.challengeNumber,
      isPaused: false,
      pausedAt: null,
      pausedMs: 0,
    }));

  const stopChallenge = () =>
    setChallenge(prev => ({
      ...prev,
      isActive: false,
      startDate: null,
      tradeIds: [],
      challengeNumber: prev.challengeNumber + 1,
      isPaused: false,
      pausedAt: null,
      pausedMs: 0,
    }));

  const pauseChallenge = () =>
    setChallenge(prev =>
      prev.isActive && !prev.isPaused
        ? { ...prev, isPaused: true, pausedAt: new Date().toISOString() }
        : prev
    );

  const resumeChallenge = () =>
    setChallenge(prev => {
      if (!prev.isActive || !prev.isPaused) return prev;
      const accumulated = prev.pausedMs ?? 0;
      const extra = prev.pausedAt ? Date.now() - new Date(prev.pausedAt).getTime() : 0;
      return { ...prev, isPaused: false, pausedAt: null, pausedMs: accumulated + Math.max(0, extra) };
    });

  const addChallengeTradeId = (id: string) =>
    setChallenge(prev => ({ ...prev, tradeIds: [...prev.tradeIds, id] }));

  return (
    <ChallengeContext.Provider value={{ challenge, startChallenge, stopChallenge, pauseChallenge, resumeChallenge, addChallengeTradeId, dayNumber, daysLeft, isCompleted, isPaused }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallengeContext() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallengeContext must be inside ChallengeProvider');
  return ctx;
}
