import type { Decision, ScoreBreakdown } from '../data/types';

export function calculateScore(params: {
  mentalFocus: number;
  confluences: number;
  buyLowSellHigh: number;
  bias: number;
  session: string;
  risk: number;
}): ScoreBreakdown {
  const mentalScore = (params.mentalFocus / 30) * 30;
  const confluenceScore = (params.confluences / 4) * 25;
  const blshScore = (params.buyLowSellHigh / 30) * 25;
  const biasScore = (params.bias / 30) * 20;

  let sessionBonus = 0;
  if (params.session === 'New York') sessionBonus = 3;
  else if (params.session === 'London') sessionBonus = -3;

  let riskBonus = 0;
  if (params.risk >= 0.5 && params.risk <= 1.5) riskBonus = 2;
  else if (params.risk > 2) riskBonus = -5;

  const raw = mentalScore + confluenceScore + blshScore + biasScore + sessionBonus + riskBonus;
  const total = Math.round(Math.max(0, Math.min(100, raw)));

  let decision: Decision;
  if (total >= 75) decision = 'TAKE';
  else if (total >= 55) decision = 'WAIT';
  else decision = 'PASS';

  return {
    mentalScore: Math.round(mentalScore),
    confluenceScore: Math.round(confluenceScore),
    blshScore: Math.round(blshScore),
    biasScore: Math.round(biasScore),
    sessionBonus,
    riskBonus,
    total,
    decision,
  };
}

export function getMentorTip(params: {
  mentalFocus: number;
  confluences: number;
  session: string;
  risk: number;
  score: number;
}): string {
  if (params.mentalFocus < 10)
    return '🚩 Mental focus < 10 — Your data shows 100% loss/BE on emotional trades. Close the app and come back later.';
  if (params.session === 'London' && params.score < 70)
    return '⚠️ London session. Your NY win rate is 61% vs London at 35%. Consider waiting for New York open.';
  if (params.confluences < 2)
    return '⚠️ Only 1 confluence — win rate at 33%. You need at least 3 for your edge to activate.';
  if (params.risk > 2)
    return '🚩 Risk > 2% — Your biggest losses happen when you over-risk to chase or recover. Stick to 1–1.5%.';
  if (params.confluences >= 3 && params.mentalFocus >= 20 && params.session === 'New York' && params.score >= 75)
    return '✅ This matches your EXACT winning formula: 3+ confluences, high mental focus, NY session. Your data says 65% win rate on this profile.';
  if (params.score >= 75)
    return '✅ High-quality setup. Aligns with your winning patterns. Execute your plan.';
  if (params.score >= 55)
    return '⏸ Almost there. Wait for one more confluence or better entry alignment before executing.';
  return '❌ Setup does not match your edge. PASS. Another opportunity will come.';
}
