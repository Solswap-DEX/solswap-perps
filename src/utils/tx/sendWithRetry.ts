/**
 * sendWithRetry
 *
 * Thin wrapper over driftClient.sendTransaction that handles the most
 * common transient Solana failures automatically:
 *
 *   - Expired blockhash  → refresh and retry
 *   - Timeout / network  → retry with exponential back-off
 *
 * Fatal errors (insufficient funds, slippage, account mismatch) are
 * classified and re-thrown immediately — no pointless retries.
 *
 * Usage:
 *   const txSig = await sendWithRetry(driftClient, tx);
 */

const MAX_RETRIES = 2;
const BACKOFF_MS = 500;

/** Errors that are safe to retry automatically */
const RETRYABLE_PATTERNS = [
  'Blockhash not found',
  'block height exceeded',
  'Transaction was not confirmed',
  'timed out',
  'timeout',
  'socket hang up',
  'ECONNRESET',
  '429',           // rate-limited RPC
];

/** Errors that should surface to the user immediately */
const FATAL_PATTERNS = [
  'insufficient funds',
  'insufficient lamports',
  'slippage tolerance',
  'already in use',
  'already initialized',
  'InvalidAccountData',
];

function classifyError(err: Error): 'retryable' | 'fatal' {
  const msg = err.message?.toLowerCase() ?? '';
  if (FATAL_PATTERNS.some((p) => msg.includes(p.toLowerCase()))) return 'fatal';
  if (RETRYABLE_PATTERNS.some((p) => msg.toLowerCase().includes(p.toLowerCase()))) return 'retryable';
  // Unknown → treat as retryable (fail open, not block)
  return 'retryable';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a transaction with automatic retries for transient failures.
 *
 * @param driftClient  Any DriftClient instance (uses its sendTransaction + buildTransaction)
 * @param tx           Pre-built Transaction / VersionedTransaction
 * @param maxRetries   Max automatic retries (default 2)
 * @returns            Transaction signature string
 */
export async function sendWithRetry(
  driftClient: any,
  tx: any,
  maxRetries: number = MAX_RETRIES
): Promise<string> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.info(`[sendWithRetry] Attempt ${attempt + 1}/${maxRetries + 1}`);
        await sleep(BACKOFF_MS * attempt);

        // Re-fetch the latest blockhash before retrying
        const { blockhash, lastValidBlockHeight } =
          await driftClient.connection.getLatestBlockhash('confirmed');

        if (tx.message?.recentBlockhash !== undefined) {
          // VersionedTransaction
          tx.message.recentBlockhash = blockhash;
        } else if (tx.recentBlockhash !== undefined) {
          // Legacy Transaction
          tx.recentBlockhash = blockhash;
          tx.lastValidBlockHeight = lastValidBlockHeight;
        }
      }

      const { txSig } = await driftClient.sendTransaction(tx, [], driftClient.opts);
      if (attempt > 0) {
        console.info(`[sendWithRetry] ✅ Succeeded on attempt ${attempt + 1}`);
      }
      return txSig as string;
    } catch (err: any) {
      lastError = err;
      const classification = classifyError(err);

      console.warn(
        `[sendWithRetry] Attempt ${attempt + 1} failed (${classification}):`,
        err.message
      );

      if (classification === 'fatal') {
        throw err; // No retry for fatal errors
      }

      if (attempt === maxRetries) {
        break; // Exhausted retries
      }
    }
  }

  throw lastError;
}
