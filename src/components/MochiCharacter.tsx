import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MochiMood } from '../types';
import { soundManager } from '../utils/audio';

interface MochiCharacterProps {
  mood: MochiMood;
  size?: number;
  interactive?: boolean;
  onPoke?: () => void;
  className?: string;
  showStatusLabel?: boolean;
}

export const MochiCharacter: React.FC<MochiCharacterProps> = ({
  mood,
  size = 120,
  interactive = true,
  onPoke,
  className = '',
  showStatusLabel = false,
}) => {
  const [isPoked, setIsPoked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    setIsPoked(true);
    soundManager.playTap();
    if (onPoke) onPoke();
    setTimeout(() => setIsPoked(false), 500);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <motion.div
        onClick={handleClick}
        className={`relative ${interactive ? 'cursor-pointer' : ''}`}
        animate={
          isPoked
            ? { scale: [0.95, 1.08, 0.98, 1], y: [-6, 2, 0] }
            : { y: [0, -4, 0] }
        }
        transition={{
          y: { repeat: isPoked ? 0 : Infinity, duration: 3.5, ease: 'easeInOut' },
          scale: { duration: 0.4 },
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ambient Floor Shadow */}
          <ellipse cx="80" cy="148" rx="46" ry="7" fill="#0B1220" fillOpacity="0.08" />

          {/* Sparkles / Effects based on mood */}
          {mood === 'happy' && (
            <g transform="translate(88, 14)">
              <path
                d="M4 22L16 12L24 18L36 4"
                stroke="#00F0D0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M26 4H36V14"
                stroke="#00F0D0"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}

          {mood === 'super_joy' && (
            <g>
              <path d="M32 30C32 30 35 34 38 34C35 34 32 38 32 38C32 38 29 34 26 34C29 34 32 30 32 30Z" fill="#FBBF24" />
              <path d="M44 14C44 14 47 19 51 19C47 19 44 24 44 24C44 24 41 19 37 19C41 19 44 14 44 14Z" fill="#F59E0B" />
              <path d="M120 18C120 18 123 23 127 23C123 23 120 28 120 28C120 28 117 23 113 23C117 23 120 18 120 18Z" fill="#F59E0B" />
              <path d="M132 32C132 32 135 35 137 35C135 35 132 38 132 38C132 38 129 35 127 35C129 35 132 32 132 32Z" fill="#FBBF24" />
            </g>
          )}

          {mood === 'worried' && (
            /* Cold sweat drop */
            <path
              d="M124 50C124 50 128 58 128 61C128 63.2 126.2 65 124 65C121.8 65 120 63.2 120 61C120 58 124 50 124 50Z"
              fill="#38BDF8"
            />
          )}

          {/* Left Arm */}
          {mood === 'super_joy' ? (
            <path
              d="M36 68C30 58 24 52 18 56C12 60 20 72 28 78C32 81 38 78 36 68Z"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
          ) : mood === 'worried' ? (
            <ellipse cx="44" cy="112" rx="10" ry="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          ) : (
            <ellipse cx="28" cy="100" rx="9" ry="11" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          )}

          {/* Right Arm */}
          {mood === 'super_joy' ? (
            <path
              d="M124 68C130 58 136 52 142 56C148 60 140 72 132 78C128 81 122 78 124 68Z"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
          ) : mood === 'worried' ? (
            <ellipse cx="116" cy="112" rx="10" ry="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          ) : (
            <ellipse cx="132" cy="100" rx="9" ry="11" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          )}

          {/* Main Body (Mochi soft rounded silhouette) */}
          <path
            d="M32 116C28 82 46 38 80 38C114 38 132 82 128 116C126 138 112 146 80 146C48 146 34 138 32 116Z"
            fill="url(#mochi_gradient)"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />

          {/* Cheeks Blush */}
          <ellipse cx="50" cy="98" rx="8" ry="4.5" fill="#93C5FD" fillOpacity="0.85" />
          <ellipse cx="110" cy="98" rx="8" ry="4.5" fill="#93C5FD" fillOpacity="0.85" />

          {/* Facial Expressions */}
          {mood === 'calm' ? (
            <g>
              {/* Calm closed eyes */}
              <path d="M58 84C62 80 70 80 74 84" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M86 84C90 80 98 80 102 84" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
              {/* Gentle smile */}
              <path d="M74 94C77 97 83 97 86 94" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : mood === 'neutral' ? (
            <g>
              {/* Alert rounded eyes */}
              <ellipse cx="66" cy="84" rx="4.5" ry="6" fill="#0F172A" />
              <ellipse cx="94" cy="84" rx="4.5" ry="6" fill="#0F172A" />
              <circle cx="67.5" cy="82" r="1.5" fill="white" />
              <circle cx="95.5" cy="82" r="1.5" fill="white" />
              {/* Straight line mouth */}
              <line x1="75" y1="94" x2="85" y2="94" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : mood === 'worried' ? (
            <g>
              {/* Worried tilted brows */}
              <path d="M60 76C63 74 69 76 71 78" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M99 78C97 76 91 74 89 76" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              {/* Worried eyes */}
              <ellipse cx="66" cy="84" rx="4.5" ry="6" fill="#0F172A" />
              <ellipse cx="94" cy="84" rx="4.5" ry="6" fill="#0F172A" />
              <circle cx="67.5" cy="82" r="1.5" fill="white" />
              <circle cx="95.5" cy="82" r="1.5" fill="white" />
              {/* Wavy mouth */}
              <path d="M75 97C77 94 83 94 85 97" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </g>
          ) : mood === 'sad' ? (
            <g>
              {/* Slanted sad brows */}
              <path d="M60 74C65 77 71 77 72 79" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M100 74C95 77 89 77 88 79" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              {/* Tearful eyes */}
              <ellipse cx="66" cy="85" rx="4.5" ry="6" fill="#0F172A" />
              <ellipse cx="94" cy="85" rx="4.5" ry="6" fill="#0F172A" />
              {/* Downward curve mouth */}
              <path d="M74 98C77 94 83 94 86 98" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          ) : (
            /* Happy / Super Joy default */
            <g>
              <ellipse cx="66" cy="82" rx="4.5" ry="6.5" fill="#0F172A" />
              <ellipse cx="94" cy="82" rx="4.5" ry="6.5" fill="#0F172A" />
              <circle cx="67.5" cy="80" r="1.8" fill="white" />
              <circle cx="95.5" cy="80" r="1.8" fill="white" />
              {/* Big happy open mouth */}
              <path d="M74 90C74 90 75 99 80 99C85 99 86 90 86 90H74Z" fill="#0F172A" />
              <path d="M76 96C77 98 83 98 84 96" fill="#F43F5E" />
            </g>
          )}

          {/* Golden/Cyan Indonesian "Rp" Coin Badge */}
          <g transform="translate(68, 108)">
            <circle cx="12" cy="12" r="11" fill="#00F0D0" stroke="#00C4A7" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="9" fill="#00DBBE" />
            <text
              x="12"
              y="15.5"
              textAnchor="middle"
              fill="#0E1116"
              fontSize="9"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              Rp
            </text>
          </g>

          <defs>
            <linearGradient id="mochi_gradient" x1="80" y1="38" x2="80" y2="146" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.85" stopColor="#F8FAFC" />
              <stop offset="1" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
      {showStatusLabel && (
        <span className="text-[11px] font-bold text-[#00F0D0] mt-1 capitalize tracking-wide">
          {mood.replace('_', ' ')}
        </span>
      )}
    </div>
  );
};
