# 01 - Architecture Guide

## 🏗️ How HustleDashboard is Built

This guide explains the **complete architecture** - how all pieces work together.

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React Components (UI)                               │   │
│  │  - TradeReplay.tsx                                   │   │
│  │  - ScreenshotUpload.tsx                              │   │
│  │  - ScreenshotComparison.tsx                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Client (Type-Safe API)                         │   │
│  │  - trpc.trades.list.useQuery()                       │   │
│  │  - trpc.screenshots.create.useMutation()             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                   SERVER (Backend)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Express Server (Port 3000)                          │   │
│  │  - Routes HTTP requests                              │   │
│  │  - Handles authentication                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  tRPC Router (API Procedures)                        │   │
│  │  - trades.list                                       │   │
│  │  - trades.get                                        │   │
│  │  - screenshots.create                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Database Layer (Drizzle ORM)                        │   │
│  │  - Query helpers in db.ts                            │   │
│  │  - Type-safe queries                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ↓ SQL
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL/TiDB)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables:                                             │   │
│  │  - users (user accounts)                             │   │
│  │  - trades (trade records)                            │   │
│  │  - trade_screenshots (before/after images)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Example: Upload Screenshot

Let's trace what happens when a user uploads a screenshot:

```
1. USER ACTION
   └─→ User clicks "Upload" button in ScreenshotUpload.tsx

2. FRONTEND
   └─→ React component reads file
   └─→ Calls: trpc.screenshots.create.useMutation()
   └─→ Sends data to backend

3. NETWORK
   └─→ HTTP POST to /api/trpc/screenshots.create
   └─→ Includes: tradeId, screenshotType, storageUrl, storageKey

4. BACKEND RECEIVES REQUEST
   └─→ Express server receives HTTP request
   └─→ tRPC router matches the procedure
   └─→ Validates input with Zod schema

5. AUTHENTICATION CHECK
   └─→ Checks if user is logged in (protectedProcedure)
   └─→ Gets user ID from session

6. AUTHORIZATION CHECK
   └─→ Verifies user owns the trade
   └─→ Prevents unauthorized access

7. DATABASE OPERATION
   └─→ Calls db.createTradeScreenshot()
   └─→ Drizzle ORM builds SQL query
   └─→ Sends to MySQL database

8. DATABASE STORES DATA
   └─→ Inserts row into trade_screenshots table
   └─→ Returns inserted record with ID

9. RESPONSE SENT BACK
   └─→ Backend sends JSON response
   └─→ Includes screenshot data and storage URL

10. FRONTEND RECEIVES
    └─→ React component gets response
    └─→ Updates local state
    └─→ Shows success toast message
    └─→ Refetches screenshots list
    └─→ UI updates to show new screenshot

11. USER SEES RESULT
    └─→ Screenshot appears in the comparison view
    └─→ User can now compare before/after
```

---

## 🎯 Key Components Explained

### **1. Frontend (React)**

**What it does:** Displays UI and handles user interactions

**Key files:**
- `src/pages/TradeReplay.tsx` - Main trade page
- `src/components/ScreenshotUpload.tsx` - Upload component
- `src/components/ScreenshotComparison.tsx` - Comparison slider

**How it works:**
```typescript
// Component receives props
function TradeReplay({ params }) {
  // Fetch data from backend
  const { data: trade } = trpc.trades.get.useQuery({ tradeId });
  
  // Render UI
  return <div>{trade.symbol}</div>;
}
```

**Important:** React components are **functions that return JSX** (HTML-like syntax)

---

### **2. tRPC (API Layer)**

**What it does:** Connects frontend to backend with type safety

**Key concept:** Procedures are like API endpoints, but with automatic types

**Frontend usage:**
```typescript
// Call backend procedure
const { data } = trpc.trades.list.useQuery();
```

**Backend definition:**
```typescript
// Define the procedure
trades: router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getTradesByUserId(ctx.user.id)
  ),
})
```

**Why it's powerful:** TypeScript knows the return type automatically!

---

### **3. Backend (Express + tRPC)**

**What it does:** Handles business logic and data operations

**Key files:**
- `server/routers.ts` - All API procedures
- `server/db.ts` - Database queries
- `server/_core/trpc.ts` - tRPC setup

**How it works:**
```typescript
// Define a procedure
create: protectedProcedure
  .input(z.object({ symbol: z.string() }))  // Validate input
  .mutation(({ ctx, input }) =>              // Handle request
    db.createTrade({ userId: ctx.user.id, ...input })
  )
```

**Important:** Every procedure validates input and checks authentication

---

### **4. Database (Drizzle ORM + MySQL)**

**What it does:** Stores all data persistently

**Key files:**
- `drizzle/schema.ts` - Table definitions
- `server/db.ts` - Query helpers

**How it works:**
```typescript
// Define a table
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  // ... more fields
});

// Query the table
const trade = await db.select()
  .from(trades)
  .where(eq(trades.id, 1))
  .limit(1);
```

**Important:** Drizzle generates SQL automatically from TypeScript code

---

## 🔐 Authentication Flow

**How users log in:**

