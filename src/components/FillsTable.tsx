import React from 'react';
import { useDriftClient } from '@/hooks/useDriftClient';

export const FillsTable = () => {
  const { driftClient, isConnected } = useDriftClient();

  if (!driftClient || !isConnected || !driftClient.hasUser()) {
    return <div className="p-4 text-sm text-[#8B8EA8]">Conecta tu wallet para ver tus fills.</div>;
  }

  // TODO: Populate with real user fills once we have the Drift fill feed wired up.
  return <div className="p-4 text-sm text-[#8B8EA8]">Sin fills recientes.</div>;
};

