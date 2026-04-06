import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';

export const NetworkStatusBar = () => {
  const { connection } = useConnection();
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');
  
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
          <a href="https://discord.gg/solswap" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Discord">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};
