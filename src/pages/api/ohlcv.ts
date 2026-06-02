import type { NextApiRequest, NextApiResponse } from 'next';
import { isValidGeckoPoolId } from '@/utils/geckoPoolParams';

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache

const ALLOWED_TIMEFRAMES = new Set(['minute', 'hour', 'day']);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pool, timeframe = 'hour', aggregate = '1', limit = '300' } = req.query;

  if (!pool || typeof pool !== 'string' || !isValidGeckoPoolId(pool)) {
    return res.status(400).json({ error: 'Missing or invalid pool parameter' });
  }

  const tf =
    typeof timeframe === 'string' && ALLOWED_TIMEFRAMES.has(timeframe)
      ? timeframe
      : null;
  if (!tf) {
    return res.status(400).json({ error: 'Invalid timeframe (use minute, hour, or day)' });
  }

  const aggStr = typeof aggregate === 'string' ? aggregate : '1';
  const limStr = typeof limit === 'string' ? limit : '300';
  const aggNum = parseInt(aggStr, 10);
  const limNum = parseInt(limStr, 10);
  if (!Number.isFinite(aggNum) || aggNum < 1 || aggNum > 1440) {
    return res.status(400).json({ error: 'Invalid aggregate (1–1440)' });
  }
  if (!Number.isFinite(limNum) || limNum < 1 || limNum > 1000) {
    return res.status(400).json({ error: 'Invalid limit (1–1000)' });
  }

  const cacheKey = `ohlcv-${pool}-${tf}-${aggNum}-${limNum}`;
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${tf}?aggregate=${aggNum}&limit=${limNum}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `GeckoTerminal error: ${response.status}` });
    }

    const data = await response.json();
    
    cache[cacheKey] = { data, timestamp: Date.now() };
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
