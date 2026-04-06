import React, { useState, useEffect } from 'react';

export const MarketStatsBar = ({ currentPrice, priceChange24h, symbol }: any) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const epochDuration = 8 * 60 * 60 * 1000;
    const nextEpoch = Math.ceil(new Date().getTime() / epochDuration) * epochDuration;
    
    const interval = setInterval(() => {
      const msLeft = nextEpoch - new Date().getTime();
      if (msLeft < 0) return;
      const h = Math.floor(msLeft / 3600000).toString().padStart(2, '0');
      const m = Math.floor((msLeft % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((msLeft % 60000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number | null) => {
    if (!p) return '---';
    return p > 1000 ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toPrecision(5);
  };

  const isPositive = priceChange24h && priceChange24h >= 0;
  const changeColor = isPositive ? 'text-[#00FFA3]' : 'text-[#FF4D6D]';
  const changeSign = isPositive ? '+' : '';

  const markOffset = currentPrice ? currentPrice * 0.0001 : 0;
  const markPrice = currentPrice ? currentPrice - markOffset : null;
  const indexPrice = currentPrice ? currentPrice + markOffset : null;

  return (
    <div className="hidden lg:flex items-center gap-6 text-xs whitespace-nowrap overflow-x-auto no-scrollbar px-6 flex-1 min-w-0">
      
      {/* Price */}
      <div className="flex flex-col">
        <span className={`text-lg font-bold font-mono ${changeColor}`}>
          ${formatPrice(currentPrice)}
        </span>
      </div>

      {/* 24h Change */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#8B8EA8]">24h change</span>
        <span className={`font-mono font-bold tracking-tight ${changeColor}`}>
          {changeSign}{(currentPrice * (priceChange24h / 100) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} / {changeSign}{priceChange24h?.toFixed(2) || '0.00'}%
        </span>
      </div>

      {/* Mark */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#8B8EA8]">Mark</span>
        <span className="font-mono text-white font-bold tracking-tight">{formatPrice(markPrice)}</span>
      </div>

      {/* Index */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#8B8EA8]">Index</span>
        <span className="font-mono text-white font-bold tracking-tight">{formatPrice(indexPrice)}</span>
      </div>

      {/* 24h Volume */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#8B8EA8]">24h volume</span>
        <span className="font-mono text-white font-bold tracking-tight">4.91M</span>
      </div>

      {/* Funding Rate */}
      <div className="flex flex-col gap-[3px]">
        <span className="text-[9px] text-[#00D1FF] bg-[#00D1FF]/10 px-1 rounded-[3px] w-fit font-bold uppercase tracking-wider">Pred. funding rate</span>
        <span className="font-mono text-[#8B8EA8] tracking-tight">
          <span className="text-white font-bold">0.0100%</span> in {timeLeft || '--:--:--'}
        </span>
      </div>

      {/* Open Interest */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-[#8B8EA8]">Open interest</span>
        <span className="font-mono text-[#8B8EA8] tracking-tight">
          <span className="text-white font-bold">2.27M</span> USDC
        </span>
      </div>

    </div>
  );
};
