import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { mints } = req.query;

  if (!mints) {
    return res.status(400).json({ error: 'Missing mints parameter' });
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/solana/token_price/${mints}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ error: `GeckoTerminal error: ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
