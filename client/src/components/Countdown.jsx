import React, { useState, useEffect } from 'react';
import OrnamentalBorder from './OrnamentalBorder';
import { Sparkles } from 'lucide-react';

export default function Countdown({ countdownEndsAt, clockOffset = 0, onComplete }) {
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    setHasCompleted(false);
  }, [countdownEndsAt]);

  useEffect(() => {
    if (!countdownEndsAt) return;

    const calculateRemaining = () => {
      // Adjusted now using server clock offset to prevent client phone clock skew
      const adjustedNow = Date.now() + clockOffset;
      const diffMs = countdownEndsAt - adjustedNow;
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      return seconds;
    };

    const initial = calculateRemaining();
    setSecondsRemaining(initial);

    if (initial <= 0 && !hasCompleted) {
      setHasCompleted(true);
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (!hasCompleted) {
          setHasCompleted(true);
          if (onComplete) onComplete();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [countdownEndsAt, clockOffset, onComplete, hasCompleted]);

  // Calculate circular progress (0 to 10 seconds)
  const progressPercent = Math.max(0, Math.min(10, secondsRemaining)) / 10;
  const strokeDashoffset = 283 - 283 * progressPercent;

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center justify-between min-h-[90vh]">
      {/* Top Banner */}
      <div className="w-full text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold-light text-xs font-semibold uppercase tracking-widest mb-3 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Both Sisters Connected!</span>
          <Sparkles className="w-3.5 h-3.5 text-gold" />
        </div>

        <h1 className="font-regal text-2xl sm:text-3xl font-bold text-ivory">
          Synchronized Reveal
        </h1>

        <OrnamentalBorder />

        <p className="text-xs sm:text-sm text-gold-light/90">
          Hold your breath... your birthday surprise is unlocking together!
        </p>
      </div>

      {/* Big Central Countdown Circle */}
      <div className="w-full my-auto py-6 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 flex items-center justify-center select-none">
          {/* Pulsing Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl animate-subtle-pulse pointer-events-none" />

          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90 transform drop-shadow-gold-glow" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="rgba(24, 5, 14, 0.7)"
              stroke="rgba(212, 175, 55, 0.15)"
              strokeWidth="4"
            />
            {/* Active Gold Ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke="url(#countdownGoldGradient)"
              strokeWidth="5"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 ease-linear"
            />
            <defs>
              <linearGradient id="countdownGoldGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fcedb0" />
                <stop offset="0.5" stopColor="#d4af37" />
                <stop offset="1" stopColor="#99781d" />
              </linearGradient>
            </defs>
          </svg>

          {/* Central Countdown Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-regal text-7xl sm:text-8xl font-black text-gold-gradient tracking-tighter drop-shadow-[0_4px_20px_rgba(212,175,55,0.6)]">
              {secondsRemaining}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-gold-light/70 font-semibold mt-1">
              {secondsRemaining === 1 ? 'Second' : 'Seconds'}
            </span>
          </div>
        </div>

        <p className="font-script text-xl text-gold-light/90 italic mt-6 font-medium animate-float-slow">
          “Two journeys. Two academies. One unforgettable celebration.”
        </p>
      </div>

      {/* Footer Notice */}
      <div className="w-full text-center pb-2">
        <p className="text-[11px] text-roseGray">
          ✨ Server-synchronized timer across Kowsalya & Kowsika's devices
        </p>
      </div>
    </div>
  );
}
