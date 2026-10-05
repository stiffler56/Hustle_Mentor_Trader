/**
 * Broker Sync & Trade Normalization Pipeline
 * Uses direct MetaApiClient REST calls without heavy SDKs
 */

import type { Trade, Session, OrderType } from '../data/types';
import type { Account, InvestorConnectionConfig } from '../data/accountTypes';
import {
  MetaApiClient,
  type MetaApiAccountInformation,
  type MetaApiDeal,
  type MetaApiPosition,
  type MetaApiHealthStatus,
} from '../services/metaApiClient';

/**
 * Determine trade session based on UTC execution hour
 */
export function determineTradeSession(d: Date): Session {
  const h = d.getUTCHours();
  if (h >= 13 && h < 21) return 'New York';
  if (h >= 7 && h < 15) return 'London';
  if (h >= 0 && h < 9) return 'Tokyo';
  return 'Sydney';
}

/**
 * Normalize raw MetaApi deals into application Trade objects
 */
export function normalizeMetaApiDeals(
  deals: MetaApiDeal[],
  accountId: string = 'acc-default',
  baseBalance: number = 50000
): Trade[] {
  if (!Array.isArray(deals) || deals.length === 0) return [];

  // Group deals by positionId or orderId
  const posMap = new Map<string, MetaApiDeal[]>();

  for (const d of deals) {
    if (d.type === 'DEAL_TYPE_BALANCE') continue; // Skip deposit/withdrawal entries
    const key = d.positionId || d.orderId || d.id;
    if (!posMap.has(key)) posMap.set(key, []);
    posMap.get(key)!.push(d);
  }

  const normalizedTrades: Trade[] = [];

  for (const [key, group] of posMap.entries()) {
    const inDeals = group.filter((d) => d.entryType === 'DEAL_ENTRY_IN');
    const outDeals = group.filter(
      (d) => d.entryType === 'DEAL_ENTRY_OUT' || d.entryType === 'DEAL_ENTRY_INOUT' || d.entryType === 'DEAL_ENTRY_OUT_BY'
    );

    // If there is an OUT deal, this represents a closed execution trade
    if (outDeals.length > 0) {
      for (const outDeal of outDeals) {
        const inDeal = inDeals[0];
        const isSell = inDeal
          ? String(inDeal.type || '').toUpperCase().includes('SELL')
          : String(outDeal.type || '').toUpperCase().includes('BUY');

        const orderType: OrderType = isSell ? 'Sell' : 'Buy';
        const commission = group.reduce((acc, d) => acc + (d.commission || 0), 0);
        const swap = group.reduce((acc, d) => acc + (d.swap || 0), 0);
        const totalPnl = Number(((outDeal.profit || 0) + commission + swap).toFixed(2));
        const pnlPct = Number(((totalPnl / baseBalance) * 100).toFixed(2));

        const outDate = new Date(outDeal.time || Date.now());
        const inDate = inDeal ? new Date(inDeal.time) : outDate;

        const symbol = (outDeal.symbol || inDeal?.symbol || 'XAUUSD').replace('/', '').toUpperCase();
        const dateStr = !isNaN(outDate.getTime())
          ? outDate.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        normalizedTrades.push({
          id: `mt-${outDeal.id || key}`,
          brokerTradeId: String(outDeal.id || key),
          accountId,
          date: dateStr,
          pair: symbol,
          symbol,
          trend: orderType === 'Buy' ? 'Bullish' : 'Bearish',
          orderType,
          session: determineTradeSession(inDate),
          strategy: 'Order Block',
          bais: 'MetaTrader 5 Sync',
          mentalFocus: 25,
          confluences: 3,
          buyLowSellHigh: 20,
          bias: 20,
          risk: 1.0,
          rrRatio: 2.0,
          score: 85,
          decision: 'TAKE',
          result: totalPnl > 0 ? 'WIN' : totalPnl < 0 ? 'LOSS' : 'BE',
          pnl: totalPnl,
          pnlPercentage: pnlPct,
          status: 'CLOSED',
          createdAt: inDate.toISOString(),
          closedAt: outDate.toISOString(),
          entryPrice: inDeal?.price || undefined,
          exitPrice: outDeal.price || undefined,
          quantity: outDeal.volume || inDeal?.volume || 1.0,
          lots: outDeal.volume || inDeal?.volume || 1.0,
          commission,
          swap,
          notes: `Synced from MT5 Ticket #${outDeal.id || key}`,
        });
      }
    }
  }

  return normalizedTrades;
}

