import React, { useState } from 'react';
import DiyaFlame from './DiyaFlame';
import OrnamentalBorder from './OrnamentalBorder';
import { KeyRound, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AccessCode({ onSubmitCode, isSubmitting, error, clearError }) {
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || isSubmitting) return;
    onSubmitCode(code.trim().toUpperCase());
  };

  const handleInputChange = (e) => {
    if (error && clearError) clearError();
    setCode(e.target.value.toUpperCase());
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center justify-between min-h-[90vh]">
      {/* Top Section */}
      <div className="w-full text-center pt-2">
        <div className="w-14 h-14 mx-auto rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold mb-3 shadow-gold-glow">
          <KeyRound className="w-7 h-7 text-gold-light" />
        </div>

        <h1 className="font-regal text-2xl sm:text-3xl font-bold text-ivory">
          Private Access
        </h1>

        <OrnamentalBorder />

        <p className="text-xs sm:text-sm text-gold-light/90">
          Enter the secret access code sent to your phone
        </p>
      </div>

      {/* Center Diya & Form Card */}
      <div className="w-full my-auto py-2 flex flex-col items-center">
        <DiyaFlame size="default" />

        <form onSubmit={handleSubmit} className="regal-card w-full rounded-2xl p-6 text-center space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="accessCode" className="block text-xs uppercase tracking-widest text-gold-light font-semibold">
              Your Secret Invitation Code
            </label>
            <p className="text-[11px] text-roseGray">
              Each sister has an exclusive private key to enter
            </p>
          </div>

          <div className="relative">
            <input
              id="accessCode"
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="e.g. SALYA2026 or SHRIN2026"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              maxLength={20}
              className="w-full h-14 text-center tracking-widest text-lg sm:text-xl font-bold font-mono bg-maroon-950/80 text-gold-light placeholder:text-roseGray/40 border border-gold/40 rounded-xl focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-all uppercase px-4"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 text-left animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || isSubmitting}
            className="btn-gold w-full min-h-[50px] py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-base font-bold shadow-gold-glow active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 text-maroon-950 animate-spin" />
                <span>Verifying Secret Key...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-maroon-950 stroke-[2.5]" />
                <span>Unlock Celebration</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Helper */}
      <div className="w-full text-center pb-2">
        <p className="text-[11px] text-roseGray">
          🔒 Protected with rate-limiting and private end-to-end authorization.
        </p>
      </div>
    </div>
  );
}
