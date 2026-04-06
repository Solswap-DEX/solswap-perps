import React from 'react';

export const RiskRatePanel = () => {
  return (
    <div className="bg-[#0D1117] rounded-xl p-4 border border-[#2D2E42] mb-4 flex flex-col gap-3 flex-shrink-0 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00D1FF] opacity-[0.05] blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#8B8EA8] font-bold tracking-wide">Risk rate</span>
        <span className="text-[#00FFA3] font-mono font-bold tracking-tight">0.00%</span>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-full h-1.5 bg-[#1A1B2E] rounded-full overflow-hidden shadow-inner flex relative">
        {/* Fill */}
        <div className="w-[5%] h-full bg-gradient-to-r from-[#00D1FF] to-[#00FFA3] rounded-full shadow-[0_0_10px_rgba(0,255,163,0.5)]"></div>
        
        {/* Markers for visualizing risk thresholds */}
        <div className="absolute left-[50%] top-0 bottom-0 w-px bg-[#05070A] opacity-50 z-10"></div>
        <div className="absolute left-[75%] top-0 bottom-0 w-px bg-[#05070A] opacity-50 z-10"></div>
        <div className="absolute left-[90%] top-0 bottom-0 w-px bg-[#FF4D6D] opacity-80 z-10"></div>
      </div>
    </div>
  );
};
