/**
 * Broker Integration Page
 * Issue #1: Broker Integration for Automated Data Import
 * Allows users to connect to brokers and automatically import trade data
 */

import { useState, useRef } from 'react';
import { useTradesContext } from '../data/TradesContext';
import { useTheme } from '../data/ThemeContext';
import { brokerService } from '../services/brokerService';
import type { BrokerType, BrokerAccount } from '../data/types-enhanced';
import {
  Plus, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Loader, Link2, Unlink2,
} from 'lucide-react';

type BrokerConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectedBroker {
  account: BrokerAccount;
  status: BrokerConnectionStatus;
  lastSyncedAt: string;
  tradesImported: number;
}

export default function BrokerIntegration() {
  const { trades, importTrades } = useTradesContext();
  const { colors } = useTheme();

  const [connectedBrokers, setConnectedBrokers] = useState<ConnectedBroker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerType | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<BrokerConnectionStatus>('disconnected');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const apiKeyRef = useRef<HTMLInputElement>(null);
  const accountIdRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Connect to Broker ─────────────────────────────────────────────────
  const handleConnectBroker = async () => {
    if (!selectedBroker || !apiKeyRef.current?.value || !accountIdRef.current?.value) {
      showToast('Please fill in all fields', false);
      return;
    }

    setConnectionStatus('connecting');
    try {
      const account = await brokerService.connectBroker(selectedBroker, {
        apiKey: apiKeyRef.current.value,
        accountId: accountIdRef.current.value,
      });

      if (account) {
        setConnectedBrokers([
          ...connectedBrokers,
          {
            account,
            status: 'connected',
            lastSyncedAt: new Date().toISOString(),
            tradesImported: 0,
          },
        ]);
        setConnectionStatus('connected');
        showToast(`Connected to ${selectedBroker}!`);
        setShowModal(false);
        // Clear inputs
        if (apiKeyRef.current) apiKeyRef.current.value = '';
        if (accountIdRef.current) accountIdRef.current.value = '';
      } else {
        setConnectionStatus('error');
        showToast('Failed to connect to broker', false);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      showToast(error.message || 'Connection error', false);
    }
  };

  // ─── Sync Trades from Broker ──────────────────────────────────────────
  const handleSyncTrades = async (brokerAccount: BrokerAccount) => {
    setIsSyncing(true);
    try {
      const response = await brokerService.syncTrades(brokerAccount.brokerType);

      if (response.success) {
        // Update connected brokers list
        setConnectedBrokers(
          connectedBrokers.map((b) =>
            b.account.id === brokerAccount.id
              ? {
                  ...b,
                  lastSyncedAt: new Date().toISOString(),
                  tradesImported: b.tradesImported + response.tradesImported,
                }
              : b
          )
        );
        showToast(`Synced ${response.tradesImported} trades!`);
      } else {
        showToast(response.message, false);
      }
    } catch (error: any) {
      showToast(error.message || 'Sync failed', false);
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── Disconnect Broker ────────────────────────────────────────────────
  const handleDisconnect = async (brokerAccount: BrokerAccount) => {
    try {
      await brokerService.disconnectBroker(brokerAccount.brokerType);
      setConnectedBrokers(connectedBrokers.filter((b) => b.account.id !== brokerAccount.id));
      showToast('Disconnected from broker');
    } catch (error: any) {
      showToast(error.message || 'Disconnect failed', false);
    }
  };

  return (
    <div style={{ background: colors.background, color: colors.text, minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            🔗 Broker Integration
          </h1>
          <p style={{ color: colors.textMuted }}>
            Connect your trading broker to automatically import trade data and eliminate manual entry.
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              padding: '1rem 1.5rem',
              borderRadius: '0.5rem',
              background: toast.ok ? '#10b981' : '#ef4444',
              color: 'white',
              zIndex: 1000,
            }}
          >
            {toast.msg}
          </div>
        )}

        {/* Connected Brokers Section */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.75rem',
            marginBottom: '2rem',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Connected Brokers</h2>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <Plus size={16} /> Connect Broker
              </button>
            </div>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {connectedBrokers.length === 0 ? (
              <p style={{ color: colors.textMuted, textAlign: 'center', padding: '2rem' }}>
                No brokers connected yet. Click "Connect Broker" to get started.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {connectedBrokers.map((broker) => (
                  <div
                    key={broker.account.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '1rem',
                      padding: '1rem',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.5rem',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontWeight: '600' }}>{broker.account.accountName}</h3>
                        {broker.status === 'connected' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
                            <CheckCircle2 size={14} /> Connected
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: colors.textMuted, marginBottom: '0.5rem' }}>
                        Account: {broker.account.accountNumber} • Balance: ${broker.account.balance.toFixed(2)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                        Last synced: {new Date(broker.lastSyncedAt).toLocaleString()} • Trades imported: {broker.tradesImported}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleSyncTrades(broker.account)}
                        disabled={isSyncing}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: isSyncing ? 'not-allowed' : 'pointer',
                          opacity: isSyncing ? 0.6 : 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {isSyncing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                        Sync
                      </button>
                      <button
                        onClick={() => handleDisconnect(broker.account)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}
                      >
                        <Unlink2 size={14} /> Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supported Brokers Info */}
        <div
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '0.75rem',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>📋 Supported Brokers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {[
              { name: 'Interactive Brokers', icon: '🏦', status: 'Coming Soon' },
              { name: 'MetaTrader 5', icon: '📊', status: 'Coming Soon' },
              { name: 'cTrader', icon: '💱', status: 'Coming Soon' },
              { name: 'TradingView', icon: '📈', status: 'Planned' },
            ].map((broker) => (
              <div
                key={broker.name}
                style={{
                  padding: '1rem',
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{broker.icon}</div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{broker.name}</p>
                <p style={{ fontSize: '0.875rem', color: colors.textMuted }}>{broker.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Connect Broker</h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Broker</label>
              <select
                value={selectedBroker || ''}
                onChange={(e) => setSelectedBroker(e.target.value as BrokerType)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  background: colors.background,
                  color: colors.text,
                }}
              >
                <option value="">Choose a broker...</option>
                <option value="interactive-brokers">Interactive Brokers</option>
                <option value="metatrader">MetaTrader 5</option>
                <option value="ctrader">cTrader</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>API Key</label>
              <input
                ref={apiKeyRef}
                type="password"
                placeholder="Enter your API key"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  background: colors.background,
                  color: colors.text,
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Account ID</label>
              <input
                ref={accountIdRef}
                type="text"
                placeholder="Enter your account ID"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '0.375rem',
                  background: colors.background,
                  color: colors.text,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: colors.border,
                  color: colors.text,
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConnectBroker}
                disabled={connectionStatus === 'connecting'}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: connectionStatus === 'connecting' ? 'not-allowed' : 'pointer',
                  opacity: connectionStatus === 'connecting' ? 0.6 : 1,
                }}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
