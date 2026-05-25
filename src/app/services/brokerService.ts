/**
 * Broker Integration Service
 * Handles connections to various brokers and trade data import/export
 */

import type { BrokerAccount, BrokerTrade, Trade, BrokerSyncResponse } from '../data/types-enhanced';
import { MetaApi, MetatraderAccount } from 'metaapi.cloud-sdk';

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
      // In production, verify credentials with IB API
      console.log('[IB] Authenticating with Interactive Brokers...');
      return true;
    } catch (error) {
      console.error('[IB] Authentication failed:', error);
      return false;
    }
  }

  async getAccount(): Promise<BrokerAccount> {
    // TODO: Implement actual IB API call
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
    // TODO: Implement actual IB API call to fetch trades
    console.log('[IB] Fetching trades from', startDate, 'to', endDate);
    return [];
  }

  async disconnect(): Promise<void> {
    console.log('[IB] Disconnecting...');
  }
}

// ─── MetaTrader 5 Connector ────────────────────────────────────────────────
class MetaTrader5Connector implements IBrokerConnector {
  private metaApi: MetaApi | null = null;
  private account: MetatraderAccount | null = null;
  private accountId: string = '';

  async authenticate(credentials: Record<string, string>): Promise<boolean> {
    try {
      this.accountId = credentials.accountId;
      console.log('[MT5] Authenticating with MetaTrader 5...');
      this.metaApi = new MetaApi(credentials.apiKey);
      const accounts = await this.metaApi.getMetatraderAccounts();
      this.account = accounts.find(acc => acc.login === credentials.accountId && acc.type === 'mt5');

      if (this.account) {
        await this.account.waitConnected();
        console.log('[MT5] Connected to MetaApi account:', this.account.name);
        return true;
      } else {
        console.error('[MT5] MetaApi account not found or not MT5:', credentials.accountId);
        return false;
      }
    } catch (error) {
      console.error('[MT5] Authentication failed:', error);
      return false;
    }
  }

  async getAccount(): Promise<BrokerAccount> {
    if (!this.account) throw new Error('MetaTrader 5 account not connected.');

    const accountInfo = await this.account.getAccountInformation();
    const metrics = await this.account.getDailyMetrics();

    return {
      id: this.account.id,
      brokerType: 'metatrader',
      accountNumber: this.account.login,
      accountName: this.account.name,
      currency: accountInfo.currency,
      balance: accountInfo.balance,
      equity: accountInfo.equity,
      usedMargin: accountInfo.margin,
      freeMargin: accountInfo.freeMargin,
      marginLevel: accountInfo.marginLevel,
      lastSyncedAt: new Date().toISOString(),
      isActive: this.account.connectionStatus === 'connected',
    };
  }

  async getTrades(startDate?: string, endDate?: string): Promise<BrokerTrade[]> {
    if (!this.account) throw new Error('MetaTrader 5 account not connected.');

    const historyOrders = await this.account.getHistoryOrdersByTime(new Date(startDate || 0).toISOString(), new Date(endDate || Date.now()).toISOString());

    return historyOrders.map(order => ({
      id: order.id,
      brokerAccountId: this.account!.id,
      symbol: order.symbol,
      type: order.type,
      volume: order.volume,
      openTime: new Date(order.openTime).toISOString(),
      closeTime: order.closeTime ? new Date(order.closeTime).toISOString() : undefined,
      openPrice: order.openPrice,
      closePrice: order.closePrice,
      profit: order.profit,
      commission: order.commission,
      swap: order.swap,
      comment: order.comment,
      status: order.state,
    }));
  }

  async disconnect(): Promise<void> {
    if (this.account) {
      await this.account.disconnect();
      console.log('[MT5] Disconnecting from MetaApi account:', this.account.name);
    }
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

    return await connector.getAccount();
  }

  /**
   * Sync trades from broker
   */
  async syncTrades(
    brokerType: string,
    startDate?: string,
    endDate?: string
  ): Promise<BrokerSyncResponse> {
    const connector = this.connectors.get(brokerType);
    if (!connector) {
      return {
        success: false,
        message: `Broker type ${brokerType} not supported`,
        tradesImported: 0,
        tradesUpdated: 0,
      };
    }

    try {
      const brokerTrades = await connector.getTrades(startDate, endDate);
      return {
        success: true,
        message: `Successfully imported ${brokerTrades.length} trades`,
        tradesImported: brokerTrades.length,
        tradesUpdated: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to sync trades',
        tradesImported: 0,
        tradesUpdated: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Convert broker trade to HustleDashboard trade format
   */
  convertBrokerTradeToHustleTrade(brokerTrade: BrokerTrade): Partial<Trade> {
    return {
      brokerTradeId: brokerTrade.id,
      brokerAccountId: brokerTrade.brokerAccountId,
      brokerType: 'metatrader', // Will be set based on context
      date: new Date(brokerTrade.openTime).toISOString().split('T')[0],
      pair: brokerTrade.pair,
      orderType: brokerTrade.orderType,
      entryPrice: brokerTrade.entryPrice,
      exitPrice: brokerTrade.exitPrice,
      quantity: brokerTrade.quantity,
      commission: brokerTrade.commission,
      actualPnL: brokerTrade.pnl,
      pnl: brokerTrade.pnl,
      status: brokerTrade.status,
      result: brokerTrade.pnl > 0 ? 'WIN' : brokerTrade.pnl < 0 ? 'LOSS' : 'BE',
      createdAt: brokerTrade.openTime,
      closedAt: brokerTrade.closeTime,
    };
  }

  /**
   * Disconnect from broker
   */
  async disconnectBroker(brokerType: string): Promise<void> {
    const connector = this.connectors.get(brokerType);
    if (connector) {
      await connector.disconnect();
    }
  }
}

export const brokerService = new BrokerService();
