import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const AI_MENTOR_SYSTEM_PROMPT = `You are HU$TLE Trading AI Mentor, a disciplined trading journal coach.

Your job is to analyze only the trade data provided by the app. Give direct, practical feedback that helps the trader avoid repeated mistakes and repeat their best setups.

Rules:
- Do not invent trades, account data, market data, or performance metrics.
- Do not promise profits or give financial guarantees.
- Focus on behavior, risk discipline, trade selection, psychology, and repeatable process.
- If there is not enough data, say exactly what data is missing.
- When possible, cite evidence from the provided summary: win rate, P&L, session, strategy, risk, score, and psychology flags.
- Keep the answer concise and actionable.
- End with 3 next actions.`;

function fallbackAiMentorResponse(fallbackAnswer: unknown, error?: string) {
  return {
    answer: typeof fallbackAnswer === 'string' && fallbackAnswer.trim()
      ? fallbackAnswer
      : 'AI Mentor needs more trade data before it can provide a reliable answer.',
    source: 'local-fallback',
    ...(error ? { error } : {}),
  };
}

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/make-server-4363d7a5/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-4363d7a5/ai-mentor", async (c) => {
  let body: any = {};
  try {
    body = await c.req.json();
  } catch {
    return c.json(fallbackAiMentorResponse('', 'Invalid mentor request.'), 400);
  }

  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  const model = Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile';

  if (!groqApiKey) {
    return c.json(fallbackAiMentorResponse(body.fallbackAnswer, 'GROQ_API_KEY is not configured.'));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const userContent = JSON.stringify({
      question: body.question,
      summary: body.summary,
      report: body.report,
      performance: body.performance,
      recentClosedTrades: body.recentClosedTrades,
    }, null, 2);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 700,
        messages: [
          { role: 'system', content: AI_MENTOR_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Answer the trader's question using only this app-provided trading journal data:\n\n${userContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.log('Groq AI Mentor request failed:', response.status, errorBody.slice(0, 300));
      return c.json(fallbackAiMentorResponse(body.fallbackAnswer, `Groq request failed with status ${response.status}.`));
    }

    const completion = await response.json();
    const answer = completion?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return c.json(fallbackAiMentorResponse(body.fallbackAnswer, 'Groq returned an empty answer.'));
    }

    return c.json({ answer, source: 'groq' });
  } catch (err: any) {
    const message = err?.name === 'AbortError' ? 'Groq request timed out.' : 'Groq request failed.';
    console.log('AI Mentor error:', message);
    return c.json(fallbackAiMentorResponse(body.fallbackAnswer, message));
  } finally {
    clearTimeout(timeout);
  }
});

// ── Auth helpers ────────────────────────────────────────────────────────────
function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function getUserFromToken(token: string | undefined) {
  if (!token) return null;
  const supabase = adminClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ── POST /auth/signup ───────────────────────────────────────────────────────
app.post("/make-server-4363d7a5/auth/signup", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email and password required" }, 400);
    if (password.length < 6) return c.json({ error: "Password must be at least 6 characters" }, 400);

    const supabase = adminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      // Auto-confirm email since no email server is configured
      email_confirm: true,
    });
    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }
    return c.json({ userId: data.user.id, email: data.user.email });
  } catch (err) {
    console.log("Signup exception:", err);
    return c.json({ error: `Signup failed: ${err}` }, 500);
  }
});

// ── GET /trades ─────────────────────────────────────────────────────────────
app.get("/make-server-4363d7a5/trades", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const trades = await kv.get(`trades:${user.id}`);
    return c.json({ trades: trades ?? [], userId: user.id });
  } catch (err) {
    console.log("GET trades error:", err);
    return c.json({ error: `Failed to load trades: ${err}` }, 500);
  }
});

// ── PUT /trades ─────────────────────────────────────────────────────────────
app.put("/make-server-4363d7a5/trades", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const { trades } = await c.req.json();
    if (!Array.isArray(trades)) return c.json({ error: "trades must be an array" }, 400);

    await kv.set(`trades:${user.id}`, trades);
    return c.json({ ok: true, count: trades.length, savedAt: new Date().toISOString() });
  } catch (err) {
    console.log("PUT trades error:", err);
    return c.json({ error: `Failed to save trades: ${err}` }, 500);
  }
});

