import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const FillsTable = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Connect your wallet to view fills.</div>;
  }

  let recentFills: any[] = [];
  if (driftClient && driftClient.hasUser()) {
    try {
      const userAccount = driftClient.getUser().getUserAccount();
      if (userAccount && userAccount.orders) {
        // Placeholder relying on partially/fully filled orders in active cache (Pending Indexer Feed)
        recentFills = userAccount.orders.filter((o: any) => 
          o.baseAssetAmountFilled && !o.baseAssetAmountFilled.isZero()
        ).slice(0, 5);
      }
    } catch(e) {
      console.error('Error fetching fills', e);
    }
  }

  if (recentFills.length === 0) {
    return <div className="p-4 text-sm text-[#8B8EA8]">No recent fills for this session.</div>;
  }

  return (
    <div className="p-4 text-sm text-[#8B8EA8]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#1A1B2E]">
            <th className="font-normal py-2 px-1">Market</th>
            <th className="font-normal py-2 px-1">Side</th>
            <th className="font-normal py-2 px-1">Filled Size</th>
          </tr>
        </thead>
        <tbody>
          {recentFills.map((fill, idx) => (
            <tr key={idx} className="border-b border-[#1A1B2E]/50">
              <td className="py-2 px-1">Market {fill.marketIndex}</td>
              <td className="py-2 px-1">{fill.direction && Object.keys(fill.direction)[0]?.toUpperCase()}</td>
              <td className="py-2 px-1">
                {fill.baseAssetAmountFilled && (fill.baseAssetAmountFilled.toNumber() / 1e9).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

