import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import DiyaFlame from './DiyaFlame';
import OrnamentalBorder from './OrnamentalBorder';
import { Sparkles, Heart, ExternalLink, Gift, Download, KeyRound, Copy, Check } from 'lucide-react';

export default function GiftReveal({ gifts, participant, onAppDownloadClicked }) {
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    // Joyful celebratory confetti cannons
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

  const isKowsalya = participant?.participant === 'kowsalya' || participant?.participant === 'kausalya';
  const isKowsika = participant?.participant === 'kowsika' || participant?.participant === 'kaushika';

  // Customized Akka Title with exact requested spelling
  const akkaName = isKowsika ? 'Kaushika Akka' : 'Kausalya Akka';
  const myAcademy = isKowsika ? 'Shrinrityalaya' : "Salya's Dance Academy";
  const DEFAULT_KOWSIKA_URL = 'https://github.com/mohamedrifa/ShriNrityalaya/releases/download/Mobile_App/shrinrityalaya.apk';
  const DEFAULT_KOWSALYA_URL = 'https://github.com/mohamedrifa/Salya-s-Dance-Academy/releases/download/Mobile_App/Salya.s.Academy.apk';

  const DEFAULT_KOWSIKA_USERNAME = 'teacher@shrinrityalaya.com';
  const DEFAULT_KOWSIKA_PASSWORD = 'Teacher@123!';
  const DEFAULT_KOWSALYA_USERNAME = 'teacher@salyasacademy.com';
  const DEFAULT_KOWSALYA_PASSWORD = 'Teacher123!';

  const appUrl = isKowsika
    ? (gifts?.kowsikaAppUrl || DEFAULT_KOWSIKA_URL)
    : (gifts?.kowsalyaAppUrl || DEFAULT_KOWSALYA_URL);

  const username = isKowsika
    ? (gifts?.username || gifts?.kowsikaUsername || DEFAULT_KOWSIKA_USERNAME)
    : (gifts?.username || gifts?.kowsalyaUsername || DEFAULT_KOWSALYA_USERNAME);

  const password = isKowsika
    ? (gifts?.password || gifts?.kowsikaPassword || DEFAULT_KOWSIKA_PASSWORD)
    : (gifts?.password || gifts?.kowsalyaPassword || DEFAULT_KOWSALYA_PASSWORD);

  const appLogo = isKowsika ? '/shrinrityalaya-logo.jpg' : '/salyas-logo.jpg';

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6 flex flex-col items-center space-y-6">
      {/* Top Birthday Banner */}
      <div className="w-full text-center pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 border border-gold/50 text-gold-light text-xs font-semibold uppercase tracking-widest mb-3 shadow-gold-glow animate-subtle-pulse">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Surprise Unveiled</span>
          <Sparkles className="w-3.5 h-3.5 text-gold" />
        </div>

        {/* Personalized Header with Akka */}
        <h1 className="font-regal text-3xl sm:text-4xl font-extrabold text-ivory leading-tight">
          Happy Birthday,<br />
          <span className="text-gold-gradient">{akkaName}!</span>
        </h1>

        <OrnamentalBorder />

        <p className="font-script text-xl text-gold-light/95 italic">
          Two Souls. One Celebration.
        </p>
      </div>

      <DiyaFlame size="default" />

      {/* Separated & Personalized Birthday Letter */}
      <div className="regal-card w-full rounded-2xl p-5 sm:p-6 text-left border border-gold/30 shadow-maroon-deep relative overflow-hidden">
        <div className="flex items-center gap-2 text-gold-light mb-3">
          <Heart className="w-4 h-4 fill-gold text-gold" />
          <h2 className="font-regal text-base sm:text-lg font-bold text-ivory">
            To my dearest {akkaName} ❤️
          </h2>
        </div>

        <div className="text-xs sm:text-sm text-ivory/90 space-y-3 leading-relaxed font-sans">
          {isKowsika ? (
            <>
              <p>
                Two hearts that began their journey together, and an inspiring sister whose rhythm, passion, and grace in Bharatham have always brought light to everyone around you.
              </p>
              <p>
                Through <strong className="text-gold-light font-semibold">Shrinrityalaya</strong>, you are doing something truly sacred — nurturing young dancers, instilling devotion, discipline, and passing on our timeless classical heritage to the next generation.
              </p>
              <p>
                Today, on your special birthday, I wanted to give you a surprise crafted with all my love, especially for you and your academy.
              </p>
              <p className="font-medium text-gold-light">
                A custom mobile app created exclusively for Shrinrityalaya to empower your dance family.
              </p>
              <p>
                Happy Birthday, Kaushika Akka! May your journey always be blessed with rhythm, divine grace, boundless joy, and endless success.
              </p>
            </>
          ) : (
            <>
              <p>
                Two hearts that began their journey together, and an incredible sister whose rhythm, dedication, and mastery of Bharatham continue to inspire everyone who watches you dance.
              </p>
              <p>
                Through <strong className="text-gold-light font-semibold">Salya's Dance Academy</strong>, you are sharing more than technique — you are giving life to our tradition, discipline, expression, and the soul of our classical art form.
              </p>
              <p>
                Today, on your special birthday, I wanted to give you a surprise built with all my love, especially for you and your academy.
              </p>
              <p className="font-medium text-gold-light">
                A custom mobile app created exclusively for Salya's Dance Academy to take your vision to the next level.
              </p>
              <p>
                Happy Birthday, Kausalya Akka! May your life always resonate with rhythm, happiness, peace, and shining achievements.
              </p>
            </>
          )}

          <p className="font-regal text-gold-light font-bold pt-2 text-right">
            With all my love, always. ❤️
          </p>
        </div>
      </div>

      {/* Strictly Separated App Gift Card (Shows ONLY this sister's gift) */}
      <div className="w-full space-y-3">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-gold font-semibold">
            <Gift className="w-4 h-4 text-gold" />
            <span>Your Birthday Mobile App Gift</span>
          </div>
        </div>

        {/* Dedicated Gift Card with Real Uploaded Academy Logo */}
        <div className="regal-card w-full rounded-2xl p-5 border border-gold shadow-gold-glow bg-gradient-to-b from-maroon-900/90 via-maroon-950 to-maroon-950">
          <div className="flex items-center gap-4 mb-4">
            {/* Real Uploaded Academy App Logo */}
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-gold shadow-gold-glow shrink-0 bg-maroon-950">
              <img
                src={appLogo}
                alt={`${myAcademy} Logo`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-wider text-roseGray font-semibold block">
                Exclusive Birthday Gift
              </span>
              <h3 className="font-regal text-lg sm:text-xl font-bold text-ivory truncate">
                {myAcademy}
              </h3>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold-light text-[10px] font-bold">
                Official Release
              </span>
            </div>
          </div>

          <p className="text-xs text-roseGray-light leading-relaxed mb-4">
            {isKowsika
              ? "Your dedicated mobile academy application for Shrinrityalaya — manage classes, student choreography, recital schedules, and preserve traditional excellence."
              : "Your dedicated mobile academy application for Salya's Dance Academy — manage student batches, dance schedules, choreography notes, and academy announcements."}
          </p>

          {/* Academy App Login Credentials Card */}
          <div className="mb-4 rounded-xl bg-maroon-950/90 border border-gold/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gold-light text-xs font-semibold">
                <KeyRound className="w-3.5 h-3.5 text-gold" />
                <span>App Login Credentials</span>
              </div>
              <span className="text-[10px] text-roseGray">Tap to copy</span>
            </div>

            {/* Username Field */}
            <div className="flex items-center justify-between gap-2 bg-maroon-900/60 border border-gold/20 rounded-lg p-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-roseGray block uppercase tracking-wider font-semibold">Username</span>
                <span className="font-mono text-ivory text-xs sm:text-[13px] truncate block select-all font-medium">
                  {username}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(username, 'username')}
                className="shrink-0 px-2.5 py-1.5 rounded-md bg-gold/15 hover:bg-gold/25 active:bg-gold/40 border border-gold/40 text-gold-light text-xs font-semibold flex items-center gap-1 transition-all"
                title="Copy username"
              >
                {copiedField === 'username' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Password Field */}
            <div className="flex items-center justify-between gap-2 bg-maroon-900/60 border border-gold/20 rounded-lg p-2 text-xs">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-roseGray block uppercase tracking-wider font-semibold">Password</span>
                <span className="font-mono text-ivory text-xs sm:text-[13px] truncate block select-all font-medium">
                  {password}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(password, 'password')}
                className="shrink-0 px-2.5 py-1.5 rounded-md bg-gold/15 hover:bg-gold/25 active:bg-gold/40 border border-gold/40 text-gold-light text-xs font-semibold flex items-center gap-1 transition-all"
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onAppDownloadClicked}
            className="btn-gold w-full min-h-[50px] py-3.5 px-5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-gold-glow active:scale-[0.98] transition-transform text-maroon-950 no-underline"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Unlock & Download App</span>
            <ExternalLink className="w-4 h-4 stroke-[2.5] ml-1 opacity-80" />
          </a>
        </div>
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