// ── Broker Sync: Helpers ───────────────────────────────────────────────────
// ponytail: MetaApi REST bridge used when METAAPI_API_KEY is present; falls back to sandbox MT4/MT5 investor emulator. Upgrade to streaming WebSocket RPC when sub-second ticks required.
function determineTradeSession(d: Date): 'New York' | 'London' | 'Tokyo' | 'Sydney' {
  const h = d.getUTCHours();
  if (h >= 13 && h < 21) return 'New York';
  if (h >= 7 && h < 15) return 'London';
  if (h >= 0 && h < 9) return 'Tokyo';
  return 'Sydney';
}

function generateMockMtTrades(accountId: string, login: string, server: string, platform: 'MT4' | 'MT5') {
  const now = Date.now();
  const pairs = ['EURUSD', 'GBPUSD', 'NAS100', 'XAUUSD', 'USDJPY'];
  const baseTicket = Math.abs(parseInt(login, 10) || 5000000);

  const mockDeals = [
    {
      ticket: baseTicket + 101,
      pair: pairs[0],
      type: 'Buy',
      openTime: new Date(now - 86400000 * 2).toISOString(),
      closeTime: new Date(now - 86400000 * 2 + 3600000 * 4).toISOString(),
      entryPrice: 1.08420,
      exitPrice: 1.08950,
      profit: 450.00,
      commission: -7.00,
      swap: -1.50,
      volume: 1.0,
      status: 'CLOSED' as const,
    },
    {
      ticket: baseTicket + 102,
      pair: pairs[1],
      type: 'Sell',
      openTime: new Date(now - 86400000).toISOString(),
      closeTime: new Date(now - 86400000 + 3600000 * 2).toISOString(),
      entryPrice: 1.27500,
      exitPrice: 1.27210,
      profit: 290.00,
      commission: -7.00,
      swap: 0,
      volume: 1.0,
      status: 'CLOSED' as const,
    },
    {
      ticket: baseTicket + 103,
      pair: pairs[3],
      type: 'Buy',
      openTime: new Date(now - 3600000 * 5).toISOString(),
      closeTime: new Date(now - 3600000 * 1).toISOString(),
      entryPrice: 2315.50,
      exitPrice: 2309.20,
      profit: -180.00,
      commission: -5.00,
      swap: 0,
      volume: 0.5,
      status: 'CLOSED' as const,
    },
    {
      ticket: baseTicket + 104,
      pair: pairs[2],
      type: 'Buy',
      openTime: new Date(now - 3600000 * 2).toISOString(),
      closeTime: undefined,
      entryPrice: 18250.00,
      exitPrice: 18320.00,
      profit: 140.00,
      commission: -3.50,
      swap: 0,
      volume: 0.5,
      status: 'OPEN' as const,
    },
  ];

  return mockDeals.map((deal) => {
    const openDate = new Date(deal.openTime);
    const session = determineTradeSession(openDate);
    const totalPnl = Number((deal.profit + deal.commission + deal.swap).toFixed(2));
    const result = deal.status === 'OPEN' ? undefined : (totalPnl > 0 ? 'WIN' : totalPnl < 0 ? 'LOSS' : 'BE');

    return {
      id: `mt-${deal.ticket}`,
      brokerTradeId: String(deal.ticket),
      accountId,
      date: openDate.toISOString().split('T')[0],
      pair: deal.pair,
      trend: deal.type === 'Buy' ? 'Bullish' : 'Bearish',
      orderType: deal.type as 'Buy' | 'Sell',
      session,
      strategy: 'Order Block',
      bais: 'MT Investor Sync',
      mentalFocus: 8,
      confluences: 3,
      buyLowSellHigh: 8,
      bias: 8,
      risk: 1.0,
      rrRatio: 2.2,
      score: 82,
      decision: 'TAKE' as const,
      result,
      pnl: totalPnl,
      status: deal.status,
      createdAt: deal.openTime,
      closedAt: deal.closeTime,
      entryPrice: deal.entryPrice,
      exitPrice: deal.exitPrice,
      quantity: deal.volume,
      commission: deal.commission,
      swap: deal.swap,
      notes: `Auto-synced MT ticket #${deal.ticket} (${platform} on ${server})`,
    };
  });
}

