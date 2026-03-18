import type { NextApiRequest, NextApiResponse } from 'next';

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { pools } = req.query;

  if (!pools) {
    return res.status(400).json({ error: 'Missing pools parameter' });
  }

  const cacheKey = `prices-pools-${pools}`;
  const cached = cache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  try {
    const poolList = (pools as string).split(',');
    const priceMap: Record<string, number> = {};

    // Fetch each pool's data. GeckoTerminal doesn't have a multi-pool endpoint for metadata easily.
    // However, we can use the /networks/solana/pools/[address] endpoint.
    // For simplicity and rate limiting, we'll fetch them in parallel if not many.
    await Promise.all(poolList.map(async (pool) => {
        try {
            const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool}`);
            if (response.ok) {
                const json = await response.json();
                const price = json?.data?.attributes?.base_token_price_usd;
                if (price) {
                    priceMap[pool] = parseFloat(price);
                }
            }
        } catch (e) {
            console.error(`Error fetching pool ${pool}:`, e);
        }
    }));
    
    const result = { data: priceMap };
    cache[cacheKey] = { data: result, timestamp: Date.now() };
    
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