/**
 * Normalize active live MetaApi positions into open Trade objects
 */
export function normalizeMetaApiPositions(
  positions: MetaApiPosition[],
  accountId: string = 'acc-default'
): Trade[] {
  if (!Array.isArray(positions) || positions.length === 0) return [];

  return positions.map((p) => {
    const d = new Date(p.time || Date.now());
    const isSell = String(p.type || '').toUpperCase().includes('SELL');
    const orderType: OrderType = isSell ? 'Sell' : 'Buy';
    const profit = Number((p.profit || 0).toFixed(2));
    const symbol = (p.symbol || 'XAUUSD').replace('/', '').toUpperCase();
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    return {
      id: `mt-${p.id}`,
      brokerTradeId: String(p.id),
      accountId,
      date: dateStr,
      pair: symbol,
      symbol,
      trend: orderType === 'Buy' ? 'Bullish' : 'Bearish',
      orderType,
      session: determineTradeSession(d),
      strategy: 'Order Block',
      bais: 'MetaTrader 5 Live Position',
      mentalFocus: 25,
      confluences: 3,
      buyLowSellHigh: 20,
      bias: 20,
      risk: 1.0,
      rrRatio: 2.0,
      score: 85,
      decision: 'TAKE',
      pnl: profit,
      status: 'OPEN',
      createdAt: d.toISOString(),
      entryPrice: p.openPrice,
      exitPrice: p.currentPrice,
      quantity: p.volume || 1.0,
      lots: p.volume || 1.0,
      swap: p.swap || 0,
      notes: `Live open trade ticket #${p.id}`,
    };
  });
}

export interface ForceSyncResult {
  success: boolean;
  message: string;
  accountInfo?: MetaApiAccountInformation;
  health?: MetaApiHealthStatus;
  balance?: number;
  equity?: number;
  openPositionsCount: number;
  closedTradesCount: number;
  trades: Trade[];
}

/**
 * 1-Click Test Connection & Force Sync Function
 * Validates token & account ID, fetches latest account state, positions, and history,
 * normalizes trades, updates localStorage and active accounts.
 */
