import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const AssetsPanel = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Connect your wallet to view assets.</div>;
  }

  let totalCollateral = '--';
  let freeCollateral = '--';

  if (driftClient && driftClient.hasUser()) {
    try {
      const user = driftClient.getUser();
      totalCollateral = `$${(user.getTotalCollateral().toNumber() / 1e6).toFixed(2)}`;
      freeCollateral = `$${(user.getFreeCollateral().toNumber() / 1e6).toFixed(2)}`;
    } catch(e) {
      console.error(e);
    }
  }

  return (
    <div className="p-4 text-sm text-[#8B8EA8]">
      <div className="text-white font-bold mb-2">Assets</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0C0D14] border border-[#1A1B2E] rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#8B8EA8]">Total Collateral</div>
          <div className="text-white font-mono font-bold mt-1">{totalCollateral}</div>
        </div>
        <div className="bg-[#0C0D14] border border-[#1A1B2E] rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#8B8EA8]">Free Collateral</div>
          <div className="text-white font-mono font-bold mt-1">{freeCollateral}</div>
        </div>
      </div>
    </div>
  );
};

