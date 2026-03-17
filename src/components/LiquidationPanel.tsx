import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const LiquidationPanel = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Conecta tu wallet para ver el riesgo de liquidación.</div>;
  }

  // TODO: Replace placeholders with real liquidation/health metrics from Drift.
  return (
    <div className="p-4 text-sm text-[#8B8EA8]">
      <div className="text-white font-bold mb-2">Liquidation</div>
      <div className="bg-[#0C0D14] border border-[#1A1B2E] rounded-lg p-3">
        <div className="flex justify-between">
          <span className="text-[10px] uppercase tracking-widest">Account health</span>
          <span className="text-white font-mono font-bold">--</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] uppercase tracking-widest">Liq price (est.)</span>
          <span className="text-white font-mono font-bold">--</span>
        </div>
      </div>
    </div>
  );
};

