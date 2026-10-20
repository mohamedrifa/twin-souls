import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import DiyaFlame from './DiyaFlame';
import OrnamentalBorder from './OrnamentalBorder';
import { Sparkles, Heart, ExternalLink, Gift, Music, Award } from 'lucide-react';

export default function GiftReveal({ gifts, participant, onFinishRecording, onOpenReactions }) {
  useEffect(() => {
    // Joyful confetti cannons
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#d4af37', '#f4dc8a', '#ff4d6d', '#ffffff', '#e5c158'];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const kowsalyaUrl = gifts?.kowsalyaAppUrl || 'https://salyasdance.app/release';
  const kowsikaUrl = gifts?.kowsikaAppUrl || 'https://shrinrityalaya.app/release';

  const isKowsalya = participant?.participant === 'kowsalya';
  const isKowsika = participant?.participant === 'kowsika';

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center space-y-6">
      {/* Top Birthday Banner */}
      <div className="w-full text-center pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/50 text-gold-light text-xs font-semibold uppercase tracking-widest mb-3 shadow-gold-glow animate-subtle-pulse">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Surprise Unveiled</span>
          <Sparkles className="w-3.5 h-3.5 text-gold" />
        </div>

        <h1 className="font-regal text-3xl sm:text-4xl font-extrabold text-ivory">
          Happy Birthday,<br />
          <span className="text-gold-gradient">Kowsalya & Kowsika!</span>
        </h1>

        <OrnamentalBorder />

        <p className="font-script text-xl text-gold-light/95 italic">
          Two Souls. One Celebration.
        </p>
      </div>

      <DiyaFlame size="default" />

      {/* Heartfelt Birthday Letter */}
      <div className="regal-card w-full rounded-2xl p-5 sm:p-6 text-left border border-gold/30 shadow-maroon-deep relative overflow-hidden">
        <div className="flex items-center gap-2 text-gold-light mb-3">
          <Heart className="w-4 h-4 fill-gold text-gold" />
          <h2 className="font-regal text-base sm:text-lg font-bold text-ivory">
            To my dearest Kowsalya and Kowsika ❤️
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-ivory/90 space-y-3 leading-relaxed font-sans">
          <p>
            Two hearts that began their journey together, two beautiful souls who found their rhythm in Bharatham, and two dreams that continue to inspire everyone around them.
          </p>
          <p>
            Through <strong className="text-gold-light font-semibold">Salya's Dance Academy</strong> and <strong className="text-gold-light font-semibold">Shrinrityalaya</strong>, you are sharing more than dance. You are passing on tradition, discipline, expression, and the beauty of our culture to the next generation.
          </p>
          <p>
            Today, I wanted to give you something a little different. Something built with love, especially for both of you.
          </p>
          <p className="font-medium text-gold-light">
            Two gifts. Two journeys. One bond that no distance can ever change.
          </p>
          <p>
            Happy Birthday, my dear sisters! May your lives always be filled with rhythm, grace, happiness, and countless beautiful moments.
          </p>
          <p className="font-regal text-gold-light font-bold pt-2 text-right">
            With all my love, always. ❤️
          </p>
        </div>
      </div>

      {/* Two Vertically Stacked Mobile Gift Cards */}
      <div className="w-full space-y-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold font-semibold">
            <Gift className="w-4 h-4 text-gold" />
            <span>Your Birthday Mobile App Gifts</span>
          </div>
        </div>

        {/* Gift Card 1: Kowsalya's App */}
        <div className={`regal-card w-full rounded-2xl p-5 border transition-all ${
          isKowsalya ? 'border-gold shadow-gold-glow bg-gradient-to-b from-maroon-800 to-maroon-950' : 'border-gold/30'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                <Music className="w-5 h-5 text-gold-light" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-roseGray font-semibold block">
                  Gift For Kowsalya
                </span>
                <h3 className="font-regal text-base sm:text-lg font-bold text-ivory">
                  Salya's Dance Academy
                </h3>
              </div>
            </div>
            {isKowsalya && (
              <span className="px-2 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold-light text-[10px] font-bold">
                Your App
              </span>
            )}
          </div>

          <p className="text-xs text-roseGray-light leading-relaxed mb-4">
            Custom-built mobile academy app for Salya's Dance Academy — manage classes, student rhythms, and choreography schedules in one seamless place.
          </p>

          <a
            href={kowsalyaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full min-h-[48px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-gold-glow active:scale-[0.98] transition-transform text-maroon-950 no-underline"
          >
            <span>Unlock Salya's Dance App</span>
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
          </a>
        </div>

        {/* Gift Card 2: Kowsika's App */}
        <div className={`regal-card w-full rounded-2xl p-5 border transition-all ${
          isKowsika ? 'border-gold shadow-gold-glow bg-gradient-to-b from-maroon-800 to-maroon-950' : 'border-gold/30'
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                <Award className="w-5 h-5 text-gold-light" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-roseGray font-semibold block">
                  Gift For Kowsika
                </span>
                <h3 className="font-regal text-base sm:text-lg font-bold text-ivory">
                  Shrinrityalaya
                </h3>
              </div>
            </div>
            {isKowsika && (
              <span className="px-2 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold-light text-[10px] font-bold">
                Your App
              </span>
            )}
          </div>

          <p className="text-xs text-roseGray-light leading-relaxed mb-4">
            Custom-built mobile academy app for Shrinrityalaya — empower your dancers, manage recital schedules, and preserve traditional Bharatanatyam excellence.
          </p>

          <a
            href={kowsikaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full min-h-[48px] py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-gold-glow active:scale-[0.98] transition-transform text-maroon-950 no-underline"
          >
            <span>Unlock Shrinrityalaya App</span>
            <ExternalLink className="w-4 h-4 stroke-[2.5]" />
          </a>
        </div>
      </div>

      {/* Completion & Finalization action */}
      <div className="w-full space-y-2 pt-2">
        {onOpenReactions && (
          <button
            onClick={onOpenReactions}
            className="btn-outline-gold w-full min-h-[46px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 text-gold-light hover:text-white"
          >
            <Sparkles className="w-4 h-4 text-gold" />
            <span>🎬 View & Download Birthday Reactions</span>
          </button>
        )}

        {onFinishRecording && (
          <button
            onClick={onFinishRecording}
            className="w-full min-h-[40px] py-2 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 text-roseGray hover:text-white transition-colors"
          >
            <span>Finalize & Stop Active Recording</span>
          </button>
        )}
      </div>

      {/* Bottom Footer */}
      <div className="w-full text-center pb-6">
        <OrnamentalBorder />
        <p className="text-xs text-gold-light/80 font-medium">
          Two Souls. One Celebration. ❤️
        </p>
      </div>
    </div>
  );
}