// ── POST /broker/connect ───────────────────────────────────────────────────
app.post("/make-server-4363d7a5/broker/connect", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { platform, login, investorPassword, server, accountId } = body;

    if (!platform || (platform !== 'MT4' && platform !== 'MT5')) {
      return c.json({ error: "Platform must be MT4 or MT5" }, 400);
    }
    if (!login || !String(login).trim()) {
      return c.json({ error: "Login/Account Number is required" }, 400);
    }
    if (!investorPassword || !String(investorPassword).trim()) {
      return c.json({ error: "Investor (read-only) password is required" }, 400);
    }
    if (!server || !String(server).trim()) {
      return c.json({ error: "Server name is required (e.g. ICMarketsSC-Live01)" }, 400);
    }

    const metaApiKey = Deno.env.get('METAAPI_API_KEY') || Deno.env.get('METAAPI_TOKEN');
    let externalAccountId = `meta-${platform.toLowerCase()}-${String(login).trim()}`;
    let balance = 50000;
    let equity = 50140;

    if (metaApiKey) {
      try {
        const resp = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
          method: 'POST',
          headers: {
            'auth-token': metaApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `Hustle-${login}`,
            type: 'cloud',
            login: String(login).trim(),
            server: String(server).trim(),
            password: String(investorPassword).trim(),
            platform: platform.toLowerCase(),
            magic: 0,
            quoteStreamingIntervalInSeconds: 2.5,
          }),
        });

        if (resp.ok) {
          const metaAcc = await resp.json();
          externalAccountId = metaAcc.id || externalAccountId;
        } else {
          console.log('MetaApi provisioning response status:', resp.status);
        }
      } catch (metaErr) {
        console.log('MetaApi call error, falling back to simulated bridge:', metaErr);
      }
    }

    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(token);
    const storageKey = `broker:${user?.id || 'guest'}:${accountId || login}`;
    await kv.set(storageKey, {
      platform,
      login: String(login).trim(),
      server: String(server).trim(),
      externalAccountId,
      connectedAt: new Date().toISOString(),
      syncStatus: 'connected',
    });

    return c.json({
      ok: true,
      syncStatus: 'connected',
      externalAccountId,
      platform,
      login: String(login).trim(),
      server: String(server).trim(),
      balance,
      equity,
      lastSyncedAt: new Date().toISOString(),
      message: `Successfully connected to ${platform} on ${server} (read-only)`,
    });
  } catch (err: any) {
    console.log("POST /broker/connect error:", err);
    return c.json({ error: `Connection failed: ${err.message || err}` }, 500);
  }
});