export async function testConnectionAndForceSync(
  customToken?: string,
  customAccountId?: string
): Promise<ForceSyncResult> {
  const { token: defaultToken, accountId: defaultAccountId } = MetaApiClient.getCredentials();
  const token = (customToken || defaultToken).trim();
  const accountId = (customAccountId || defaultAccountId).trim();

  if (!token) {
    throw new Error('MetaApi access token is missing. Please enter your token.');
  }
  if (!accountId) {
    throw new Error('MetaTrader account ID is missing.');
  }

  // Save active credentials
  MetaApiClient.saveCredentials(token, accountId);

  // 1. Health check & account provisioning check
  const health = await MetaApiClient.getConnectionHealth(accountId, token);

  // 2. Fetch account information
  const accountInfo = await MetaApiClient.getAccountInformation(accountId, token, health.region);

  // 3. Fetch positions and deals
  const [positions, deals] = await Promise.all([
    MetaApiClient.getPositions(accountId, token, health.region).catch(() => []),
    MetaApiClient.getHistoryDeals(accountId, '2020-01-01T00:00:00.000Z', new Date().toISOString(), token, health.region).catch(() => []),
  ]);

  const baseBalance = accountInfo.balance || 50000;
  const closedTrades = normalizeMetaApiDeals(deals, accountId, baseBalance);
  const openTrades = normalizeMetaApiPositions(positions, accountId);
  const combinedTrades = [...openTrades, ...closedTrades];

  // 4. Update stored accounts in localStorage (hustle_accounts_v2)
  try {
    const raw = localStorage.getItem('hustle_accounts_v2');
    if (raw) {
      const parsed: Account[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const updated = parsed.map((acc) => {
          // Match by connection externalAccountId, login, or first account
          const matches =
            acc.connection?.externalAccountId === accountId ||
            String(acc.connection?.login) === String(accountInfo.login) ||
            String(acc.accountNumber).replace('#', '') === String(accountInfo.login);

          if (matches) {
            return {
              ...acc,
              currentBalance: accountInfo.balance,
              currentEquity: accountInfo.equity,
              currency: accountInfo.currency || acc.currency || 'USD',
              connection: {
                platform: (accountInfo.platform?.toUpperCase() as 'MT4' | 'MT5') || 'MT5',
                login: String(accountInfo.login),
                investorPassword: acc.connection?.investorPassword || '',
                server: accountInfo.server || acc.serverType || 'FundingPips-SIM1',
                syncStatus: 'connected' as const,
                lastSyncedAt: new Date().toISOString(),
                autoSyncIntervalSec: acc.connection?.autoSyncIntervalSec || 30,
                externalAccountId: accountId,
                metaApiToken: token,
                region: health.region || 'london',
              },
            };
          }
          return acc;
        });

        localStorage.setItem('hustle_accounts_v2', JSON.stringify(updated));
      }
    }
  } catch {}

  // 5. Update stored trades in localStorage (hustle_trading_v1)
  try {
    const existingRaw = localStorage.getItem('hustle_trading_v1');
    const existingTrades: Trade[] = existingRaw ? JSON.parse(existingRaw) : [];
    const nonBroker = Array.isArray(existingTrades)
      ? existingTrades.filter((t) => !t.brokerTradeId && !t.id.startsWith('mt-'))
      : [];

    const merged = [...combinedTrades, ...nonBroker];
    localStorage.setItem('hustle_trading_v1', JSON.stringify(merged));
  } catch {}

  // 6. Dispatch custom events so all mounted React pages reflect changes immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hustle_accounts_updated', { detail: { accountId } }));
  }

  return {
    success: true,
    message: `Connected to ${accountInfo.server} (#${accountInfo.login}). Synced ${closedTrades.length} closed deals and ${openTrades.length} open positions.`,
    accountInfo,
    health,
    balance: accountInfo.balance,
    equity: accountInfo.equity,
    openPositionsCount: openTrades.length,
    closedTradesCount: closedTrades.length,
    trades: combinedTrades,
  };
}

/**
 * Backward compatibility connectors for existing modals and contexts
 */
export async function requestBrokerConnect(params: {
  platform: 'MT4' | 'MT5';
  login: string;
  investorPassword: string;
  server: string;
  accountId: string;
  accessToken?: string;
  metaApiToken?: string;
}): Promise<{ ok: boolean; externalAccountId?: string; balance?: number; equity?: number; isLive: boolean; region?: string }> {
  const syncRes = await testConnectionAndForceSync(params.metaApiToken);
  return {
    ok: true,
    externalAccountId: syncRes.health?.name || params.accountId,
    balance: syncRes.balance,
    equity: syncRes.equity,
    isLive: true,
    region: syncRes.health?.region || 'london',
  };
}

export async function requestBrokerSync(params: {
  accountId: string;
  connection: InvestorConnectionConfig;
  accessToken?: string;
}): Promise<{ trades: Trade[]; balance?: number; equity?: number }> {
  const syncRes = await testConnectionAndForceSync(
    params.connection.metaApiToken,
    params.connection.externalAccountId
  );

  return {
    trades: syncRes.trades,
    balance: syncRes.balance,
    equity: syncRes.equity,
  };
}

export async function requestBrokerDisconnect(params: {
  accountId: string;
  login: string;
  accessToken?: string;
}): Promise<void> {
  localStorage.removeItem('metaapi_token');
  localStorage.removeItem('metaapi_account_id');
}
