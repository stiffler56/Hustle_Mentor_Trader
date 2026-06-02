import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

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
