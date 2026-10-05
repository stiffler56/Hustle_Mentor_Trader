/**
 * Broker Integration Service
 * Handles connections to various brokers and trade data import/export
 * Modernized direct REST implementation for MetaTrader 5 via MetaApiClient
 */

import type { BrokerAccount, BrokerTrade, Trade, BrokerSyncResponse } from '../data/types-enhanced';
import { MetaApiClient } from './metaApiClient';
import { testConnectionAndForceSync } from '../utils/brokerSync';

// ─── Broker API Interfaces ─────────────────────────────────────────────────
interface IBrokerConnector {
  authenticate(credentials: Record<string, string>): Promise<boolean>;
  getAccount(): Promise<BrokerAccount>;
  getTrades(startDate?: string, endDate?: string): Promise<BrokerTrade[]>;
  disconnect(): Promise<void>;
}

// ─── Interactive Brokers Connector ──────────────────────────────────────────
class InteractiveBrokersConnector implements IBrokerConnector {
  private apiKey: string = '';
  private accountId: string = '';

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      this.apiKey = credentials.apiKey;
      this.accountId = credentials.accountId;
      console.log('[IB] Authenticating with Interactive Brokers...');
      return true;
    } catch (error) {
      console.error('[IB] Authentication failed:', error);
      return false;
    }
  }

  async getAccount(): Promise<BrokerAccount> {
    return {
      id: this.accountId,
      brokerType: 'interactive-brokers',
      accountNumber: this.accountId,
      accountName: 'Interactive Brokers Account',
      currency: 'USD',
      balance: 0,
      equity: 0,
      usedMargin: 0,
      freeMargin: 0,
      marginLevel: 0,
      lastSyncedAt: new Date().toISOString(),
      isActive: true,
    };
  }

  async getTrades(startDate?: string, endDate?: string): Promise<BrokerTrade[]> {
    console.log('[IB] Fetching trades from', startDate, 'to', endDate);
    return [];
  }

  async disconnect(): Promise<void> {
    console.log('[IB] Disconnecting...');
  }
}

// ─── MetaTrader 5 Connector (Modern Direct REST API) ───────────────────────
class MetaTrader5Connector implements IBrokerConnector {
  private accountId: string = '';
  private token: string = '';
  private accountInfo: any = null;

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      this.accountId = credentials.accountId || MetaApiClient.getCredentials().accountId;
      this.token = credentials.apiKey || credentials.token || MetaApiClient.getCredentials().token;

      if (!this.accountId || !this.token) {
        throw new Error('Both MetaApi token and MetaTrader 5 account ID are required.');
      }

      const health = await MetaApiClient.getConnectionHealth(this.accountId, this.token);
      this.accountInfo = await MetaApiClient.getAccountInformation(this.accountId, this.token, health.region);
      MetaApiClient.saveCredentials(this.token, this.accountId);
      return true;
    } catch (error: any) {
      console.error('[MT5] Authentication failed:', error.message || error);
      return false;
    }
  }

  async getAccount(): Promise<BrokerAccount> {
    if (!this.accountInfo) {
      this.accountInfo = await MetaApiClient.getAccountInformation(this.accountId, this.token);
    }

    return {
      id: this.accountId,
      brokerType: 'metatrader',
      accountNumber: String(this.accountInfo.login || '20823275'),
      accountName: this.accountInfo.name || this.accountInfo.broker || 'FundingPips Account',
      currency: this.accountInfo.currency || 'USD',
      balance: this.accountInfo.balance,
      equity: this.accountInfo.equity,
      usedMargin: this.accountInfo.margin || 0,
      freeMargin: this.accountInfo.freeMargin || this.accountInfo.balance,
      marginLevel: this.accountInfo.marginLevel || 0,
      lastSyncedAt: new Date().toISOString(),
      isActive: true,
    };
  }

  async getTrades(startDate?: string, endDate?: string): Promise<BrokerTrade[]> {
    const deals = await MetaApiClient.getHistoryDeals(
      this.accountId,
      startDate || '2020-01-01T00:00:00.000Z',
      endDate || new Date().toISOString(),
      this.token
    );

    return deals.map((d) => ({
      id: d.id,
      brokerAccountId: this.accountId,
      symbol: (d.symbol || 'XAUUSD').replace('/', '').toUpperCase(),
      type: String(d.type || '').includes('SELL') ? 'SELL' : 'BUY',
      volume: d.volume || 1,
      openTime: new Date(d.time || Date.now()).toISOString(),
      closeTime: new Date(d.time || Date.now()).toISOString(),
      openPrice: d.price || 0,
      closePrice: d.price || 0,
      profit: d.profit || 0,
      commission: d.commission || 0,
      swap: d.swap || 0,
      comment: d.comment,
      status: 'closed',
    }));
  }

  async disconnect(): Promise<void> {
    this.accountId = '';
    this.token = '';
    this.accountInfo = null;
  }
}

