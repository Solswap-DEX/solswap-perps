import React, { useState, useEffect } from 'react';

export const NetworkStatusBar = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  
  // Use the env variable, or fallback to a standard helius url for displaying the text.
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.helius-rpc.com';
  
  // Determine provider name for display
  const providerName = rpcUrl.includes('helius') ? 'Helius' : 
                       rpcUrl.includes('alchemy') ? 'Alchemy' : 
                       rpcUrl.includes('quicknode') ? 'QuickNode' : 'Custom RPC';

  useEffect(() => {
    // Basic online/offline browser status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
      </div>

      <div className="flex items-center">
         <span className="opacity-50 hover:opacity-100 transition-opacity cursor-default">SolSwap Perpetuals</span>
      </div>
    </div>
  );
};
