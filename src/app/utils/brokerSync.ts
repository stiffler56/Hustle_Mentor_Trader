import type { Trade } from '../data/types';
import type { InvestorConnectionConfig } from '../data/accountTypes';

function determineTradeSession(d: Date): 'New York' | 'London' | 'Tokyo' | 'Sydney' {
  const h = d.getUTCHours();
  if (h >= 13 && h < 21) return 'New York';
  if (h >= 7 && h < 15) return 'London';
  if (h >= 0 && h < 9) return 'Tokyo';
  return 'Sydney';
}

const PROVISIONING_ENDPOINTS = [
  '/api-metaapi-provisioning',
  'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai',
];

function getClientEndpoints(region: string = 'london') {
  return [
    '/api-metaapi-client',
    `https://mt-client-api-v1.${region}.agiliumtrade.ai`,
    'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai',
  ];
}

async function safeFetchWithFallback(
  endpoints: string[],
  path: string,
  options: RequestInit
): Promise<{ ok: boolean; status: number; data: any; raw: string }> {
  let lastError: any = null;

  for (const base of endpoints) {
    try {
      const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
      const res = await fetch(url, options);
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (res.ok) {
        return { ok: true, status: res.status, data: json ?? text, raw: text };
      }

      // If not ok but valid response received from endpoint
      if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
        // Only return if not a proxy 404
        if (!(base.startsWith('/') && res.status === 404)) {
          return { ok: false, status: res.status, data: json ?? text, raw: text };
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Network connection failed. Verify internet connection.');
}

export async function requestBrokerConnect(params: {
  platform: 'MT4' | 'MT5';
  login: string;
  investorPassword: string;
  server: string;
  accountId: string;
  accessToken?: string;
  metaApiToken?: string;
}): Promise<{ ok: boolean; externalAccountId?: string; balance?: number; equity?: number; isLive: boolean; region?: string }> {
  const token =
    params.metaApiToken ||
    localStorage.getItem('metaapi_token') ||
    ((import.meta as any).env?.VITE_METAAPI_TOKEN as string) ||
    '';

  if (!token) {
    throw new Error('MetaApi access token required for live sync.');
  }

  localStorage.setItem('metaapi_token', token);
  const headers = {
    'auth-token': token,
    'Content-Type': 'application/json',
  };

  // 1. Check existing accounts in MetaApi
  const listResp = await safeFetchWithFallback(PROVISIONING_ENDPOINTS, '/users/current/accounts', { headers });
  if (!listResp.ok) {
    const msg = listResp.data?.message || `MetaApi connection failed (${listResp.status}).`;
    throw new Error(msg);
  }

  const accounts = Array.isArray(listResp.data) ? listResp.data : [];
  let externalAccount = accounts.find((a: any) => String(a.login).trim() === String(params.login).trim());

  if (!externalAccount) {
    // 2. Provision new account on MetaApi
    const createResp = await safeFetchWithFallback(PROVISIONING_ENDPOINTS, '/users/current/accounts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Hustle-${params.login}`,
        type: 'cloud',
        login: params.login.trim(),
        server: params.server.trim(),
        password: params.investorPassword.trim(),
        platform: params.platform.toLowerCase(),
        magic: 0,
        quoteStreamingIntervalInSeconds: 2.5,
      }),
    });

    if (!createResp.ok && createResp.status !== 202) {
      const msg = createResp.data?.message || `Failed to register account with MetaApi bridge (${createResp.status}).`;
      throw new Error(msg);
    }

    externalAccount = createResp.data;
  }

  const externalId = externalAccount._id || externalAccount.id;
  const region = externalAccount.region || 'london';

  // 3. Deploy if not deployed
  if (externalAccount.state !== 'DEPLOYED') {
    await safeFetchWithFallback(PROVISIONING_ENDPOINTS, `/users/current/accounts/${externalId}/deploy`, {
      method: 'POST',
      headers,
    }).catch(() => {});
  }

  // 4. Fetch current balance & equity
  let balance: number | undefined;
  let equity: number | undefined;

  try {
    const clientEndpoints = getClientEndpoints(region);
    const infoResp = await safeFetchWithFallback(
      clientEndpoints,
      `/users/current/accounts/${externalId}/account-information`,
      { headers }
    );
    if (infoResp.ok && infoResp.data) {
      balance = infoResp.data.balance;
      equity = infoResp.data.equity;
    }
  } catch {}

  return {
    ok: true,
    externalAccountId: externalId,
    balance,
    equity,
    isLive: true,
    region,
  };
}

