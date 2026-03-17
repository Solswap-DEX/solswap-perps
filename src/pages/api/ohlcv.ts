import type { NextApiRequest, NextApiResponse } from 'next';

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pool, timeframe = 'hour', aggregate = '1', limit = '300' } = req.query;

  if (!pool) {
    return res.status(400).json({ error: 'Missing pool parameter' });
  }

  const cacheKey = `ohlcv-${pool}-${timeframe}-${aggregate}-${limit}`;
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}`;
    
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
