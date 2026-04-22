import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';

export const NetworkStatusBar = () => {
  const { connection } = useConnection();
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');
  
  // Ping the public RPC used by the wallet (not Helius which is reserved for Drift SDK)
  const rpcUrl = 'https://solana-rpc.publicnode.com';
  
  // Determine provider name for display
  const providerName = 'PublicNode';

  useEffect(() => {
    // Basic online/offline browser status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);

    // UTC Clock
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19)); // HH:MM:SS
    };
    updateTime();
    const clockInt = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(clockInt);
    };
  }, []);

  useEffect(() => {
    let subscriptionId: number;
    if (connection) {
      subscriptionId = connection.onSlotChange((slotInfo) => {
        setSlot(slotInfo.slot);
      });
      connection.getSlot().then(setSlot).catch(() => {});
    }
    return () => {
      if (connection && subscriptionId) {
        connection.removeSlotChangeListener(subscriptionId);
      }
    };
  }, [connection]);

  useEffect(() => {
    if (!isOnline) {
      setLatency(null);
      return;
    }

    let intervalId: NodeJS.Timeout;

    // Ping the RPC to get a rough latency estimate
    const pingRpc = async () => {
      const startTime = performance.now();
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             jsonrpc: "2.0",
             id: 1,
             method: "getHealth"
          }),
        });
        
        if (response.ok) {
          const endTime = performance.now();
          setLatency(Math.round(endTime - startTime));
        } else {
           setLatency(null);
        }
      } catch (error) {
        setLatency(null);
      }
    };

    pingRpc(); // Initial ping
    intervalId = setInterval(pingRpc, 10000); // Update every 10 secs

    return () => clearInterval(intervalId);
  }, [isOnline, rpcUrl]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#111114] border-t border-white/5 py-1.5 px-4 z-50 flex items-center justify-between text-xs font-medium text-gray-400 select-none">
      <div className="flex items-center space-x-6">
        
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className="relative flex h-2.5 w-2.5">
            {isOnline ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            )}
          </div>
          <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* RPC Provider & Latency */}
        {isOnline && (
          <div className="flex items-center space-x-2 border-l border-white/10 pl-6">
            {/* Signal Bars Icon */}
            <div className="flex items-end space-x-[2px] h-3.5 mr-1">
              <div className={`w-[3px] rounded-sm h-1.5 ${latency === null ? 'bg-gray-700' : latency >= 500 ? 'bg-red-500' : latency >= 250 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <div className={`w-[3px] rounded-sm h-2.5 ${latency === null || latency >= 500 ? 'bg-gray-700' : latency >= 250 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <div className={`w-[3px] rounded-sm h-3.5 ${latency === null || latency >= 250 ? 'bg-gray-700' : 'bg-green-500'}`}></div>
            </div>
            <span>RPC: <span className="text-gray-300">{providerName}</span></span>
            {latency !== null && (
              <span className="text-gray-500 text-[10px] ml-1">({latency}ms)</span>
            )}
          </div>
        )}

        {/* Slot Indicator */}
        {slot !== null && (
          <div className="flex items-center space-x-2 border-l border-white/10 pl-6 cursor-default">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 text-blue-400">
               <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
               <polyline points="2 17 12 22 22 17"></polyline>
               <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span>Slot: <span className="text-gray-300 font-mono tracking-tight">{slot.toLocaleString()}</span></span>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-6">
        {/* UTC Clock */}
        <div className="flex items-center text-gray-300 font-mono tracking-tight cursor-default">
          {utcTime ? `${utcTime} (UTC)` : ''}
        </div>

        {/* App Version */}
        <div className="hidden sm:flex items-center space-x-2 border-l border-white/10 pl-6 text-gray-500 cursor-default">
           <span>v1.0.0</span>
           <span className="w-1 h-1 rounded-full bg-gray-500"></span>
           <span>Mainnet-Beta</span>
        </div>

        {/* Social Links */}
        <div className="flex items-center space-x-3 border-l border-white/10 pl-6">
          <a href="https://twitter.com/solswap" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Twitter / X">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.005 4.150h-1.91z"/>
            </svg>
          </a>
          <a href="https://t.me/Solswap_Pro" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Telegram">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.211-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953 11.583-4.475 11.83-4.568 12.401-4.568.22 0 .463.05.626.175.148.115.244.301.274.526z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};
