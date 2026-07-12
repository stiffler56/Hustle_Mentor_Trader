# 03 - Backend & Database Guide

## 🔧 Understanding the Backend

This guide teaches you how the **backend works** and how to build APIs like a pro.

---

## 📚 Backend Architecture

### **What is the Backend?**

The backend is the **server-side code** that:
- Receives requests from the frontend
- Processes data
- Queries the database
- Sends responses back

### **Our Backend Stack**

```
Frontend (React)
    ↓ HTTP Request
Express Server (Node.js)
    ↓
tRPC Router
    ↓
Database Layer (Drizzle ORM)
    ↓
MySQL Database
```

---

## 🚀 tRPC: Type-Safe APIs

### **What is tRPC?**

tRPC is a **framework for building type-safe APIs**. The key benefit: **frontend and backend share types automatically**.

### **Traditional REST vs tRPC**

**Traditional REST:**
```typescript
// Backend: Define endpoint
app.get('/api/trades/:id', (req, res) => {
  const trade = db.getTrade(req.params.id);
  res.json(trade);
});

// Frontend: Call endpoint (no type safety)
const response = await fetch('/api/trades/1');
const trade = await response.json();
console.log(trade.symbol);  // ❌ TypeScript doesn't know if this exists!
```

**tRPC:**
```typescript
// Backend: Define procedure
trades: router({
  get: protectedProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(({ input }) => db.getTrade(input.tradeId))
})

// Frontend: Call procedure (full type safety!)
const { data: trade } = trpc.trades.get.useQuery({ tradeId: 1 });
console.log(trade.symbol);  // ✅ TypeScript knows this exists!
```

**Why it's powerful:** TypeScript automatically knows the return type!

---

## 📝 Building tRPC Procedures

### **Anatomy of a Procedure**

```typescript
// Define a procedure
get: protectedProcedure           // 1. Who can access (public/protected)
  .input(z.object({               // 2. What input is expected
    tradeId: z.number()
  }))
  .query(({ ctx, input }) => {    // 3. What to do
    // ctx = context (user, etc.)
    // input = validated input
    return db.getTrade(input.tradeId);
  })
```

### **Types of Procedures**

**1. Query (Read-only)**
```typescript
// Get data without changing anything
list: publicProcedure.query(({ ctx }) =>
  db.getAllTrades()
)
```

**2. Mutation (Write/Update)**
```typescript
// Create, update, or delete data
create: protectedProcedure
  .input(z.object({
    symbol: z.string(),
    entryPrice: z.number(),
  }))
  .mutation(({ ctx, input }) =>
    db.createTrade({ userId: ctx.user.id, ...input })
  )
```

### **Access Control**

**Public Procedure - Anyone can access**
```typescript
publicProcedure.query(() => {
  // No authentication required
  return db.getPublicData();
})
```

**Protected Procedure - Only authenticated users**
```typescript
protectedProcedure.query(({ ctx }) => {
  // ctx.user is guaranteed to exist
  return db.getUserData(ctx.user.id);
})
```

**Admin Procedure - Only admins**
```typescript
adminProcedure.query(({ ctx }) => {
  // ctx.user.role === 'admin' is guaranteed
  return db.getAdminData();
})
```

---

## 🗄️ Database with Drizzle ORM

### **What is Drizzle ORM?**

Drizzle is a **database query builder with TypeScript support**. You define tables in TypeScript, and it generates SQL automatically.

### **Defining Tables**

```typescript
// drizzle/schema.ts
import { mysqlTable, int, varchar, decimal, timestamp } from 'drizzle-orm/mysql-core';

export const trades = mysqlTable('trades', {
  // Column name: type and constraints
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  entryPrice: decimal('entryPrice', { precision: 10, scale: 5 }).notNull(),
  exitPrice: decimal('exitPrice', { precision: 10, scale: 5 }),
  quantity: int('quantity').notNull(),
  tradeType: varchar('tradeType', { length: 10 }).notNull(), // 'BUY' or 'SELL'
  status: varchar('status', { length: 20 }).notNull(), // 'OPEN', 'CLOSED'
  pnl: decimal('pnl', { precision: 12, scale: 2 }),
  pnlPercent: decimal('pnlPercent', { precision: 8, scale: 4 }),
  notes: varchar('notes', { length: 1000 }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow(),
});
```

**Column Types:**
- `int()` - Integer numbers
- `varchar()` - Text with max length
- `decimal()` - Precise decimal numbers (for money)
- `timestamp()` - Date and time
- `boolean()` - True/False

**Constraints:**
- `.primaryKey()` - Unique identifier
- `.notNull()` - Must have a value
- `.autoincrement()` - Auto-increment ID
- `.defaultNow()` - Default to current time
- `.unique()` - No duplicates

---

### **Relationships Between Tables**

