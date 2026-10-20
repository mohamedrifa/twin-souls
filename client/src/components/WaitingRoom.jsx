import React from 'react';
import DiyaFlame from './DiyaFlame';
import OrnamentalBorder from './OrnamentalBorder';
import { Wifi, Sparkles, HeartHandshake, Loader2 } from 'lucide-react';

export default function WaitingRoom({ participant, waitingSister, connected }) {
  const myName = participant?.displayName || 'Sister';
  const myAcademy = participant?.academy || '';
  const sister = waitingSister || (participant?.participant === 'kowsalya' ? 'Kowsika' : 'Kowsalya');

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center justify-between min-h-[90vh]">
      {/* Top Header */}
      <div className="w-full text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold-light text-xs font-medium mb-3">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>{connected ? 'Live Session Synchronized' : 'Reconnecting...'}</span>
        </div>

        <h1 className="font-regal text-xl sm:text-2xl font-bold text-ivory">
          Welcome, <span className="text-gold-gradient">{myName}</span>
        </h1>
        {myAcademy && (
          <p className="text-xs text-roseGray font-medium mt-0.5">{myAcademy}</p>
        )}

        <OrnamentalBorder />
      </div>

      {/* Center Waiting Card with Diya */}
      <div className="w-full my-auto py-4 flex flex-col items-center text-center">
        <DiyaFlame size="large" />

        <div className="regal-card w-full rounded-2xl p-6 mt-3 space-y-4 relative overflow-hidden border border-gold/30 shadow-gold-glow">
          <div className="flex items-center justify-center gap-2 text-gold">
            <HeartHandshake className="w-6 h-6 animate-subtle-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="font-regal text-lg sm:text-xl font-bold text-ivory leading-snug">
              Waiting for <span className="text-gold-gradient font-extrabold">{sister}</span> to join your celebration...
            </h2>
            <p className="text-xs text-ivory/80 leading-relaxed font-normal">
              Your surprise is synchronized between both of your phones. The moment {sister} unlocks her secret code, your shared 10-second countdown begins automatically!
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2.5 text-xs text-gold-light font-medium bg-maroon-900/60 py-2.5 px-4 rounded-xl border border-gold/20">
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
            <span>Standing by for {sister}'s phone connection...</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center pb-2">
        <p className="text-[11px] text-roseGray flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Keep this screen open on your phone</span>
        </p>
      </div>
    </div>
  );
}
