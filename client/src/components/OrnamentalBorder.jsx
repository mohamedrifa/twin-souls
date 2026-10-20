import React from 'react';

export default function OrnamentalBorder({ className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 my-4 select-none ${className}`}>
      {/* Left Filigree Line */}
      <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-r from-transparent via-gold/60 to-gold" />

      {/* Lotus / Paisley Central Motif */}
      <svg
        width="28"
        height="18"
        viewBox="0 0 28 18"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gold opacity-90 drop-shadow-[0_0_6px_rgba(212,175,55,0.4)]"
      >
        <path
          d="M14 1 C14 8, 8 13, 2 13 C7 11, 10 7, 10 4 C10 1, 14 1, 14 1 Z"
          fill="currentColor"
        />
        <path
          d="M14 1 C14 8, 20 13, 26 13 C21 11, 18 7, 18 4 C18 1, 14 1, 14 1 Z"
          fill="currentColor"
        />
        <circle cx="14" cy="5" r="2" fill="#fff5cc" />
        <circle cx="14" cy="14" r="1.5" fill="#dfb743" />
      </svg>

      {/* Right Filigree Line */}
      <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-l from-transparent via-gold/60 to-gold" />
    </div>
  );
}
