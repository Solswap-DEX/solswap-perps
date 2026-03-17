import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const OpenOrdersTable = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Conecta tu wallet para ver tus open orders.</div>;
  }

  // TODO: Implement real open orders rendering from Drift user account.
  return <div className="p-4 text-sm text-[#8B8EA8]">No hay open orders.</div>;
};

