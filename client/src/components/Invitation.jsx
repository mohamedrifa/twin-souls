import React from 'react';
import DiyaFlame from './DiyaFlame';
import OrnamentalBorder from './OrnamentalBorder';
import { Sparkles, Music, ChevronRight } from 'lucide-react';

export default function Invitation({ onStart }) {
  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center justify-between min-h-[90vh]">
      {/* Top Banner / Theme Header */}
      <div className="w-full text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold-light text-xs font-medium tracking-widest uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5 text-gold animate-subtle-pulse" />
          <span>Birthday Surprise</span>
          <Sparkles className="w-3.5 h-3.5 text-gold animate-subtle-pulse" />
        </div>

        <h1 className="font-regal text-3xl sm:text-4xl text-ivory font-bold leading-tight tracking-wide">
          Two Souls.<br />
          <span className="text-gold-gradient">One Celebration.</span>
        </h1>

        <OrnamentalBorder />

        <p className="font-script text-xl sm:text-2xl text-gold-light/90 italic mt-1 font-medium">
          “A celebration written in rhythm.”
        </p>
      </div>

      {/* Centerpiece Classical Diya and Tribute */}
      <div className="w-full my-auto py-4 flex flex-col items-center text-center">
        <DiyaFlame size="large" />

        <div className="regal-card w-full rounded-2xl p-5 my-3 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-maroon-700/20 rounded-full blur-2xl pointer-events-none" />

          <p className="text-xs uppercase tracking-wider text-roseGray font-semibold mb-2">
            Dedicated with love to
          </p>

          <div className="space-y-3">
            <div className="p-2.5 rounded-xl bg-maroon-900/60 border border-gold/15">
              <h2 className="font-regal text-lg font-bold text-ivory">Kowsalya</h2>
              <p className="text-xs text-gold/90 font-medium tracking-wide">Salya's Dance Academy</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-roseGray text-xs">
              <span className="w-8 h-[1px] bg-gold/20" />
              <span>&</span>
              <span className="w-8 h-[1px] bg-gold/20" />
            </div>

            <div className="p-2.5 rounded-xl bg-maroon-900/60 border border-gold/15">
              <h2 className="font-regal text-lg font-bold text-ivory">Kowsika</h2>
              <p className="text-xs text-gold/90 font-medium tracking-wide">Shrinrityalaya</p>
            </div>
          </div>

          <p className="text-xs text-ivory/80 leading-relaxed mt-4 font-normal">
            Two journeys. Two academies. One unforgettable birthday moment waiting for both of you to connect.
          </p>
        </div>
      </div>

      {/* Bottom CTA Action Button */}
      <div className="w-full pb-2">
        <button
          onClick={onStart}
          className="btn-gold w-full min-h-[52px] py-3.5 px-6 rounded-xl flex items-center justify-center gap-2.5 text-base shadow-gold-glow active:scale-[0.98] transition-transform font-bold"
        >
          <span>Begin Your Surprise</span>
          <ChevronRight className="w-5 h-5 text-maroon-950 stroke-[2.5]" />
        </button>
        <p className="text-center text-[11px] text-roseGray mt-3">
          Designed for Kowsalya & Kowsika on mobile devices
        </p>
      </div>
    </div>
  );
}
