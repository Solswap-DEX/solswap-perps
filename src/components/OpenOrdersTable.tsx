import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';
import { OrderStatus } from '@drift-labs/sdk/lib/browser';

export const OpenOrdersTable = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Connect your wallet to view open orders.</div>;
  }
  let openOrders: any[] = [];
  if (driftClient && driftClient.hasUser()) {
    try {
      const userAccount = driftClient.getUser().getUserAccount();
      if (userAccount && userAccount.orders) {
        // Drift orders often use enum mapping
        openOrders = userAccount.orders.filter((o: any) => 
          o.status === OrderStatus.OPEN || 
          (o.status && typeof o.status === 'object' && 'open' in o.status)
        );
      }
    } catch(e) {
      console.error('Error fetching open orders', e);
    }
  }

  if (openOrders.length === 0) {
    return <div className="p-4 text-sm text-[#8B8EA8]">No open orders.</div>;
  }

  return (
    <div className="p-4 text-sm text-[#8B8EA8]">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#1A1B2E]">
            <th className="font-normal py-2 px-1">Market</th>
            <th className="font-normal py-2 px-1">Type</th>
            <th className="font-normal py-2 px-1">Size</th>
          </tr>
        </thead>
        <tbody>
          {openOrders.map((order, idx) => (
            <tr key={idx} className="border-b border-[#1A1B2E]/50">
              <td className="py-2 px-1">Market {order.marketIndex}</td>
              <td className="py-2 px-1">{order.orderType && Object.keys(order.orderType)[0]?.toUpperCase()}</td>
              <td className="py-2 px-1">
                {order.baseAssetAmount && (order.baseAssetAmount.toNumber() / 1e9).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

