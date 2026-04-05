/**
 * analytics.ts
 *
 * Lightweight event tracking wrapper for SolSwap Perps.
 * Logs all events to the browser console.
 * Optionally sends events to a self-hosted Umami / Plausible instance
 * or any custom endpoint via NEXT_PUBLIC_ANALYTICS_ENDPOINT.
 *
 * Privacy-first:
 *  - No PII collected
 *  - Wallet addresses are hashed (first 8 chars only)
 *  - No third-party analytics (no Google, no Meta)
 *
 * Usage:
 *   import { track } from '@/utils/analytics';
 *   track('trade_submitted', { market: 'SOL-PERP', side: 'long' });
 */

const ENDPOINT =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
    : undefined;

const IS_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | 'wallet_connected'
  | 'wallet_disconnected'
  | 'enable_trading_clicked'
  | 'escrow_initialized'
  | 'builder_approved'
  | 'trade_submitted'
  | 'trade_confirmed'
  | 'trade_failed'
  | 'fees_estimated'
  | 'preflight_check_passed'
  | 'preflight_check_failed'
  | 'preflight_recovery_triggered'
  | 'order_status_viewed'
  | 'debug_panel_opened';

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 * Always logs to console. Optionally sends to analytics endpoint.
 */
export function track(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean | null | undefined>
): void {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...props,
  };

  // Always log for operator visibility
  console.info(`[analytics] ${event}`, payload);

  // Send to endpoint if configured
  if (IS_ENABLED && ENDPOINT) {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true, // Survive page unload
      }).catch(() => {
        // Silently ignore network errors — analytics must never break the app
      });
    } catch {
      // Ignore
    }
  }
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/** Mask a wallet address for privacy (first 8 chars + ellipsis) */
export function maskWallet(address: string): string {
  if (!address || address.length < 8) return address;
  return `${address.slice(0, 8)}…`;
}

/** Called once when the wallet connects */
export function trackWalletConnected(address: string): void {
  track('wallet_connected', { wallet: maskWallet(address) });
}

/** Called right before placeOrder is sent */
export function trackTradeSubmitted(params: {
  market: string;
  side: 'long' | 'short';
  size: number;
  orderType: 'market' | 'limit';
}): void {
  track('trade_submitted', params);
}

/** Called when placePerpOrder confirms */
export function trackTradeConfirmed(txSig: string, market: string): void {
  track('trade_confirmed', {
    txSig: txSig.slice(0, 16),
    market,
  });
}

/** Called when placePerpOrder fails */
export function trackTradeFailed(reason: string, market: string): void {
  track('trade_failed', {
    reason: reason.slice(0, 120),
    market,
  });
}