```typescript
// User has many trades
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const trades = mysqlTable('trades', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId')
    .notNull()
    .references(() => users.id),  // Foreign key to users
  symbol: varchar('symbol', { length: 20 }).notNull(),
});

// Trade has many screenshots
export const tradeScreenshots = mysqlTable('trade_screenshots', {
  id: int('id').autoincrement().primaryKey(),
  tradeId: int('tradeId')
    .notNull()
    .references(() => trades.id),  // Foreign key to trades
  screenshotType: varchar('screenshotType', { length: 10 }).notNull(),
  storageUrl: varchar('storageUrl', { length: 500 }).notNull(),
});
```

---

### **Writing Database Queries**

```typescript
// server/db.ts
import { db } from './db';
import { trades, users } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';

// SELECT - Get data
export async function getTrade(tradeId: number) {
  const trade = await db
    .select()
    .from(trades)
    .where(eq(trades.id, tradeId))
    .limit(1);
  
  return trade[0] || null;
}

// SELECT with JOIN - Get trade with user info
export async function getTradeWithUser(tradeId: number) {
  const result = await db
    .select()
    .from(trades)
    .innerJoin(users, eq(trades.userId, users.id))
    .where(eq(trades.id, tradeId));
  
  return result[0];
}

// SELECT with WHERE - Get user's trades
export async function getTradesByUserId(userId: number) {
  return await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(trades.createdAt);
}

// SELECT with multiple conditions
export async function getOpenTrades(userId: number) {
  return await db
    .select()
    .from(trades)
    .where(
      and(
        eq(trades.userId, userId),
        eq(trades.status, 'OPEN')
      )
    );
}

// INSERT - Create new trade
export async function createTrade(data: {
  userId: number;
  symbol: string;
  entryPrice: number;
  quantity: number;
  tradeType: string;
}) {
  const result = await db
    .insert(trades)
    .values({
      ...data,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  
  return result[0];
}

// UPDATE - Modify trade
export async function updateTrade(
  tradeId: number,
  data: Partial<typeof trades.$inferInsert>
) {
  return await db
    .update(trades)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(trades.id, tradeId));
}

// DELETE - Remove trade
export async function deleteTrade(tradeId: number) {
  return await db
    .delete(trades)
    .where(eq(trades.id, tradeId));
}

// COUNT - Count records
export async function countUserTrades(userId: number) {
  const result = await db
    .select({ count: sql`count(*)` })
    .from(trades)
    .where(eq(trades.userId, userId));
  
  return result[0].count;
}
```

---

## 🔐 Authentication & Authorization

### **How Authentication Works**

```typescript
// server/_core/oauth.ts
// 1. User logs in with OAuth
// 2. OAuth provider returns token
// 3. Backend creates session cookie
// 4. Cookie stored in browser

// server/_core/context.ts
// Every request includes cookie
// Backend verifies cookie
// Gets user ID from cookie
// Creates context with user info
```

### **Using Authentication in Procedures**

```typescript
// Only authenticated users can access
protectedProcedure.query(({ ctx }) => {
  // ctx.user is guaranteed to exist
  console.log(ctx.user.id);    // User ID
  console.log(ctx.user.name);  // User name
  console.log(ctx.user.role);  // 'admin' or 'user'
  
  return db.getUserData(ctx.user.id);
})

// Check authorization (ownership)
protectedProcedure
  .input(z.object({ tradeId: z.number() }))
  .query(async ({ ctx, input }) => {
    const trade = await db.getTrade(input.tradeId);
    
    // Verify user owns this trade
    if (trade.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not own this trade',
      });
    }
    
    return trade;
  })
```

---

## 📊 Real Example: Complete Feature

Let's trace the screenshot upload feature end-to-end:

### **1. Database Schema**
```typescript
// drizzle/schema.ts
export const tradeScreenshots = mysqlTable('trade_screenshots', {
  id: int('id').autoincrement().primaryKey(),
  tradeId: int('tradeId').notNull().references(() => trades.id),
  screenshotType: varchar('screenshotType', { length: 10 }).notNull(),
  storageKey: varchar('storageKey', { length: 500 }).notNull(),
  storageUrl: varchar('storageUrl', { length: 500 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('createdAt').defaultNow(),
});
```

### **2. Database Helpers**
```typescript
// server/db.ts
export async function createTradeScreenshot(data: {
  tradeId: number;
  screenshotType: string;
  storageKey: string;
  storageUrl: string;
  description?: string;
}) {
  return await db
    .insert(tradeScreenshots)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .$returningId();
}

export async function getTradeScreenshots(tradeId: number) {
  return await db
    .select()
    .from(tradeScreenshots)
    .where(eq(tradeScreenshots.tradeId, tradeId));
}
```

### **3. tRPC Procedures**
```typescript
// server/routers.ts
screenshots: router({
  create: protectedProcedure
    .input(z.object({
      tradeId: z.number(),
      screenshotType: z.enum(['BEFORE', 'AFTER']),
      storageUrl: z.string(),
      storageKey: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Verify user owns the trade
      const trade = await db.getTrade(input.tradeId);
      if (trade.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // 2. Create screenshot record
      const result = await db.createTradeScreenshot(input);
      
      // 3. Return created screenshot
      return {
        id: result.id,
        storageUrl: input.storageUrl,
        storageKey: input.storageKey,
      };
    }),

  getByTrade: protectedProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ ctx, input }) => {
      // 1. Verify user owns the trade
      const trade = await db.getTrade(input.tradeId);
      if (trade.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      // 2. Get screenshots
      return await db.getTradeScreenshots(input.tradeId);
    }),
})
```

