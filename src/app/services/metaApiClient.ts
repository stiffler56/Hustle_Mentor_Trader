/**
 * Direct REST Client for MetaApi Cloud MT4 / MT5
 * Clean, zero-dependency implementation using browser and edge-compatible fetch
 */

export interface MetaApiAccountInformation {
  platform: 'mt4' | 'mt5';
  type: string;
  broker: string;
  currency: string;
  currencyDigits: number;
  server: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  tradeAllowed: boolean;
  investorMode: boolean;
  marginMode?: string;
  name?: string;
  login: number | string;
  credit?: number;
}

export interface MetaApiPosition {
  id: string;
  platform?: string;
  type: 'POSITION_TYPE_BUY' | 'POSITION_TYPE_SELL' | string;
  symbol: string;
  magic?: number;
  time?: string;
  brokerTime?: string;
  openPrice: number;
  currentPrice: number;
  volume: number;
  swap: number;
  profit: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

export interface MetaApiDeal {
  id: string;
  platform?: string;
  type: string;
  time: string;
  brokerTime?: string;
  commission: number;
  swap: number;
  profit: number;
  symbol?: string;
  magic?: number;
  orderId?: string;
  positionId?: string;
  volume?: number;
  price?: number;
  entryType?: 'DEAL_ENTRY_IN' | 'DEAL_ENTRY_OUT' | 'DEAL_ENTRY_INOUT' | 'DEAL_ENTRY_OUT_BY' | string;
  reason?: string;
  comment?: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MetaApiHealthStatus {
  isDeployed: boolean;
  isConnected: boolean;
  state: string;
  connectionStatus: string;
  server?: string;
  login?: number | string;
  region?: string;
  name?: string;
  platform?: string;
}

export class MetaApiClient {
  private static defaultToken: string = '';
  private static defaultAccountId: string = '';

  /**
   * Retrieves active credentials from localStorage or env vars
   */
  public static getCredentials(): { token: string; accountId: string } {
    const token =
      localStorage.getItem('metaapi_token') ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_METAAPI_TOKEN) ||
      this.defaultToken ||
      '';

    const accountId =
      localStorage.getItem('metaapi_account_id') ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_METAAPI_ACCOUNT_ID) ||
      this.defaultAccountId ||
      '';

    return { token: token.trim(), accountId: accountId.trim() };
  }

  /**
   * Saves credentials into localStorage
   */
  public static saveCredentials(token: string, accountId: string): void {
    if (token) localStorage.setItem('metaapi_token', token.trim());
    if (accountId) localStorage.setItem('metaapi_account_id', accountId.trim());
  }

  /**
   * Resolves endpoints to query with fallback support (Proxy, Regional, and Root)
   */
  private static getClientBaseUrls(region: string = 'london'): string[] {
    const urls: string[] = [];
    if (typeof window !== 'undefined') {
      urls.push('/api-metaapi-client');
    }
    if (region) {
      urls.push(`https://mt-client-api-v1.${region}.agiliumtrade.ai`);
    }
    urls.push('https://mt-client-api-v1.london.agiliumtrade.ai');
    urls.push('https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai');
    return urls;
  }

  private static getProvisioningBaseUrls(): string[] {
    const urls: string[] = [];
    if (typeof window !== 'undefined') {
      urls.push('/api-metaapi-provisioning');
    }
    urls.push('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai');
    return urls;
  }

