import React, { useState } from 'react';
import OrnamentalBorder from './OrnamentalBorder';
import { Camera, ShieldCheck, Heart, Lock, AlertCircle, ArrowRight } from 'lucide-react';

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
        <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold mb-3 shadow-gold-glow">
          <Camera className="w-7 h-7 text-gold-light" />
        </div>

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
              <h3 className="text-sm font-semibold text-ivory">What is recorded</h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                Your front camera will record a short video of your authentic reaction as the countdown finishes and your gifts are revealed.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gold/15 w-full" />

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ivory">Private & Protected Storage</h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                The video is sent in private encrypted chunks to a secure backend vault. It is strictly never uploaded to public folders or social networks.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-gold/15 w-full" />

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-ivory">Who can view it</h3>
              <p className="text-xs text-roseGray-light leading-relaxed mt-0.5">
                Only your family will have access to cherish this memory together. You can stop recording anytime using the on-screen indicator.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-center">
            <p className="text-[11px] text-ivory font-medium">
              ✨ Recording is 100% optional. If you decline, your full surprise experience will proceed without interruption.
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
          <Camera className="w-4 h-4 text-maroon-950" />
          <span>{requesting ? 'Requesting Permission...' : 'Agree & Enable Camera'}</span>
        </button>

        <button
          onClick={onConsentDeclined}
          disabled={requesting}
          className="btn-outline-gold w-full min-h-[46px] py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-medium active:scale-[0.98]"
        >
          <span>Continue Without Recording</span>
          <ArrowRight className="w-4 h-4 text-gold-light" />
        </button>

        <p className="text-center text-[10px] text-roseGray pt-1">
          Browser camera permissions are only invoked upon explicit agreement
        </p>
      </div>
    </div>
  );
}
