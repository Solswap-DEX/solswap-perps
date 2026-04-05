/**
 * OrderStatusBar
 *
 * Floating status bar that shows the result of the most recent trade attempt.
 * Appears at the bottom of the order form, auto-dismisses after 8 seconds.
 *
 * States:
 *   pending  → spinner + "Signing transaction…"
 *   signing  → spinner + "Waiting for confirmation…"
 *   success  → ✅ green badge with TX hash + Solscan link
 *   error    → ❌ red badge with human-readable error message
 */

import React, { useEffect, useRef } from 'react';

export type OrderStatusState =
  | { status: 'idle' }
  | { status: 'pending'; label?: string }
  | { status: 'signing' }
  | { status: 'success'; txSig: string; market?: string }
  | { status: 'error'; message: string };

interface OrderStatusBarProps {
  state: OrderStatusState;
  onDismiss?: () => void;
  /** Auto-dismiss delay in ms (default 8000) */
  autoDismissMs?: number;
}

export function OrderStatusBar({
  state,
  onDismiss,
  autoDismissMs = 8000,
}: OrderStatusBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after success or error
  useEffect(() => {
    if (state.status === 'success' || state.status === 'error') {
      timerRef.current = setTimeout(() => {
        onDismiss?.();
      }, autoDismissMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.status, autoDismissMs, onDismiss]);

  if (state.status === 'idle') return null;

  // ── Shared container styles ──────────────────────────────────────────────────
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    animation: 'statusSlideIn 0.25s ease',
  };

  // ── Pending / Signing ────────────────────────────────────────────────────────
  if (state.status === 'pending' || state.status === 'signing') {
    return (
      <div
        style={{
          ...baseStyle,
          background: '#1A1B2E',
          border: '1px solid #2D2E42',
          color: '#8B8EA8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spinner />
          <span>
            {state.status === 'pending'
              ? (state as any).label ?? 'Preparing transaction…'
              : 'Waiting for blockchain confirmation…'}
          </span>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (state.status === 'success') {
    const short = state.txSig.slice(0, 8) + '…' + state.txSig.slice(-8);
    const solscanUrl = `https://solscan.io/tx/${state.txSig}`;

    return (
      <div
        style={{
          ...baseStyle,
          background: '#00FFA310',
          border: '1px solid #00FFA330',
          color: '#00FFA3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span>
          <span>
            Order confirmed{state.market ? ` · ${state.market}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href={solscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#00FFA3',
              textDecoration: 'none',
              fontFamily: 'monospace',
              fontSize: '11px',
              borderBottom: '1px dashed #00FFA350',
            }}
          >
            {short} ↗
          </a>
          <CopyButton text={state.txSig} />
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{ background: 'none', border: 'none', color: '#00FFA360', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (state.status === 'error') {
    const msg =
      state.message.length > 120
        ? state.message.slice(0, 120) + '…'
        : state.message;

    return (
      <div
        style={{
          ...baseStyle,
          background: '#FF4D6D10',
          border: '1px solid #FF4D6D30',
          color: '#FF4D6D',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>❌</span>
          <span>{humanizeError(msg)}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', color: '#FF4D6D60', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return null;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: '14px',
        height: '14px',
        border: '2px solid #2D2E42',
        borderTopColor: '#7B61FF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy TX hash"
      style={{
        background: 'none',
        border: '1px solid #00FFA330',
        borderRadius: '4px',
        color: copied ? '#00FFA3' : '#00FFA380',
        cursor: 'pointer',
        fontSize: '10px',
        padding: '2px 6px',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied' : 'Copy TX'}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert raw Solana/Drift error messages to user-friendly text */
function humanizeError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('insufficient funds') || m.includes('insufficient lamports')) {
    return 'Insufficient USDC balance. Deposit funds to your Drift account first.';
  }
  if (m.includes('slippage')) {
    return 'Slippage too high. Try a smaller order or increase slippage tolerance.';
  }
  if (m.includes('blockhash') || m.includes('block height')) {
    return 'Transaction expired. Please try again.';
  }
  if (m.includes('user rejected') || m.includes('rejected')) {
    return 'Transaction cancelled by wallet.';
  }
  if (m.includes('complete trading setup') || m.includes('onboard')) {
    return 'Please enable trading first.';
  }
  return msg;
}