```
1. User clicks "Login"
   ↓
2. Redirected to Manus OAuth login page
   ↓
3. User enters credentials
   ↓
4. OAuth provider redirects back with token
   ↓
5. Backend creates session cookie
   ↓
6. Frontend stores cookie in browser
   ↓
7. Every request includes cookie automatically
   ↓
8. Backend verifies cookie and identifies user
   ↓
9. User is authenticated!
```

**Key files:**
- `server/_core/oauth.ts` - OAuth implementation
- `server/_core/context.ts` - Session management

**Important:** Cookies are sent automatically, no manual token passing needed

---

## 📊 Database Schema Relationships

```
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ openId       │
│ name         │
│ email        │
│ role         │
└──────────────┘
       │ (1)
       │
       │ (Many)
       ↓
┌──────────────────┐
│     trades       │
├──────────────────┤
│ id (PK)          │
│ userId (FK)      │ ← Links to users
│ symbol           │
│ entryPrice       │
│ exitPrice        │
│ quantity         │
│ tradeType        │
│ status           │
│ pnl              │
│ pnlPercent       │
└──────────────────┘
       │ (1)
       │
       │ (Many)
       ↓
┌──────────────────────────┐
│  trade_screenshots       │
├──────────────────────────┤
│ id (PK)                  │
│ tradeId (FK)             │ ← Links to trades
│ screenshotType           │
│ storageKey               │
│ storageUrl               │
│ description              │
└──────────────────────────┘
```

**Relationships:**
- 1 User can have Many Trades
- 1 Trade can have Many Screenshots
- Screenshots are always linked to a Trade

---

## 🔄 Request/Response Cycle

### **Example: Get Trade Details**

**Frontend initiates:**
```typescript
const { data: trade } = trpc.trades.get.useQuery({ tradeId: 1 });
```

**Network request:**
```
POST /api/trpc/trades.get
Content-Type: application/json
Cookie: session=...

{
  "json": {
    "tradeId": 1
  }
}
```

**Backend processes:**
```typescript
get: protectedProcedure
  .input(z.object({ tradeId: z.number() }))
  .query(async ({ ctx, input }) => {
    // 1. Check if user is authenticated
    if (!ctx.user) throw new Error("Not authenticated");
    
    // 2. Get the trade
    const trade = await db.getTrade(input.tradeId);
    
    // 3. Check if user owns this trade
    if (trade.userId !== ctx.user.id) {
      throw new Error("Not authorized");
    }
    
    // 4. Get screenshots for this trade
    const screenshots = await db.getTradeScreenshots(input.tradeId);
    
    // 5. Return combined data
    return { ...trade, screenshots };
  })
```

**Network response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "result": {
    "data": {
      "id": 1,
      "symbol": "EURUSD",
      "entryPrice": "1.10000",
      "exitPrice": "1.11000",
      "screenshots": [
        {
          "id": 1,
          "screenshotType": "BEFORE",
          "storageUrl": "/manus-storage/..."
        },
        {
          "id": 2,
          "screenshotType": "AFTER",
          "storageUrl": "/manus-storage/..."
        }
      ]
    }
  }
}
```

**Frontend receives:**
```typescript
// data is automatically typed!
console.log(trade.symbol);        // ✅ Works
console.log(trade.screenshots);   // ✅ Works
console.log(trade.invalidField);  // ❌ TypeScript error!
```

**Why this is powerful:** TypeScript knows the exact shape of the response!

---

## 🛡️ Security Layers

### **Layer 1: Authentication**
- User must be logged in
- Session cookie proves identity
- `protectedProcedure` enforces this

### **Layer 2: Authorization**
- User can only access their own data
- Check `userId` matches `ctx.user.id`
- Prevents accessing other users' trades

### **Layer 3: Input Validation**
- Zod schema validates all inputs
- Prevents invalid data from reaching database
- Type-safe on both frontend and backend

### **Layer 4: Database Constraints**
- Foreign keys ensure data integrity
- NOT NULL constraints prevent empty data
- Unique constraints prevent duplicates

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Manus Platform                   │
│  ┌───────────────────────────────────┐  │
│  │  Frontend (React)                 │  │
│  │  - Hosted on CDN                  │  │
│  │  - Global distribution            │  │
│  │  - Automatic SSL/TLS              │  │
│  └───────────────────────────────────┘  │
│                   ↓                      │
│  ┌───────────────────────────────────┐  │
│  │  Backend (Node.js)                │  │
│  │  - Auto-scaling                   │  │
│  │  - Load balancing                 │  │
│  │  - Automatic restarts             │  │
│  └───────────────────────────────────┘  │
│                   ↓                      │
│  ┌───────────────────────────────────┐  │
│  │  Database (MySQL)                 │  │
│  │  - Automatic backups              │  │
│  │  - High availability              │  │
│  │  - Replication                    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🔗 External Services Integration

### **Groq API (AI Mentor)**
```
Frontend
  ↓
Backend receives message
  ↓
Calls Groq API
  ↓
Groq returns AI response
  ↓
Backend sends to Frontend
  ↓
Frontend displays response
```

### **MetaApi (MT5 Integration)**
```
Frontend requests account data
  ↓
Backend calls MetaApi
  ↓MetaApi connect
(Content truncated due to size limit. Use line ranges to read remaining content)