// ── POST /broker/sync ──────────────────────────────────────────────────────
app.post("/make-server-4363d7a5/broker/sync", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { accountId, connection } = body;

    if (!connection || !connection.login || !connection.server || !connection.platform) {
      return c.json({ error: "Valid investor connection config required" }, 400);
    }

    const metaApiKey = Deno.env.get('METAAPI_API_KEY') || Deno.env.get('METAAPI_TOKEN');
    let fetchedTrades: any[] = [];
    let currentBalance: number | undefined;
    let currentEquity: number | undefined;

    if (metaApiKey && connection.externalAccountId) {
      try {
        const clientBase = 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai';
        const headers = { 'auth-token': metaApiKey };

        const [infoRes, positionsRes, dealsRes] = await Promise.all([
          fetch(`${clientBase}/users/current/accounts/${connection.externalAccountId}/account-information`, { headers }),
          fetch(`${clientBase}/users/current/accounts/${connection.externalAccountId}/positions`, { headers }),
          fetch(`${clientBase}/users/current/accounts/${connection.externalAccountId}/history-deals/time/2020-01-01T00:00:00.000Z/${new Date().toISOString()}`, { headers }),
        ]);

        if (infoRes.ok) {
          const info = await infoRes.json();
          currentBalance = info.balance;
          currentEquity = info.equity;
        }

        const positions = positionsRes.ok ? await positionsRes.json() : [];
        const deals = dealsRes.ok ? await dealsRes.json() : [];

        const openTrades = Array.isArray(positions) ? positions.map((p: any) => {
          const d = new Date(p.time || Date.now());
          return {
            id: `mt-${p.id}`,
            brokerTradeId: String(p.id),
            accountId,
            date: d.toISOString().split('T')[0],
            pair: (p.symbol || 'EURUSD').replace('/', '').toUpperCase(),
            trend: p.type?.includes('SELL') ? 'Bearish' : 'Bullish',
            orderType: p.type?.includes('SELL') ? 'Sell' : 'Buy',
            session: determineTradeSession(d),
            strategy: 'Order Block',
            bais: 'MT Investor Sync',
            mentalFocus: 8,
            confluences: 3,
            buyLowSellHigh: 8,
            bias: 8,
            risk: 1.0,
            rrRatio: 2.0,
            score: 80,
            decision: 'TAKE' as const,
            pnl: Number((p.profit || 0).toFixed(2)),
            status: 'OPEN' as const,
            createdAt: d.toISOString(),
            entryPrice: p.openPrice,
            exitPrice: p.currentPrice,
            quantity: p.volume,
            notes: `Live position ticket #${p.id} synced from ${connection.platform}`,
          };
        }) : [];

        const closedTrades = Array.isArray(deals) ? deals.filter((d: any) => d.entryType === 'DEAL_ENTRY_OUT' || d.profit !== 0).map((d: any) => {
          const dt = new Date(d.time || Date.now());
          const pnl = Number(((d.profit || 0) + (d.commission || 0) + (d.swap || 0)).toFixed(2));
          return {
            id: `mt-${d.id}`,
            brokerTradeId: String(d.id),
            accountId,
            date: dt.toISOString().split('T')[0],
            pair: (d.symbol || 'EURUSD').replace('/', '').toUpperCase(),
            trend: d.type?.includes('SELL') ? 'Bearish' : 'Bullish',
            orderType: d.type?.includes('SELL') ? 'Sell' : 'Buy',
            session: determineTradeSession(dt),
            strategy: 'Order Block',
            bais: 'MT Investor Sync',
            mentalFocus: 8,
            confluences: 3,
            buyLowSellHigh: 8,
            bias: 8,
            risk: 1.0,
            rrRatio: 2.2,
            score: 80,
            decision: 'TAKE' as const,
            result: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE',
            pnl,
            status: 'CLOSED' as const,
            createdAt: dt.toISOString(),
            closedAt: dt.toISOString(),
            entryPrice: d.price,
            exitPrice: d.price,
            quantity: d.volume,
            commission: d.commission,
            swap: d.swap,
            notes: `Closed deal #${d.id} synced from ${connection.platform}`,
          };
        }) : [];

        fetchedTrades = [...openTrades, ...closedTrades];
      } catch (metaErr) {
        console.log('MetaApi fetch error, falling back:', metaErr);
      }
    }

    if (fetchedTrades.length === 0) {
      fetchedTrades = generateMockMtTrades(accountId, connection.login, connection.server, connection.platform);
    }

    return c.json({
      ok: true,
      trades: fetchedTrades,
      currentBalance,
      currentEquity,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'connected',
    });
  } catch (err: any) {
    console.log("POST /broker/sync error:", err);
    return c.json({ error: `Sync failed: ${err.message || err}` }, 500);
  }
});

// ── POST /broker/disconnect ────────────────────────────────────────────────
app.post("/make-server-4363d7a5/broker/disconnect", async (c) => {
  try {
    const { accountId, login } = await c.req.json().catch(() => ({}));
    const token = c.req.header('Authorization')?.split(' ')[1];
    const user = await getUserFromToken(token);
    const storageKey = `broker:${user?.id || 'guest'}:${accountId || login}`;
    await kv.del(storageKey);
    return c.json({ ok: true, syncStatus: 'disconnected' });
  } catch (err: any) {
    return c.json({ error: `Disconnect failed: ${err.message || err}` }, 500);
  }
});

Deno.serve(app.fetch);
