import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ChallengeData } from './types';

const KEY = 'hustle_challenge_v1';

const defaultChallenge: ChallengeData = {
  isActive: false,
  startDate: null,
  tradeIds: [],
  challengeNumber: 1,
};

interface ChallengeContextType {
  challenge: ChallengeData;
  startChallenge: () => void;
  stopChallenge: () => void;
  addChallengeTradeId: (id: string) => void;
  dayNumber: number;   // 1-30, or 0 if not active
  daysLeft: number;
  isCompleted: boolean;
}

const ChallengeContext = createContext<ChallengeContextType | null>(null);

export function ChallengeProvider({ children }: { children: React.ReactNode }) {
  const [challenge, setChallenge] = useState<ChallengeData>(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) return JSON.parse(s);
    } catch {}
    return defaultChallenge;
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(challenge));
  }, [challenge]);

  const dayNumber = challenge.isActive && challenge.startDate
    ? Math.min(
        Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / 86400000) + 1,
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
    }));

  const stopChallenge = () =>
    setChallenge(prev => ({
      ...prev,
      isActive: false,
      startDate: null,
      tradeIds: [],
      challengeNumber: prev.challengeNumber + 1,
    }));

  const addChallengeTradeId = (id: string) =>
    setChallenge(prev => ({ ...prev, tradeIds: [...prev.tradeIds, id] }));

  return (
    <ChallengeContext.Provider value={{ challenge, startChallenge, stopChallenge, addChallengeTradeId, dayNumber, daysLeft, isCompleted }}>
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallengeContext() {
  const ctx = useContext(ChallengeContext);
  if (!ctx) throw new Error('useChallengeContext must be inside ChallengeProvider');
  return ctx;
}
