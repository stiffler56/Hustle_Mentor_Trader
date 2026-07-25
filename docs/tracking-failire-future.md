# HustleDashboard - Professional Trading Dashboard

A comprehensive, production-ready trading dashboard with AI mentorship, broker integration, advanced analytics, and persistent data storage. Built for traders who want to track, analyze, and improve their trading performance with intelligent insights.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features Implemented](#features-implemented)
3. [Technical Architecture](#technical-architecture)
4. [Installation & Setup](#installation--setup)
5. [Feature Documentation](#feature-documentation)
6. [Future Improvements](#future-improvements)
7. [Contributing](#contributing)

---

## 🎯 Project Overview

**HustleDashboard** evolved from a local trading tool into a professional web application designed to help traders:
- Track and analyze every trade with detailed metrics
- Get AI-powered coaching and insights from an LLM mentor
- Connect to live MetaTrader 5 (MT5) accounts via MetaApi
- Compare trade charts before/after execution
- Maintain a psychology journal for emotional trading analysis
- View advanced analytics and pattern recognition

**Current Status:** Production-ready with core features implemented and tested.

---

## ✅ Features Implemented

### 1. **AI Mentor (Groq LLM Integration)**

**What Was Done:**
- Redesigned chat interface with modern, Claude-like UI
- Integrated Groq API (free, open-source Llama 3 model)
- Real-time message streaming with typing indicators
- Message history persistence in localStorage
- Professional dark-themed styling matching the dashboard

**How It Works:**
- Users navigate to the AI Mentor page
- Type trading questions or scenarios
- Receive AI-powered analysis and coaching
- Optional: Add Groq API key for advanced responses
- All conversations stored locally for reference

**Files:**
- `src/app/pages/AIMentor.tsx` - Modern chat interface component
- `src/app/utils/aiMentor.ts` - Groq API integration helper

**Current Capabilities:**
- ✅ Real-time chat with streaming responses
- ✅ Trade scenario analysis
- ✅ Psychology coaching
- ✅ Pattern recognition suggestions
- ✅ Risk management advice

**Future Improvements:**
- [ ] Save conversations to database for long-term analysis
- [ ] Export chat history as PDF reports
- [ ] Multi-turn conversation context (remember previous trades discussed)
- [ ] Sentiment analysis of trader emotions from chat
- [ ] Integration with trade data to provide contextual advice

---

### 2. **MetaTrader 5 (MT5) Broker Integration**

**What Was Done:**
- Integrated MetaApi service for live MT5 connectivity
- Created broker service layer for account management
- Implemented real-time account balance tracking
- Built UI for connecting/disconnecting MT5 accounts
- Added support for fetching live market data and positions

**How It Works:**
- Users connect their MT5 account via MetaApi token
- Dashboard displays live account balance, equity, margin
- Real-time position tracking (open trades)
- Market data streaming for chart analysis
- Automatic sync with broker account

**Files:**
- `src/app/services/brokerService.ts` - MetaApi wrapper
- `src/app/pages/BrokerIntegration.tsx` - Connection UI
- `src/app/pages/BrokerIntegration_Enhanced.tsx` - Advanced features

**Current Capabilities:**
- ✅ Live account connection via MetaApi
- ✅ Real-time balance/equity display
- ✅ Open positions tracking
- ✅ Market data fetching
- ✅ Account disconnection

**Future Improvements:**
- [ ] Historical trade data import from MT5
- [ ] Automated trade execution from dashboard
- [ ] Risk alerts (margin level, drawdown warnings)
- [ ] Multi-account management
- [ ] Trade copying/mirroring features
- [ ] Advanced order types (OCO, trailing stops)

---

### 3. **Screenshot Comparison (Trade Replay)**

**What Was Done:**
- Created interactive before/after screenshot comparison slider
- Built screenshot upload component with drag-and-drop support
- Implemented Trade Replay page with detailed trade information
- Added database schema for trades and screenshots
- Created tRPC procedures with ownership validation
- Integrated file storage for persistent screenshot storage

**How It Works:**
- Users navigate to a specific trade via `/trades/:tradeId`
- View trade details (entry price, exit price, P&L, etc.)
- Upload "before" chart screenshot (at trade entry)
- Upload "after" chart screenshot (at trade exit)
- Use interactive slider to compare the two screenshots
- Analyze what changed in the market during the trade

**Files:**
- `client/src/components/ScreenshotComparison.tsx` - Interactive slider
- `client/src/components/ScreenshotUpload.tsx` - File upload UI
- `client/src/pages/TradeReplay.tsx` - Trade replay page
- `server/routers.ts` - tRPC procedures
- `drizzle/schema.ts` - Database tables

**Current Capabilities:**
- ✅ Drag-and-drop screenshot upload
- ✅ Before/after comparison with slider
- ✅ Trade metadata display
- ✅ Screenshot storage and retrieval
- ✅ Ownership-based access control

**Future Improvements:**
- [ ] Screenshot annotations (draw circles, arrows, text)
- [ ] Automatic chart extraction from screenshots
- [ ] AI analysis of chart patterns in screenshots
- [ ] Screenshot comparison history (track improvements)
- [ ] Batch upload multiple trade screenshots
- [ ] Screenshot quality metrics and validation

---

### 4. **Trade Tracking & Analytics**

**What Was Done:**
- Designed comprehensive database schema for trade records
- Implemented trade creation and retrieval procedures
- Built analytics calculations (P&L, win rate, etc.)
- Created trade list views with filtering
- Added trade status management (OPEN, CLOSED, PENDING)

**How It Works:**
- Users create new trades with entry details
- System calculates P&L automatically
- Trades stored with timestamps and metadata
- Analytics dashboard shows performance metrics
- Historical trade data available for review

**Files:**
- `drizzle/schema.ts` - Trade table definition
- `server/db.ts` - Trade query helpers
- `server/routers.ts` - Trade tRPC procedures

**Current Capabilities:**
- ✅ Trade creation with full metadata
- ✅ Automatic P&L calculation
- ✅ Trade status tracking
- ✅ Historical trade retrieval
- ✅ User-specific trade isolation

**Future Improvements:**
- [ ] Advanced filtering (by symbol, date range, P&L range)
- [ ] Trade statistics dashboard (win rate, avg win/loss, etc.)
- [ ] Equity curve visualization
- [ ] Monthly/weekly performance reports
- [ ] Trade clustering (identify similar trade patterns)
- [ ] Backtesting integration

---

### 5. **Database Persistence**

**What Was Done:**
- Set up MySQL/TiDB database for production
- Designed schema for users, trades, screenshots, psychology entries
- Implemented Drizzle ORM for type-safe queries
- Created database migrations
- Set up automatic timestamp management

**How It Works:**
- All user data persists in cloud database
- Automatic backups and data integrity
- Type-safe queries prevent SQL injection
- Relationships between tables (users → trades → screenshots)
- Real-time data synchronization

**Files:**
- `drizzle/schema.ts` - Complete schema definition
- `server/db.ts` - Query helpers
- `drizzle/migrations/` - Database migrations

**Current Capabilities:**
- ✅ Persistent user accounts
- ✅ Trade history storage
- ✅ Screenshot metadata storage
- ✅ Automatic timestamps
- ✅ Data relationships

**Future Improvements:**
- [ ] Data export (CSV, Excel, JSON)
- [ ] Database replication for disaster recovery
- [ ] Advanced indexing for performance
- [ ] Data archival for old trades
- [ ] Real-time data synchronization across devices

---

### 6. **User Authentication (Manus OAuth)**

**What Was Done:**
- Integrated Manus OAuth for secure authentication
- Implemented session management
- Created user profile system
- Set up role-based access control (admin/user)

**How It Works:**
- Users log in via Manus OAuth
- Session automatically created
- User data stored in database
- Protected routes require authentication
- Admin features available to admin users

**Files:**
- `server/_core/oauth.ts` - OAuth implementation
- `server/_core/context.ts` - Auth context
- `server/routers.ts` - Protected procedures

**Current Capabilities:**
- ✅ Secure OAuth login
- ✅ Session persistence
- ✅ Role-based access
- ✅ User profile data

**Future Improvements:**
- [ ] Two-factor authentication (2FA)
- [ ] Social login options (Google, Discord)
- [ ] API key generation for third-party integrations
- [ ] Account recovery/password reset
- [ ] Activity logging and audit trails

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React
- **State Management:** tRPC + React Query
- **Routing:** Wouter

### Backend Stack
- **Runtime:** Node.js with tsx
- **Framework:** Express 4
- **API:** tRPC 11 (type-safe RPC)
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth
- **File Storage:** S3-compatible storage

### External Services
- **Groq API:** Free LLM for AI Mentor
- **MetaApi:** MT5 broker connectivity
- **Manus Platform:** OAuth, storage, hosting

### Database Schema
```
users
├── id (PK)
├── openId (OAuth)
├── name, email
├── role (admin/user)
└── timestamps

trades
├── id (PK)
├── userId (FK)
├── symbol, entryPrice, exitPrice
├── quantity, tradeType, status
├── entryTime, exitTime
├── pnl, pnlPercent
├── notes
└── timestamps

trade_screenshots
├── id (PK)
├── tradeId (FK)
├── screenshotType (BEFORE/AFTER)
├── storageKey, storageUrl
├── description
└── timestamps
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- Git
- MetaApi account (for MT5 integration)
- Groq API key (free from console.groq.com)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/stiffler56/HustleDashboard.git
   cd HustleDashboard
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Production Deployment

The production version (`hustledashboard-prod`) is deployed on Manus platform with:
- Automatic SSL/TLS
- Global CDN
- Auto-scaling
- Database backups
- Custom domain support

---

## 📚 Feature Documentation

### AI Mentor Usage

1. Navigate to **AI Mentor** page
2. Type your trading question or scenario
3. Receive AI analysis and coaching
4. Optional: Add Groq API key for better responses
5. Chat history saved automatically

**Example Prompts:**
- "I entered EURUSD at 1.10 but it went against me. What should I do?"
- "How do I manage risk on a 1:10 reward ratio?"
- "Analyze my trading psychology - I always close winners too early"

### MT5 Integration

1. Get MetaApi token from your broker
2. Go to **Broker Integration** page
3. Click "Connect Account"
4. Paste MetaApi token
5. View live account data

**What You Can See:**
- Account balance and equity
- Used margin and available margin
- Open positions and their P&L
- Real-time market data

### Trade Replay

1. Create a new trade in the dashboard
2. Navigate to `/trades/{tradeId}`
3. Upload "before" chart screenshot
4. Upload "after" chart screenshot
5. Use slider to compare charts
6. Add notes about what you learned

---

## 🔮 Future Improvements

### Short Term (Next Sprint)
- [ ] **Trade Journal:** Add detailed notes and lessons learned per trade
- [ ] **Win Rate Dashboard:** Show statistics (win %, avg win/loss, profit factor)
- [ ] **Trade Filtering:** Filter by symbol, date range, P&L
- [ ] **Screenshot Annotations:** Draw on screenshots to mark key levels
- [ ] **Mobile Responsive:** Optimize for tablet/mobile viewing

### Medium Term (Next Quarter)
- [ ] **Advanced Analytics:** Equity curves, drawdown analysis, monthly reports
- [ ] **Pattern Recognition:** AI identifies recurring trade patterns
- [ ] **Risk Alerts:** Real-time alerts for margin, drawdown, correlation risks
- [ ] **Trade Copying:** Mirror trades from other traders
- [ ] **Backtesting:** Test strategies on historical data
- [ ] **Multi-Account:** Manage multiple MT5 accounts simultaneously

### Long Term (Future)
- [ ] **Automated Trading:** Execute trades based on signals
- [ ] **Community Features:** Share trades, learn from other traders
- [ ] **Advanced Charting:** Built-in TradingView-style charts
- [ ] **News Integration:** Real-time economic news and market events
- [ ] **Machine Learning:** Predictive models for trade outcomes
- [ ] **Mobile App:** Native iOS/Android applications
- [ ] **API for Third Parties:** Allow external tools to integrate

---

## 🛠️ Development Workflow

### Adding a New Feature

1. **Create a GitHub issue** describing the feature
2. **Create a branch:** `git checkout -b feature/your-feature`
3. **Implement the feature:**
   - Update database schema if needed
   - Add backend procedures
   - Build frontend components
   - Write tests
4. **Test thoroughly:**
   - Run `pnpm test` for unit tests
   - Manual testing in browser
   - Check TypeScript compilation
5. **Submit a pull request** with description
6. **Code review** before merging to main

### Code Style
- Use TypeScript for type safety
- Follow Tailwind CSS conventions
- Keep components small and reusable
- Write meaningful commit messages
- Add comments for complex logic

---

## 📊 Performance Metrics

### Current Performance
- **Page Load:** < 2 seconds
- **AI Response:** 2-5 seconds (depends on Groq)
- **MT5 Sync:** Real-time (< 1 second)
- **Database Queries:** < 100ms average
- **Screenshot Upload:** < 5 seconds

### Optimization Opportunities
- [ ] Implement image lazy loading
- [ ] Add request caching
- [ ] Optimize database indexes
- [ ] Compress screenshots
- [ ] Implement pagination for large datasets

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Write tests**
5. **Submit a pull request**

### Reporting Issues
- Use GitHub Issues for bug reports
- Include steps to reproduce
- Attach screenshots if relevant
- Specify your environment (OS, browser, etc.)

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 📞 Support

- **GitHub Issues:** Report bugs and request features
- **Email:** support@hustledashboard.com
- **Discord:** Join our community server

---

## 🎓 Learning Resources

- [Groq API Documentation](https://console.groq.com/docs)
- [MetaApi Documentation](https://metaapi.cloud/docs)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Guide](https://orm.drizzle.team)
- [React Best Practices](https://react.dev)

---

## 📈 Roadmap

### Q3 2026
- ✅ AI Mentor (Completed)
- ✅ MT5 Integration (Completed)
- ✅ Screenshot Comparison (Completed)
- [ ] Trade Journal & Analytics

### Q4 2026
- [ ] Advanced Statistics Dashboard
- [ ] Pattern Recognition AI
- [ ] Risk Management Alerts
- [ ] Community Features

### 2027
- [ ] Mobile Applications
- [ ] Automated Trading
- [ ] Advanced Backtesting
- [ ] Machine Learning Models

---

## 💡 Tips for Traders Using HustleDashboard

1. **Consistent Tracking:** Log every trade, even small ones
2. **Screenshot Everything:** Before and after charts help with analysis
3. **Use AI Mentor:** Ask questions about your trades and psychology
4. **Review Regularly:** Check your statistics weekly
5. **Learn from Losses:** Use the journal to document lessons learned
6. **Risk Management:** Always set stop losses before entering
7. **Keep Notes:** Document your trading plan and reasons for each trade

---

## 🚀 Getting Started Checklist

- [ ] Clone the repository
- [ ] Install dependencies
- [ ] Set up environment variables
- [ ] Start development server
- [ ] Create your first trade
- [ ] Connect MT5 account
- [ ] Try the AI Mentor
- [ ] Upload trade screenshots
- [ ] Review your analytics
-
(Content truncated due to size limit.
 Use line ranges to read remaining content)
 dhamaad
