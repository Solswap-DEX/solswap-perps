/**
 * useOnboardingStore
 *
 * Zustand store with localStorage persistence that caches the user's
 * onboarding / revenue-share state so we don't hit the RPC on every page load.
 *
 * Invalidation rules:
 *  - wallet address changes → full reset
 *  - lastChecked > 5 min ago → re-verify on-chain
 *  - enableTrading() completes → immediately mark ready
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Cache TTL: 5 minutes
export const ONBOARDING_CACHE_TTL_MS = 5 * 60 * 1000;

export interface OnboardingCache {
  /** Wallet address this cache entry belongs to */
  walletAddress: string | null;
  /** Whether the RevenueShareEscrow account exists on-chain */
  hasEscrow: boolean;
  /** Pubkey (base58) of the approved builder, null if none */
  approvedBuilder: string | null;
  /** Max fee in tenth-bps approved in the escrow */
  maxFeeTenthBps: number;
  /** Unix timestamp (ms) of last verified on-chain check */
  lastChecked: number;
}

interface OnboardingStore extends OnboardingCache {
  /** Mark escrow + builder as valid and update cache timestamp */
  markReady: (walletAddress: string, approvedBuilder: string, maxFeeTenthBps: number) => void;
  /** Full reset — call when wallet changes or cache must be purged */
  invalidate: (reason?: string) => void;
  /** Check whether the cache is still fresh (< 5 min) for this wallet */
  isFresh: (walletAddress: string) => boolean;
}

const EMPTY_STATE: OnboardingCache = {
  walletAddress: null,
  hasEscrow: false,
  approvedBuilder: null,
  maxFeeTenthBps: 0,
  lastChecked: 0,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...EMPTY_STATE,

      markReady: (walletAddress, approvedBuilder, maxFeeTenthBps) => {
        set({
          walletAddress,
          hasEscrow: true,
          approvedBuilder,
          maxFeeTenthBps,
          lastChecked: Date.now(),
        });
        console.info('[OnboardingStore] ✅ Cache updated for', walletAddress.slice(0, 8));
      },

      invalidate: (reason = 'manual') => {
        console.info('[OnboardingStore] cache invalidated:', reason);
        set(EMPTY_STATE);
      },

      isFresh: (walletAddress: string) => {
        const state = get();
        if (state.walletAddress !== walletAddress) return false;
        if (!state.hasEscrow) return false;
        if (Date.now() - state.lastChecked > ONBOARDING_CACHE_TTL_MS) return false;
        return true;
      },
    }),
    {
      name: 'solswap-onboarding-cache',
      storage: createJSONStorage(() => localStorage),
      // Only persist the data fields, not action functions
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        hasEscrow: state.hasEscrow,
        approvedBuilder: state.approvedBuilder,
        maxFeeTenthBps: state.maxFeeTenthBps,
        lastChecked: state.lastChecked,
      }),
    }
  )
);
