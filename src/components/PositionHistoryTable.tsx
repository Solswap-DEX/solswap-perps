import React from 'react';

export const PositionHistoryTable = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-[#8B8EA8]">
      <svg className="w-12 h-12 mb-4 opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="text-sm">No position history</div>
    </div>
  );
};