// ─── cTrader Connector ─────────────────────────────────────────────────────
class CTraderConnector implements IBrokerConnector {
  private clientId: string = '';

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      this.clientId = credentials.clientId;
      console.log('[cTrader] Authenticating with cTrader...');
      return true;
    } catch (error) {
      console.error('[cTrader] Authentication failed:', error);
      return false;
    }
  }

  async getAccount(): Promise<BrokerAccount> {
    return {
      id: this.clientId,
      brokerType: 'ctrader',
      accountNumber: this.clientId,
      accountName: 'cTrader Account',
      currency: 'USD',
      balance: 0,
      equity: 0,
      usedMargin: 0,
      freeMargin: 0,
      marginLevel: 0,
      lastSyncedAt: new Date().toISOString(),
      isActive: true,
    };
  }

  async getTrades(startDate?: string, endDate?: string): Promise<BrokerTrade[]> {
    console.log('[cTrader] Fetching trades from', startDate, 'to', endDate);
    return [];
  }

  async disconnect(): Promise<void> {
    console.log('[cTrader] Disconnecting...');
  }
}

// ─── Broker Service Factory ────────────────────────────────────────────────
export class BrokerService {
  private connectors: Map<string, IBrokerConnector> = new Map();

  constructor() {
    this.connectors.set('interactive-brokers', new InteractiveBrokersConnector());
    this.connectors.set('metatrader', new MetaTrader5Connector());
    this.connectors.set('ctrader', new CTraderConnector());
  }

  /**
   * Connect to a broker and authenticate
   */
  async connectBroker(
    brokerType: string,
    credentials: Record<string, string>
  ): Promise<BrokerAccount | null> {
    const connector = this.connectors.get(brokerType);
    if (!connector) {
      console.error(`Broker type ${brokerType} not supported`);
      return null;
    }

    const authenticated = await connector.authenticate(credentials);
    if (!authenticated) return null;

    return connector.getAccount();
  }

  /**
   * Sync trades from broker directly
   */
  async syncTrades(brokerType: string): Promise<BrokerSyncResponse> {
    if (brokerType === 'metatrader') {
      try {
        const result = await testConnectionAndForceSync();
        return {
          success: true,
          tradesImported: result.closedTradesCount + result.openPositionsCount,
          lastSyncedAt: new Date().toISOString(),
          message: result.message,
        };
      } catch (err: any) {
        return {
          success: false,
          tradesImported: 0,
          lastSyncedAt: new Date().toISOString(),
          message: err.message || 'Sync failed',
        };
      }
    }

    const connector = this.connectors.get(brokerType);
    if (!connector) {
      return {
        success: false,
        tradesImported: 0,
        lastSyncedAt: new Date().toISOString(),
        message: 'Broker not connected',
      };
    }

    try {
      const brokerTrades = await connector.getTrades();
      return {
        success: true,
        tradesImported: brokerTrades.length,
        lastSyncedAt: new Date().toISOString(),
        message: `Successfully imported ${brokerTrades.length} trades`,
      };
    } catch (error: any) {
      return {
        success: false,
        tradesImported: 0,
        lastSyncedAt: new Date().toISOString(),
        message: error.message || 'Failed to sync trades',
      };
    }
  }

  /**
   * Disconnect from a broker
   */
  async disconnectBroker(brokerType: string): Promise<boolean> {
    const connector = this.connectors.get(brokerType);
    if (!connector) return false;

    try {
      await connector.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get active connected account for a broker
   */
  async getActiveAccount(brokerType: string): Promise<BrokerAccount | null> {
    const connector = this.connectors.get(brokerType);
    if (!connector) return null;

    try {
      return await connector.getAccount();
    } catch {
      return null;
    }
  }
}

export const brokerService = new BrokerService();
