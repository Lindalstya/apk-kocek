import React, { useState } from 'react';
import { X, Bluetooth, Battery } from 'lucide-react';
import { useKocek } from '../context/KocekContext';
import { MochiCharacter } from './MochiCharacter';
import { MochiMood } from '../types';
import { soundManager } from '../utils/audio';

interface MochiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MochiModal: React.FC<MochiModalProps> = ({ isOpen, onClose }) => {
  const { mochiState, mochiDevice, toggleMochiSound, toggleMochiConnection } = useKocek();
  const [testMood, setTestMood] = useState<MochiMood | null>(null);

  if (!isOpen) return null;

  const currentMood = testMood || mochiState.mood;

  const handleTestMood = (mood: MochiMood) => {
    setTestMood(mood);
    if (mood === 'super_joy') soundManager.playSuperJoy();
    else if (mood === 'happy') soundManager.playHappy();
    else if (mood === 'calm') soundManager.playCalm();
    else if (mood === 'neutral') soundManager.playNeutral();
    else if (mood === 'worried') soundManager.playWorried();
    else if (mood === 'sad') soundManager.playSad();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#12151C] text-slate-100 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#252A36]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#252A36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00F0D0] animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Karakter Dasai Mochi
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Main Visual Display */}
          <div className="bg-gradient-to-b from-[#181B24] to-[#0A0F1D] rounded-3xl p-6 border border-[#252A36] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            <div className="py-2">
              <MochiCharacter mood={currentMood} size={140} interactive={true} />
            </div>

            <p className="text-xs text-sky-300 font-semibold mt-2 text-center">
              Sentuh Mochi untuk interaksi & audio respons!
            </p>

            <div className="mt-2 text-center">
              <span className="text-sm font-bold text-white block">
                {testMood ? `Status: ${testMood.toUpperCase()}` : mochiState.title}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {testMood ? 'Simulasi ekspresi karakter Dasai Mochi' : mochiState.message}
              </span>
            </div>

            {testMood && (
              <button
                onClick={() => setTestMood(null)}
                className="mt-3 text-[11px] font-semibold text-[#00F0D0] bg-blue-950/70 px-3 py-1 rounded-full border border-blue-800/80 cursor-pointer"
              >
                Kembali ke status live →
              </button>
            )}
          </div>

          {/* 6 Mood Expressions list */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              6 Ekspresi Karakter Dasai Mochi:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { mood: 'happy' as MochiMood, label: 'HAPPY', desc: 'Saving progress up' },
                { mood: 'super_joy' as MochiMood, label: 'JOYFUL', desc: 'Goal achieved' },
                { mood: 'calm' as MochiMood, label: 'CALM', desc: 'Stable' },
                { mood: 'neutral' as MochiMood, label: 'NEUTRAL', desc: 'Budget getting high' },
                { mood: 'worried' as MochiMood, label: 'WORRIED', desc: 'Budget almost gone' },
                { mood: 'sad' as MochiMood, label: 'SAD', desc: 'Progress down' },
              ].map(item => (
                <button
                  key={item.mood}
                  onClick={() => handleTestMood(item.mood)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    currentMood === item.mood
                      ? 'bg-[#00F0D0]/25 border-[#00F0D0] text-white shadow-sm'
                      : 'bg-[#181B24] border-[#252A36] hover:bg-[#152445] text-slate-300'
                  }`}
                >
                  <span className="text-xs font-bold text-[#00F0D0] block">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Telemetry info */}
          <div className="bg-[#181B24] rounded-2xl p-4 border border-[#252A36] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-[#00F0D0]" />
                <span className="font-semibold text-slate-200">Perangkat: {mochiDevice.deviceId}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono">
                <Battery className="w-4 h-4 text-emerald-400" />
                <span>{mochiDevice.battery}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#252A36] text-xs">
              <span className="text-slate-400">Status Bluetooth</span>
              <button
                onClick={toggleMochiConnection}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mochiDevice.connected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {mochiDevice.connected ? 'Terhubung (BLE)' : 'Terputus'}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Suara 8-Bit Mochi</span>
              <button
                onClick={toggleMochiSound}
                className="text-[#00F0D0] font-semibold cursor-pointer"
              >
                {mochiDevice.soundEnabled ? 'Aktif (On)' : 'Mati (Mute)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
