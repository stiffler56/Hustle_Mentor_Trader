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

Deno.serve(app.fetch);
