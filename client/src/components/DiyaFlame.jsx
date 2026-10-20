import React from 'react';

export default function DiyaFlame({ size = 'default' }) {
  const isLarge = size === 'large';

  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Golden Aura Glow */}
      <div className={`absolute rounded-full bg-gold/25 blur-2xl pointer-events-none ${isLarge ? 'w-36 h-36' : 'w-24 h-24'}`} />

      {/* Flame */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Outer Flame */}
        <div className={`relative rounded-full bg-gradient-to-t from-gold-dark via-gold to-yellow-100 animate-flame-flicker shadow-gold-glow ${isLarge ? 'w-8 h-14' : 'w-6 h-10'}`}
             style={{ borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%' }}>
          {/* Inner Flame Core */}
          <div className="absolute inset-x-1.5 bottom-1 top-2 bg-gradient-to-t from-white via-yellow-200 to-transparent rounded-full opacity-90 blur-[0.5px]" />
          {/* Flame Wick */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-2 bg-stone-900 rounded-sm" />
        </div>

        {/* Traditional Brass / Clay Diya Base */}
        <svg
          viewBox="0 0 100 45"
          className={`${isLarge ? 'w-24 h-11' : 'w-18 h-8'} -mt-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Rim */}
          <path
            d="M8 12 Q50 4 92 12 Q82 38 50 42 Q18 38 8 12 Z"
            fill="url(#diyaGoldGradient)"
            stroke="#f5df88"
            strokeWidth="1.2"
          />
          {/* Decorative Filigree Lines */}
          <path
            d="M20 20 Q50 30 80 20"
            stroke="#947113"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx="50" cy="27" r="2.5" fill="#f8e59d" />
          <circle cx="36" cy="24" r="1.8" fill="#f8e59d" />
          <circle cx="64" cy="24" r="1.8" fill="#f8e59d" />

          <defs>
            <linearGradient id="diyaGoldGradient" x1="0" y1="0" x2="100" y2="45" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f5df88" />
              <stop offset="0.4" stopColor="#d4af37" />
              <stop offset="0.8" stopColor="#967215" />
              <stop offset="1" stopColor="#573e04" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
