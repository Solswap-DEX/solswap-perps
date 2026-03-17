import type { NextApiRequest, NextApiResponse } from 'next';

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { mints } = req.query;

  if (!mints) {
    return res.status(400).json({ error: 'Missing mints parameter' });
  }

  const cacheKey = `prices-${mints}`;
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${mints}`;
    
    const response = await fetch(url);

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
