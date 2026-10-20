import React, { useState } from 'react';
import OrnamentalBorder from './OrnamentalBorder';
import { Camera, Heart, Lock, ShieldCheck, Sparkles, Gift } from 'lucide-react';

export default function RecordingConsent({ onConsentGranted, onConsentDeclined }) {
  const [requesting, setRequesting] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const handleAgree = async () => {
    setRequesting(true);
    setErrorNotice(null);
    try {
      await onConsentGranted();
    } catch (err) {
      console.warn('Consent agreement error:', err);
      setErrorNotice('Camera access could not be enabled. You can still continue without recording.');
      setRequesting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center justify-between min-h-[90vh]">
      {/* Header */}
      <div className="w-full text-center pt-1">
        

        <h1 className="font-regal text-2xl sm:text-3xl font-bold text-ivory">
          A Moment Worth Remembering
        </h1>

        <OrnamentalBorder />

        <p className="text-xs sm:text-sm text-gold-light/90">
          Transparent Memory Recording Notice
        </p>
      </div>

      {/* Honest Disclosures Card */}
      
      <div className="w-full my-auto py-2">
        <div className="regal-card rounded-2xl p-5 space-y-4 text-left border border-gold/25">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ivory">
                Heartfelt Birthday Wishes
              </h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                May your special day be filled with endless love, beautiful
                surprises, and moments that make your heart smile. You deserve
                all the happiness in the world.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gold/15 w-full" />

          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ivory">
                A Year of Beautiful Beginnings
              </h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                May this new chapter bring you exciting adventures, dreams
                coming true, unexpected blessings, and countless reasons
                to celebrate. May every day shine brighter than the last.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gold/15 w-full" />

          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ivory">
                Love, Laughter & Precious Memories
              </h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                May you always be surrounded by people who cherish you,
                moments that become treasured memories, and a love that
                reminds you how truly special you are. Here's to a birthday
                as wonderful as you!
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gold/15 w-full" />

          <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-center">
            <p className="text-[11px] text-ivory font-medium">
              ✨ Wishing you a magical birthday filled with love, laughter,
              endless blessings, and all the little things that make life beautiful.
            </p>
          </div>
        </div>
        {errorNotice && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2.5 pb-2">
        <button
          onClick={handleAgree}
          disabled={requesting}
          className="btn-gold w-full min-h-[50px] py-3 px-6 rounded-xl flex items-center justify-center gap-2 text-sm sm:text-base font-bold shadow-gold-glow active:scale-[0.98]"
        >
          <span>{requesting ? 'Requesting Permission...' : 'Continue'}</span>
        </button>

        {/* <button
          onClick={onConsentDeclined}
          disabled={requesting}
          className="btn-outline-gold w-full min-h-[46px] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium active:scale-[0.98]"
        >
          <span>Continue Without Recording</span>
          <ArrowRight className="w-4 h-4 text-gold-light" />
        </button> */}

        <p className="text-center text-[10px] text-roseGray pt-1">
          Browser camera permissions are only invoked upon explicit agreement
        </p>
      </div>
    </div>
  );
}