### **4. Frontend Usage**
```typescript
// src/pages/TradeReplay.tsx
const createScreenshot = trpc.screenshots.create.useMutation({
  onSuccess: () => {
    // Refetch screenshots
    utils.screenshots.getByTrade.invalidate({ tradeId });
  },
});

const handleUpload = async (file: File) => {
  // Call backend procedure
  await createScreenshot.mutateAsync({
    tradeId: 1,
    screenshotType: 'BEFORE',
    storageUrl: '/manus-storage/...',
    storageKey: 'trades/1/before-...',
  });
};
```

---

## 🧪 Testing Backend Code

### **Testing Database Queries**

```typescript
// server/db.test.ts
import { describe, it, expect } from 'vitest';
import { createTrade, getTrade } from './db';

describe('Trade Database', () => {
  it('creates a trade', async () => {
    const result = await createTrade({
      userId: 1,
      symbol: 'EURUSD',
      entryPrice: 1.1,
      quantity: 1,
      tradeType: 'BUY',
    });
    
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
  });

  it('retrieves a trade', async () => {
    const trade = await getTrade(1);
    
    expect(trade).toBeDefined();
    expect(trade.symbol).toBe('EURUSD');
  });

  it('returns null for non-existent trade', async () => {
    const trade = await getTrade(99999);
    
    expect(trade).toBeNull();
  });
});
```

### **Testing tRPC Procedures**

```typescript
// server/routers.test.ts
import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Trade Router', () => {
  it('creates a trade', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, name: 'Test', role: 'user' },
    });
    
    const result = await caller.trades.create({
      symbol: 'EURUSD',
      entryPrice: 1.1,
      quantity: 1,
      tradeType: 'BUY',
    });
    
    expect(result.id).toBeDefined();
  });

  it('prevents unauthorized access', async () => {
    const caller = appRouter.createCaller({
      user: { id: 2, name: 'Other User', role: 'user' },
    });
    
    // Try to access trade owned by user 1
    expect(async () => {
      await caller.trades.get({ tradeId: 1 });
    }).rejects.toThrow('FORBIDDEN');
  });
});
```

---

## 🚀 Best Practices

### **1. Validate All Input**
```typescript
// ✅ Good: Validate with Zod
.input(z.object({
  symbol: z.string().min(1).max(20),
  quantity: z.number().positive(),
}))

// ❌ Bad: No validation
.input(z.any())
```

### **2. Check Authorization**
```typescript
// ✅ Good: Verify ownership
if (trade.userId !== ctx.user.id) {
  throw new TRPCError({ code: 'FORBIDDEN' });
}

// ❌ Bad: No authorization check
return db.getTrade(input.tradeId);
```

### **3. Use Transactions for Multiple Operations**
```typescript
// ✅ Good: Atomic operation
await db.transaction(async (tx) => {
  await tx.insert(trades).values(tradeData);
  await tx.insert(tradeScreenshots).values(screenshotData);
});

// ❌ Bad: Can fail halfway
await db.insert(trades).values(tradeData);
await db.insert(tradeScreenshots).values(screenshotData);
```

### **4. Handle Errors Gracefully**
```typescript
// ✅ Good: Specific error messages
try {
  const trade = await db.getTrade(id);
  if (!trade) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Trade not found',
    });
  }
} catch (error) {
  console.error('Error fetching trade:', error);
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
}
```

### **5. Use Indexes for Performance**
```typescript
// ✅ Good: Index frequently queried columns
export const trades = mysqlTable('trades', {
  id: int('id').primaryKey(),
  userId: int('userId').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  createdAtIdx: index('createdAt_idx').on(table.createdAt),
}))
```

---

## 📈 Database Migrations

### **When to Migrate**

When you change the schema, you need to migrate the database:

```typescript
// 1. Update schema.ts
export const trades = mysqlTable('trades', {
  // ... add new field
  riskRewardRatio: decimal('riskRewardRatio', { precision: 8, scale: 4 }),
});

// 2. Generate migration
// pnpm drizzle-kit generate

// 3. Review generated SQL file
// drizzle/0001_new_field.sql

// 4. Apply migration
// pnpm drizzle-kit push
```

---

## 🎓 Learning Exercises

### **Exercise 1: Add a New Field**
1. Add `riskRewardRatio` field to trades table
2. Create migration
3. Update database helper to include it
4. Update tRPC procedure to return it

### **Exercise 2: Create a New Procedure**
1. Create `trades.getStats` procedure
2. Calculate win rate, average P&L, etc.
3. Test it from frontend

### **Exercise 3: Add Authorization**
1. Ensure all procedures check user ownership
2. Write tests for authorization

---

**Remember:** The backend is all about **data integrity**, **security**, and **performance**. Master these concepts and you'll build robust APIs! 🚀
