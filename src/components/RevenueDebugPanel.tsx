/**
 * RevenueDebugPanel
 *
 * Operator-only panel that shows whether SolSwap builder fees are
 * actually reaching the on-chain RevenueShareAccount.
 *
 * Activation:  Add ?debug=revenue to any URL on perps.solswap.cloud
 * Example:     https://perps.solswap.cloud/?debug=revenue
 *
 * NEVER visible to regular users — query param required.
 */

import React, { useEffect, useState } from 'react';
import { useBuilderRevenue } from '@/hooks/useBuilderRevenue';
import { useDriftClient } from '@/hooks/useDriftClient';
import { DRIFT_CONFIG } from '@/config/driftConfig';

// Only render if ?debug=revenue is present
function useDebugMode(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setActive(params.get('debug') === 'revenue');
    }
  }, []);
  return active;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const Badge = ({ ok, label }: { ok: boolean | null; label: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: '999px',
      background: ok === null ? '#2D2E42' : ok ? '#00FFA310' : '#FF4D6D10',
      color: ok === null ? '#8B8EA8' : ok ? '#00FFA3' : '#FF4D6D',
      border: `1px solid ${ok === null ? '#2D2E42' : ok ? '#00FFA330' : '#FF4D6D30'}`,
    }}
  >
    {ok === null ? '⏳' : ok ? '✅' : '❌'} {label}
  </span>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function RevenueDebugPanel() {
  const isDebug = useDebugMode();
  const { driftClient, onboardingStatus } = useDriftClient();
  const { stats, isLoading, refresh } = useBuilderRevenue(driftClient);

  useEffect(() => {
    if (isDebug && driftClient) {
      refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDebug, driftClient]);

  if (!isDebug) return null;

  const builderWallet = DRIFT_CONFIG.builderInfo.builder.toBase58();
  const feePercent = (DRIFT_CONFIG.builderInfo.builderFee / 100).toFixed(2);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        width: '380px',
        background: '#0D1117',
        border: '1px solid #7B61FF50',
        borderRadius: '12px',
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(123,97,255,0.2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: '#7B61FF', fontWeight: 700, fontSize: '13px' }}>
          🔍 SolSwap Revenue Debug
        </span>
        <span style={{ color: '#8B8EA8' }}>
          {stats.lastChecked ? new Date(stats.lastChecked).toLocaleTimeString() : '—'}
        </span>
      </div>

      {/* Builder Config */}
      <div style={{ marginBottom: '12px', color: '#8B8EA8' }}>
        <div>
          Builder: <span style={{ color: '#00D1FF' }}>{builderWallet.slice(0, 8)}...{builderWallet.slice(-8)}</span>
        </div>
        <div>Fee: <span style={{ color: '#00D1FF' }}>{feePercent}% ({DRIFT_CONFIG.builderInfo.builderFee} bps)</span></div>
      </div>

      {/* Status Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <Badge ok={stats.accountExists} label="RevenueShareAccount" />
        <Badge
          ok={onboardingStatus === 'ready' ? true : onboardingStatus === 'checking' ? null : false}
          label={`Onboarding: ${onboardingStatus}`}
        />
      </div>

      {/* Revenue Stats */}
      <div
        style={{
          background: '#05070A',
          borderRadius: '8px',
          padding: '10px',
          marginBottom: '12px',
        }}
      >
        {stats.error ? (
          <div style={{ color: '#FF4D6D' }}>⚠️ {stats.error}</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#8B8EA8' }}>Total Fees Collected</span>
              <span style={{ color: stats.totalFeesUSDC > 0 ? '#00FFA3' : '#8B8EA8', fontWeight: 700 }}>
                ${stats.totalFeesUSDC.toFixed(4)} USDC
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#8B8EA8' }}>Pending (Unclaimed)</span>
              <span style={{ color: '#00D1FF', fontWeight: 700 }}>
                ${stats.pendingFeesUSDC.toFixed(4)} USDC
              </span>
            </div>
            {stats.totalFeesUSDC === 0 && stats.accountExists && (
              <div style={{ color: '#FFA500', marginTop: '8px', fontSize: '11px' }}>
                ⚠️ Account exists but 0 fees. Make a real trade to verify.
              </div>
            )}
          </>
        )}
      </div>

      {/* Solscan Link */}
      <div style={{ marginBottom: '10px', fontSize: '11px' }}>
        <a
          href={`https://solscan.io/account/${builderWallet}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#7B61FF', textDecoration: 'underline' }}
        >
          View builder wallet on Solscan ↗
        </a>
      </div>

      {/* Refresh Button */}
      <button
        onClick={refresh}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '8px',
          background: isLoading ? '#1A1B2E' : '#7B61FF20',
          border: '1px solid #7B61FF50',
          borderRadius: '8px',
          color: '#7B61FF',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          fontSize: '12px',
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? '⏳ Checking on-chain...' : '🔄 Force Re-check'}
      </button>
    </div>
  );
}