export async function requestBrokerSync(params: {
  accountId: string;
  connection: InvestorConnectionConfig;
  accessToken?: string;
}): Promise<{ trades: Trade[]; balance?: number; equity?: number }> {
  const token =
    params.connection.metaApiToken ||
    localStorage.getItem('metaapi_token') ||
    ((import.meta as any).env?.VITE_METAAPI_TOKEN as string) ||
    '';

  if (!token) {
    throw new Error('MetaApi token is required to sync real Funding Pips data.');
  }

  const externalId = params.connection.externalAccountId;
  if (!externalId) {
    throw new Error('Broker account bridge ID missing. Reconnect in settings.');
  }

  const region = (params.connection as any).region || 'london';
  const clientEndpoints = getClientEndpoints(region);
  const headers = { 'auth-token': token };

  // Fetch account info
  const infoResp = await safeFetchWithFallback(
    clientEndpoints,
    `/users/current/accounts/${externalId}/account-information`,
    { headers }
  );

  let balance: number | undefined;
  let equity: number | undefined;

  if (infoResp.ok && infoResp.data) {
    balance = infoResp.data.balance;
    equity = infoResp.data.equity;
  }

  // Fetch open positions
  const posResp = await safeFetchWithFallback(
    clientEndpoints,
    `/users/current/accounts/${externalId}/positions`,
    { headers }
  ).catch(() => ({ ok: false, data: [] }));

  // Fetch closed history deals
  const dealsResp = await safeFetchWithFallback(
    clientEndpoints,
    `/users/current/accounts/${externalId}/history-deals/time/2020-01-01T00:00:00.000Z/2027-01-01T00:00:00.000Z`,
    { headers }
  ).catch(() => ({ ok: false, data: [] }));

  const rawPositions = Array.isArray(posResp.data) ? posResp.data : [];
  const rawDeals = Array.isArray(dealsResp.data) ? dealsResp.data : [];

  // Group deals by positionId to reconstruct accurate entries, exits, commissions, and PnL
  const posMap = new Map<string, any[]>();
  for (const d of rawDeals) {
    if (!d.positionId) continue;
    if (!posMap.has(d.positionId)) posMap.set(d.positionId, []);
    posMap.get(d.positionId)!.push(d);
  }

  const closedTrades: Trade[] = [];

  for (const [posId, deals] of posMap.entries()) {
    const inDeal = deals.find(d => d.entryType === 'DEAL_ENTRY_IN');
    const outDeal = deals.find(d => d.entryType === 'DEAL_ENTRY_OUT');

    if (outDeal) {
      const origType: 'Buy' | 'Sell' = inDeal
        ? inDeal.type?.includes('SELL')
          ? 'Sell'
          : 'Buy'
        : outDeal.type?.includes('BUY')
        ? 'Sell'
        : 'Buy';

      const comm = deals.reduce((acc, d) => acc + (d.commission || 0), 0);
      const swap = deals.reduce((acc, d) => acc + (d.swap || 0), 0);
      const totalPnl = Number(((outDeal.profit || 0) + comm + swap).toFixed(2));
      const outDate = new Date(outDeal.time || Date.now());
      const inDate = inDeal ? new Date(inDeal.time) : outDate;
      const result = totalPnl > 0 ? ('WIN' as const) : totalPnl < 0 ? ('LOSS' as const) : ('BE' as const);

      closedTrades.push({
        id: `mt-${outDeal.id || posId}`,
        brokerTradeId: String(outDeal.id || posId),
        accountId: params.accountId,
        date: outDate.toISOString().split('T')[0],
        pair: (outDeal.symbol || 'FOREX').replace('/', '').toUpperCase(),
        trend: origType === 'Buy' ? ('Bullish' as const) : ('Bearish' as const),
        orderType: origType,
        session: determineTradeSession(inDate),
        strategy: 'Funding Pips Live',
        bais: 'Funding Pips Live',
        mentalFocus: 8,
        confluences: 3,
        buyLowSellHigh: 8,
        bias: 8,
        risk: 1.0,
        rrRatio: 2.0,
        score: 80,
        decision: 'TAKE' as const,
        result,
        pnl: totalPnl,
        status: 'CLOSED' as const,
        createdAt: inDate.toISOString(),
        closedAt: outDate.toISOString(),
        entryPrice: inDeal?.price || undefined,
        exitPrice: outDeal.price || undefined,
        quantity: outDeal.volume || 1.0,
        commission: comm,
        swap,
        notes: `Real MT5 ticket #${outDeal.id} on ${params.connection.server}`,
      });
    }
  }

  // Map open positions
  const openTrades: Trade[] = rawPositions.map((p: any) => {
    const d = new Date(p.time || Date.now());
    const isSell = String(p.type || '').toUpperCase().includes('SELL');
    const profit = Number((p.profit || 0).toFixed(2));

    return {
      id: `mt-${p.id}`,
      brokerTradeId: String(p.id),
      accountId: params.accountId,
      date: d.toISOString().split('T')[0],
      pair: (p.symbol || 'FOREX').replace('/', '').toUpperCase(),
      trend: isSell ? ('Bearish' as const) : ('Bullish' as const),
      orderType: isSell ? ('Sell' as const) : ('Buy' as const),
      session: determineTradeSession(d),
      strategy: 'Live Open Position',
      bais: 'Funding Pips Live',
      mentalFocus: 8,
      confluences: 3,
      buyLowSellHigh: 8,
      bias: 8,
      risk: 1.0,
      rrRatio: 2.0,
      score: 80,
      decision: 'TAKE' as const,
      pnl: profit,
      status: 'OPEN' as const,
      createdAt: d.toISOString(),
      entryPrice: p.openPrice,
      exitPrice: p.currentPrice,
      quantity: p.volume || 1.0,
      notes: `Live open trade #${p.id} on ${params.connection.server}`,
    };
  });

  return {
    trades: [...openTrades, ...closedTrades],
    balance,
    equity,
  };
}

export async function requestBrokerDisconnect(params: {
  accountId: string;
  login: string;
  accessToken?: string;
}) {
  return Promise.resolve();
}
