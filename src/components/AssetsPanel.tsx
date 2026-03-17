import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const AssetsPanel = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Conecta tu wallet para ver tus assets.</div>;
  }

  // TODO: Replace placeholders with real user collateral/balances from Drift.
  return (
    <div className="p-4 text-sm text-[#8B8EA8]">
      <div className="text-white font-bold mb-2">Assets</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0C0D14] border border-[#1A1B2E] rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#8B8EA8]">Total Collateral</div>
          <div className="text-white font-mono font-bold mt-1">--</div>
        </div>
        <div className="bg-[#0C0D14] border border-[#1A1B2E] rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-widest text-[#8B8EA8]">Free Collateral</div>
          <div className="text-white font-mono font-bold mt-1">--</div>
        </div>
      </div>
    </div>
  );
};

