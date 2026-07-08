# Hustle Dashboard

**Hustle Dashboard** is a personal trading journal and pre-trade decision-support tool for retail forex/CFD traders. It helps traders stop trading on impulse and start trading on evidence - by scoring every setup *before* you enter, logging every trade *after* you exit, and turning your own history into rules you actually follow.

---

## The Problem

Most retail traders don't lose money because they lack a strategy - they lose money because they don't follow the strategy they already have. Common failure points:

- **Emotional entries** - taking a trade because of FOMO, revenge, or boredom rather than a real setup
- **No pre-trade filter** - nothing stops a low-quality setup from becoming a live trade
- **Inconsistent journaling** - trades get logged (if at all) after the fact, with no structured data to learn from
- **Blind spots in your own edge** - traders *feel* like they know their best session, best confluence count, or best risk level, but rarely have the numbers to prove it
- **Scattered records** - screenshots, notes, and results live in different apps (or nowhere)

## How Hustle Dashboard Solves It

| Problem | Feature |
|---|---|
| No objective filter before entering a trade | **Pre-Trade Scorer** |
| Trades logged inconsistently or with no structure | **Trade Journal** |
| No visibility into what's actually working | **Analytics Dashboard** |
| No accountability or structured practice | **Challenge Mode** |
| Data locked in one place | **GitHub / Notion Sync & Data Manager** |

---

## Core Features

### Pre-Trade Scorer

Before you click buy/sell, you run the setup through a scoring model that grades it on:

- Mental focus / emotional state
- Number of confluences present
- Entry quality (buy-low/sell-high positioning)
- Bias alignment
- Session (New York, London, Tokyo, Sydney)
- Risk size

The score (0-100) maps to a clear verdict - **TAKE**, **WAIT**, or **PASS** - plus a mentor-style tip explaining *why*, based on patterns in your own trading history.

### Trade Journal

A structured log for every trade: pair, trend, order type, session, strategy, risk, R:R, result, P&L, notes, and up to four before/after screenshots plus a review video link. This turns "I think I remember what happened" into an actual searchable record.

### Analytics

Visual breakdowns of performance by session, strategy, confluence count, and more - so instead of guessing your edge, you can see it: win rate by session, by setup type, by risk level, over time.

### Challenge Mode

A structured, day-by-day trading challenge that tracks progress and tags "challenged" trades separately, for traders who want to build consistency through a defined practice period rather than open-ended trading.

### Sync & Data Management

- **GitHub Sync** - back up and version your trade data
- **Notion Sync** - mirror your journal into Notion for reporting or sharing
- **Data Manager** - import/export and manage your trade history directly

### Auth

User accounts via Supabase, so your journal and history are tied to your own account rather than living only in the browser.

---

## How It Helps Traders

1. **Enforces discipline before the trade** - the scorer acts as a gatekeeper, so low-quality setups get filtered out before they become losses.
2. **Builds a real edge from real data** - instead of trading on gut feel, decisions get grounded in your own historical win rates by session, confluence count, and risk level.
3. **Closes the feedback loop** - journaling + analytics means every trade makes the *next* decision smarter.
4. **Reduces emotional trading** - mental-focus scoring and mentor tips explicitly flag when you're not in the right state to trade.
5. **Keeps everything in one place** - setup, entry, screenshots, results, and review notes all live together instead of across scattered notes apps and broker platforms.

---

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS v4 + MUI + Lucide icons
- **Charts:** Recharts
- **Backend / Auth / DB:** Supabase, including edge functions
- **State:** React Context (`AuthContext`, `TradesContext`, `ChallengeContext`, `ThemeContext`)
- **Routing:** React Router 7
- **Package manager:** pnpm

## Project Structure

```text
src/app/
|-- components/       # Reusable UI
|-- data/             # Contexts, mock data, trade data, types
|-- hooks/            # Custom React hooks
|-- pages/            # Route-level pages
|-- utils/            # Scoring logic and helper utilities
`-- routes.tsx        # App routing

supabase/functions/   # Supabase edge functions
utils/supabase/       # Supabase client setup
```

See `docs/PROJECT_STRUCTURE.md` for a more detailed map of frontend, backend, generated, and documentation folders.

## Getting Started

```bash
pnpm install
pnpm build
```

This project originated as a Figma Make export. See `ATTRIBUTIONS.md` for third-party component and asset licensing.

## License

See `ATTRIBUTIONS.md` for third-party licenses used in this project.
