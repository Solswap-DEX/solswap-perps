/**
 * GeckoTerminal pool IDs are Solana addresses (base58).
 * Reject odd characters / path segments so we never build unexpected upstream URLs.
 */

const SOLANA_BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const MAX_POOLS_PER_REQUEST = 25;

export function isValidGeckoPoolId(id: string): boolean {
  const trimmed = id.trim();
  return trimmed.length > 0 && SOLANA_BASE58_RE.test(trimmed);
}

export function parseAndValidatePoolList(poolsParam: string): string[] | null {
  const pools = poolsParam
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (pools.length === 0 || pools.length > MAX_POOLS_PER_REQUEST) return null;
  if (!pools.every(isValidGeckoPoolId)) return null;
  return pools;
}
