import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const TradeHistoryTable = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Conecta tu wallet para ver tu historial de trades.</div>;
  }

  // TODO: Implement real fills/trade history rendering from Drift user account.
  return <div className="p-4 text-sm text-[#8B8EA8]">Sin trades recientes.</div>;
};

