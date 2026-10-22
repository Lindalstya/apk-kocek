import React, { useState, useEffect } from 'react';
import { MochiCharacter } from './MochiCharacter';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        onComplete();
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="min-h-screen bg-[#080B0F] flex justify-center font-sans select-none cursor-pointer"
      title="Ketuk untuk langsung masuk"
    >
      <div className="w-full max-w-md min-h-screen flex flex-col items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-[#00F0D0] via-[#00D2B3] to-[#00998A] text-[#06231F] sm:min-h-[900px] sm:rounded-[36px] sm:border border-[#252A36]">
        {/* Ambient Glow Orbs */}
        <div className="absolute w-72 h-72 rounded-full bg-white/15 -top-28 -right-24 pointer-events-none" />
        <div className="absolute w-56 h-56 rounded-full bg-white/10 -bottom-20 -left-16 pointer-events-none" />

        {/* Skip Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onComplete();
          }}
          className="absolute top-5 right-5 text-xs font-extrabold px-3 py-1 rounded-full bg-[#06231F]/15 hover:bg-[#06231F]/25 text-[#06231F] transition-all cursor-pointer"
        >
          Lewati ›
        </button>

        {/* Mochi Hero */}
        <div className="relative flex flex-col items-center animate-in zoom-in-75 duration-500">
          <MochiCharacter mood="happy" size={170} interactive={false} />
          <h1 className="text-4xl font-black tracking-tight mt-1 text-[#06231F]">
            Kocek
          </h1>
          <p className="text-sm font-semibold opacity-90 mt-1">
            Atur uang, nabung jadi kebiasaan
          </p>
        </div>

        {/* Progress Bar */}
        <div className="absolute left-10 right-10 bottom-14">
          <div className="h-2 rounded-full bg-[#06231F]/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#06231F] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold opacity-80 mt-2.5 px-0.5">
            <span>Memuat Kocek...</span>
            <span className="font-mono">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
