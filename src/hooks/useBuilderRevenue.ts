/**
 * useBuilderRevenue
 *
 * Queries the Drift Protocol on-chain RevenueShareAccount for the SolSwap
 * builder wallet, exposing whether it exists and how many fees have accumulated.
 *
 * Usage (debug panel / internal monitoring only):
 *   const { stats, refresh } = useBuilderRevenue(driftClient);
 */

import { useState, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { DRIFT_CONFIG } from '@/config/driftConfig';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BuilderRevenueStats {
  /** Whether the RevenueShareAccount PDA exists on-chain */
  accountExists: boolean;
  /** Total fees accumulated (in USDC micro-units, i.e. 6 decimals) */
  totalFeesRaw: bigint;
  /** Total fees in human-readable USDC */
  totalFeesUSDC: number;
  /** Pending (unclaimed) fees */
  pendingFeesRaw: bigint;
  pendingFeesUSDC: number;
  /** ISO timestamp of last successful check */
  lastChecked: string;
  /** Error message if the check failed */
  error: string | null;
}

const INITIAL_STATS: BuilderRevenueStats = {
  accountExists: false,
  totalFeesRaw: 0n,
  totalFeesUSDC: 0,
  pendingFeesRaw: 0n,
  pendingFeesUSDC: 0,
  lastChecked: '',
  error: null,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derive the RevenueShareAccount PDA for an authority.
 * Mirrors getRevenueShareAccountPublicKey from @drift-labs/sdk.
 * Seeds: ["revenue_share", authority]
 */
async function deriveRevenueSharePDA(
  programId: PublicKey,
  authority: PublicKey
): Promise<PublicKey> {
  const [pda] = await PublicKey.findProgramAddressSync(
    [Buffer.from('revenue_share'), authority.toBuffer()],
    programId
  );
  return pda;
}

/** Parse raw account data to extract fee fields (layout offset based on Drift IDL) */
function parseRevenueShareData(data: Buffer): { totalFees: bigint; pendingFees: bigint } {
  try {
    // Drift's RevenueShare account layout (after 8-byte discriminator):
    // Offset 8:  totalRevenue (u64, 8 bytes)
    // Offset 16: pendingRevenue (u64, 8 bytes)
    if (data.length < 24) return { totalFees: 0n, pendingFees: 0n };
    const totalFees = data.readBigUInt64LE(8);
    const pendingFees = data.readBigUInt64LE(16);
    return { totalFees, pendingFees };
  } catch {
    return { totalFees: 0n, pendingFees: 0n };
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBuilderRevenue(
  driftClient: any | null
): {
  stats: BuilderRevenueStats;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [stats, setStats] = useState<BuilderRevenueStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!driftClient) {
      setStats((s) => ({ ...s, error: 'DriftClient not initialized' }));
      return;
    }

    setIsLoading(true);
    try {
      const programId: PublicKey = driftClient.program.programId;
      const builderWallet: PublicKey = DRIFT_CONFIG.builderInfo.builder;
      const connection: Connection = driftClient.connection;

      const revSharePda = await deriveRevenueSharePDA(programId, builderWallet);
      const accountInfo = await connection.getAccountInfo(revSharePda);

      if (!accountInfo) {
        setStats({
          accountExists: false,
          totalFeesRaw: 0n,
          totalFeesUSDC: 0,
          pendingFeesRaw: 0n,
          pendingFeesUSDC: 0,
          lastChecked: new Date().toISOString(),
          error:
            'RevenueShareAccount does not exist. Run initializeRevenueShare() first.',
        });
        return;
      }

      const { totalFees, pendingFees } = parseRevenueShareData(
        Buffer.from(accountInfo.data)
      );

      // USDC has 6 decimals on Solana
      const toUSDC = (raw: bigint) => Number(raw) / 1_000_000;

      setStats({
        accountExists: true,
        totalFeesRaw: totalFees,
        totalFeesUSDC: toUSDC(totalFees),
        pendingFeesRaw: pendingFees,
        pendingFeesUSDC: toUSDC(pendingFees),
        lastChecked: new Date().toISOString(),
        error: null,
      });

      console.info(
        '[SolSwap Revenue] Builder RevenueShareAccount OK\n',
        `  PDA: ${revSharePda.toBase58()}\n`,
        `  Total fees: $${toUSDC(totalFees).toFixed(4)} USDC\n`,
        `  Pending: $${toUSDC(pendingFees).toFixed(4)} USDC`
      );
    } catch (err: any) {
      console.error('[SolSwap Revenue] Failed to fetch revenue stats:', err);
      setStats((s) => ({
        ...s,
        lastChecked: new Date().toISOString(),
        error: err.message || 'Unknown error',
      }));
    } finally {
      setIsLoading(false);
    }
  }, [driftClient]);

  return { stats, isLoading, refresh };
}