  private static async executeWithFallback(
    baseUrls: string[],
    path: string,
    authToken: string,
    options: RequestInit = {}
  ): Promise<any> {
    let lastError: Error | null = null;

    for (const base of baseUrls) {
      try {
        const fullUrl = `${base}${path.startsWith('/') ? path : `/${path}`}`;
        const res = await fetch(fullUrl, {
          ...options,
          headers: {
            'auth-token': authToken,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        });

        const text = await res.text();
        let json: any = null;
        try {
          json = JSON.parse(text);
        } catch {}

        if (res.ok) {
          return json ?? text;
        }

        if (res.status === 401) {
          throw new Error('MetaApi access token is invalid or expired. Check your token in Settings.');
        }

        if (res.status === 404 && base.startsWith('/')) {
          // Local Vite proxy returned 404, try next direct remote URL
          continue;
        }

        if (json?.message) {
          throw new Error(json.message);
        }

        throw new Error(`HTTP ${res.status}: ${text.slice(0, 150)}`);
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to reach MetaApi server.');
  }

  /**
   * 1. Get Account Information (balance, equity, margin, leverage, etc.)
   */
  public static async getAccountInformation(
    accountId?: string,
    tokenOverride?: string,
    regionOverride?: string
  ): Promise<MetaApiAccountInformation> {
    const { token, accountId: defaultId } = this.getCredentials();
    const id = accountId || defaultId;
    const authToken = tokenOverride || token;

    if (!authToken) throw new Error('MetaApi auth token is missing.');
    if (!id) throw new Error('MetaTrader account ID is missing.');

    const region = regionOverride || localStorage.getItem('metaapi_region') || 'london';
    const clientBases = this.getClientBaseUrls(region);

    // Try both /account-information and /information
    try {
      return await this.executeWithFallback(clientBases, `/users/current/accounts/${id}/account-information`, authToken);
    } catch {
      return await this.executeWithFallback(clientBases, `/users/current/accounts/${id}/information`, authToken);
    }
  }

  /**
   * 2. Get Open Positions
   */
  public static async getPositions(
    accountId?: string,
    tokenOverride?: string,
    regionOverride?: string
  ): Promise<MetaApiPosition[]> {
    const { token, accountId: defaultId } = this.getCredentials();
    const id = accountId || defaultId;
    const authToken = tokenOverride || token;

    if (!authToken) throw new Error('MetaApi auth token is missing.');
    if (!id) throw new Error('MetaTrader account ID is missing.');

    const region = regionOverride || localStorage.getItem('metaapi_region') || 'london';
    const clientBases = this.getClientBaseUrls(region);

    const positions = await this.executeWithFallback(
      clientBases,
      `/users/current/accounts/${id}/positions`,
      authToken
    );

    return Array.isArray(positions) ? positions : [];
  }

  /**
   * 3. Get Deal History (Closed Execution Deals)
   */
  public static async getHistoryDeals(
    accountId?: string,
    startTime: string = '2020-01-01T00:00:00.000Z',
    endTime?: string,
    tokenOverride?: string,
    regionOverride?: string
  ): Promise<MetaApiDeal[]> {
    const { token, accountId: defaultId } = this.getCredentials();
    const id = accountId || defaultId;
    const authToken = tokenOverride || token;

    if (!authToken) throw new Error('MetaApi auth token is missing.');
    if (!id) throw new Error('MetaTrader account ID is missing.');

    const end = endTime || new Date().toISOString();
    const region = regionOverride || localStorage.getItem('metaapi_region') || 'london';
    const clientBases = this.getClientBaseUrls(region);

    const deals = await this.executeWithFallback(
      clientBases,
      `/users/current/accounts/${id}/history-deals/time/${encodeURIComponent(startTime)}/${encodeURIComponent(end)}`,
      authToken
    );

    return Array.isArray(deals) ? deals : [];
  }

  /**
   * 4. Connection Health Check (Verifies if deployed & connected)
   */
  public static async getConnectionHealth(
    accountId?: string,
    tokenOverride?: string
  ): Promise<MetaApiHealthStatus> {
    const { token, accountId: defaultId } = this.getCredentials();
    const id = accountId || defaultId;
    const authToken = tokenOverride || token;

    if (!authToken) throw new Error('MetaApi auth token is missing.');
    if (!id) throw new Error('MetaTrader account ID is missing.');

    const provBases = this.getProvisioningBaseUrls();
    const account = await this.executeWithFallback(provBases, `/users/current/accounts/${id}`, authToken);

    if (account?.region) {
      localStorage.setItem('metaapi_region', account.region);
    }

    const isDeployed = account?.state === 'DEPLOYED';
    const isConnected = account?.connectionStatus === 'CONNECTED';

    return {
      isDeployed,
      isConnected,
      state: account?.state || 'UNKNOWN',
      connectionStatus: account?.connectionStatus || 'DISCONNECTED',
      server: account?.server,
      login: account?.login,
      region: account?.region,
      name: account?.name,
      platform: account?.platform,
    };
  }

  /**
   * 5. Get all accounts provisioned under current token
   */
  public static async getProvisionedAccounts(tokenOverride?: string): Promise<any[]> {
    const { token } = this.getCredentials();
    const authToken = tokenOverride || token;
    if (!authToken) throw new Error('MetaApi auth token is missing.');

    const provBases = this.getProvisioningBaseUrls();
    const res = await this.executeWithFallback(provBases, '/users/current/accounts', authToken);
    return Array.isArray(res) ? res : [];
  }

  /**
   * 6. Find existing provisioned account matching login number
   */
  public static async findAccountByLogin(login: string, tokenOverride?: string): Promise<any | null> {
    const accounts = await this.getProvisionedAccounts(tokenOverride);
    const cleanLogin = String(login).replace(/#/g, '').trim();
    return accounts.find((a: any) => String(a.login).replace(/#/g, '').trim() === cleanLogin) || null;
  }

  /**
   * 7. Provision new MT4 / MT5 account on MetaApi
   */
  public static async provisionAccount(
    params: {
      name?: string;
      login: string;
      server: string;
      password?: string;
      platform?: string;
    },
    tokenOverride?: string
  ): Promise<any> {
    const { token } = this.getCredentials();
    const authToken = tokenOverride || token;
    if (!authToken) throw new Error('MetaApi auth token is missing.');

    const provBases = this.getProvisioningBaseUrls();
    const cleanLogin = String(params.login).replace(/#/g, '').trim();

    return await this.executeWithFallback(provBases, '/users/current/accounts', authToken, {
      method: 'POST',
      body: JSON.stringify({
        name: params.name || `FundingPips-${cleanLogin}`,
        type: 'cloud',
        login: cleanLogin,
        server: params.server.trim(),
        password: params.password?.trim(),
        platform: (params.platform || 'mt5').toLowerCase(),
        magic: 0,
        quoteStreamingIntervalInSeconds: 2.5,
      }),
    });
  }

  /**
   * 8. Deploy account to server
   */
  public static async deployAccount(accountId: string, tokenOverride?: string): Promise<void> {
    const { token } = this.getCredentials();
    const authToken = tokenOverride || token;
    if (!authToken) throw new Error('MetaApi auth token is missing.');

    const provBases = this.getProvisioningBaseUrls();
    await this.executeWithFallback(provBases, `/users/current/accounts/${accountId}/deploy`, authToken, {
      method: 'POST',
    }).catch(() => {});
  }

  /**
   * 9. Wait for account to be deployed and connected to broker
   */
  public static async waitForConnected(
    accountId: string,
    tokenOverride?: string,
    maxWaitMs: number = 25000,
    onStatus?: (statusText: string) => void
  ): Promise<MetaApiHealthStatus> {
    const start = Date.now();
    let health = await this.getConnectionHealth(accountId, tokenOverride);

    while (Date.now() - start < maxWaitMs) {
      if (health.isDeployed && health.isConnected) {
        return health;
      }

      if (!health.isDeployed) {
        onStatus?.(`Deploying MT5 terminal on cloud (${health.state})...`);
        await this.deployAccount(accountId, tokenOverride).catch(() => {});
      } else {
        onStatus?.(`Connecting terminal to ${health.server || 'broker'} (${health.connectionStatus})...`);
      }

      await new Promise((r) => setTimeout(r, 2500));
      health = await this.getConnectionHealth(accountId, tokenOverride).catch(() => health);
    }

    return health;
  }
}
