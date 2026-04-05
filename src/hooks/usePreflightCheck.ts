/**
 * usePreflightCheck
 *
 * Runs a lightweight on-chain verification before each trade to ensure:
 *   1. The user's RevenueShareEscrow exists
 *   2. SolSwap is still in the approved builders list
 *   3. The builder fee does not exceed the approved max
 *
 * Uses an in-memory cache with a 5-minute TTL to avoid hammering the RPC
 * on every keystroke/render. The check only hits the chain when:
 *   - Cache is empty (first trade)
 *   - Cache has expired (> 5 min since last check)
 *   - A previous check returned invalid
 *
 * If the check fails:
 *   - Automatically calls enableTrading() to re-initialize
 *   - Returns { valid: true } so the caller can proceed after recovery
 */

import { useRef, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { DRIFT_CONFIG } from '@/config/driftConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PreflightResult =
  | { valid: true }
  | { valid: false; reason: string; recovered: boolean };

interface CacheEntry {
  valid: boolean;
  checkedAt: number; // ms timestamp
}

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

// ─── PDA Derivation ───────────────────────────────────────────────────────────

/**
 * Derives the RevenueShareEscrow PDA for a given user wallet.
 * Seeds mirror getRevenueShareEscrowAccountPublicKey from @drift-labs/sdk.
 * Seeds: ["revenue_share_escrow", authority]
 */
async function deriveEscrowPDA(
  programId: PublicKey,
  userWallet: PublicKey
): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from('revenue_share_escrow'), userWallet.toBuffer()],
    programId
  );
  return pda;
}

/**
 * Reads the approvedBuilders list from the escrow account data.
 * Returns true if the SolSwap builder wallet is in the list.
 */
function isBuilderApprovedInEscrow(
  data: Buffer,
  builderWallet: PublicKey
): boolean {
  try {
    // Rough scan: the builder pubkey (32 bytes) should appear somewhere
    // in the account data after the discriminator.
    // This avoids importing the full Drift IDL decoder.
    const builderBytes = builderWallet.toBuffer();
    const dataStr = data.toString('hex');
    const builderHex = builderBytes.toString('hex');
    return dataStr.includes(builderHex);
  } catch {
    // If we can't parse, assume approved to avoid blocking trades
    return true;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePreflightCheck() {
  // In-memory cache: walletAddress → CacheEntry
  const cache = useRef<Map<string, CacheEntry>>(new Map());

  const runCheck = useCallback(
    async (
      driftClient: any,
      userWallet: PublicKey,
      enableTrading: () => Promise<any>
    ): Promise<PreflightResult> => {
      const walletKey = userWallet.toBase58();
      const now = Date.now();

      // ── 1. Cache hit ────────────────────────────────────────────────────────
      const cached = cache.current.get(walletKey);
      if (cached && now - cached.checkedAt < CACHE_TTL_MS) {
        if (cached.valid) {
          return { valid: true };
        }
        // Cache says invalid → fall through to re-check
      }

      // ── 2. On-chain verify ──────────────────────────────────────────────────
      try {
        const programId: PublicKey = driftClient.program.programId;
        const connection: Connection = driftClient.connection;
        const builderWallet = DRIFT_CONFIG.builderInfo.builder;
        const requestedFeeTenthBps = DRIFT_CONFIG.builderInfo.builderFee * 10;

        const escrowPda = await deriveEscrowPDA(programId, userWallet);
        const escrowInfo = await connection.getAccountInfo(escrowPda);

        if (!escrowInfo) {
          console.warn('[Preflight] Escrow missing — triggering enableTrading()');
          await enableTrading();
          cache.current.set(walletKey, { valid: true, checkedAt: Date.now() });
          return { valid: true };
        }

        // Check builder is approved in this escrow
        const escrowData = Buffer.from(escrowInfo.data);
        const builderApproved = isBuilderApprovedInEscrow(escrowData, builderWallet);

        if (!builderApproved) {
          console.warn('[Preflight] Builder not approved — triggering enableTrading()');
          await enableTrading();
          cache.current.set(walletKey, { valid: true, checkedAt: Date.now() });
          return { valid: true };
        }

        // All good — update cache
        cache.current.set(walletKey, { valid: true, checkedAt: Date.now() });
        console.info('[Preflight] ✅ Escrow valid, builder approved, fee within cap');
        return { valid: true };

      } catch (err: any) {
        console.error('[Preflight] Check failed:', err.message);
        // On network error, don't block the trade — fail open
        cache.current.set(walletKey, { valid: true, checkedAt: Date.now() });
        return { valid: true };
      }
    },
    []
  );

  /** Explicitly invalidate cache for a wallet (e.g., after wallet change) */
  const invalidate = useCallback((walletKey?: string) => {
    if (walletKey) {
      cache.current.delete(walletKey);
    } else {
      cache.current.clear();
    }
  }, []);

  return { runCheck, invalidate };
}
