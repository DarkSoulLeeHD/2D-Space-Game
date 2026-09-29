import React, { useState, useEffect } from 'react';
import { ICrateDrop, ItemRarity } from '../types/economy';
import { EconomyAudioEngine } from '../services/economyAudio';

interface MysteryCrateModalProps {
  isOpen: boolean;
  drop: ICrateDrop | null;
  currentPity: number;
  onClose: () => void;
  onOpenAnother: () => void;
  canOpenAnother: boolean;
  costCrystals: number;
}

const RARITY_COLORS: Record<ItemRarity, { text: string; border: string; glow: string; bg: string }> = {
  STANDARD: {
    text: 'text-gray-400',
    border: 'border-gray-500',
    glow: 'rgba(150, 150, 150, 0.4)',
    bg: 'bg-gray-950/80',
  },
  VERSTÄRKT: {
    text: 'text-emerald-400',
    border: 'border-emerald-500',
    glow: 'rgba(16, 185, 129, 0.6)',
    bg: 'bg-emerald-950/80',
  },
  ASTRAEA_SPEC: {
    text: 'text-cyan-400',
    border: 'border-cyan-400',
    glow: 'rgba(0, 240, 255, 0.7)',
    bg: 'bg-cyan-950/80',
  },
  ENTROPISCH: {
    text: 'text-fuchsia-400',
    border: 'border-fuchsia-500',
    glow: 'rgba(217, 70, 239, 0.8)',
    bg: 'bg-fuchsia-950/80',
  },
  APEX: {
    text: 'text-amber-300 font-bold',
    border: 'border-amber-400',
    glow: 'rgba(251, 191, 36, 0.9)',
    bg: 'bg-amber-950/90',
  },
};

export const MysteryCrateModal: React.FC<MysteryCrateModalProps> = ({
  isOpen,
  drop,
  currentPity,
  onClose,
  onOpenAnother,
  canOpenAnother,
  costCrystals,
}) => {
  const [phase, setPhase] = useState<'DECOMPRESSING' | 'REVEALED'>('DECOMPRESSING');

  useEffect(() => {
    if (isOpen && drop) {
      setPhase('DECOMPRESSING');
      EconomyAudioEngine.getInstance().playCrateOpening();
      const timer = setTimeout(() => {
        setPhase('REVEALED');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, drop]);

  if (!isOpen || !drop) return null;

  const style = RARITY_COLORS[drop.rarity] || RARITY_COLORS.STANDARD;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`relative w-full max-w-xl border-2 ${style.border} ${style.bg} p-6 shadow-2xl transition-all duration-300`}
        style={{
          boxShadow: phase === 'REVEALED' ? `0 0 40px ${style.glow}` : 'none',
        }}
      >
        {/* Top telemetry banner */}
        <div className="flex items-center justify-between border-b border-white/20 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400">
              ASTRAEA MYSTERY BERGUNGS-DEKOMPRESSOR
            </span>
          </div>
          <span className="text-xs font-mono text-gray-400">
            PITY-INDEX: {currentPity} / 4 {currentPity >= 4 ? '⚠ [APEX GARANTIERT]' : ''}
          </span>
        </div>

        {/* Content body */}
        {phase === 'DECOMPRESSING' ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-6" />
            <div className="text-lg font-mono font-bold text-cyan-300 tracking-wider">
              QUANTUM-SIEGEL WIRD DEKOMPRIMIERT...
            </div>
            <div className="text-xs font-mono text-gray-400 mt-2">
              Kausalitäts-Resonanz wird synchronisiert
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            {drop.isGuaranteedApex && (
              <div className="mb-2 px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold tracking-widest animate-pulse">
                ★ PITY-SYSTEM AKTIVIERT: GARANTIERTER APEX-DROP ★
              </div>
            )}

            <div className="text-xs uppercase tracking-widest text-gray-400 mb-1">
              SELTENHEITS-STUFE
            </div>
            <div className={`text-xl font-bold tracking-widest ${style.text} mb-3`}>
              [{drop.rarity}]
            </div>

            {/* Item box */}
            <div className="w-full bg-black/60 border border-white/10 p-5 rounded my-2 text-left">
              <div className="flex justify-between items-start">
                <div className="text-lg font-bold text-white tracking-wide font-mono">
                  {drop.item.name}
                </div>
                {drop.item.slot && (
                  <span className="px-2 py-0.5 text-[10px] bg-white/10 text-cyan-300 rounded font-mono border border-cyan-500/30">
                    SLOT: {drop.item.slot}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-300 mt-2 font-mono leading-relaxed">
                {drop.item.description}
              </p>

              {drop.item.statBonus && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400">STAT-BONUS:</span>
                  <span className="text-xs font-mono text-amber-300">{drop.item.statBonus}</span>
                </div>
              )}
            </div>

            {/* Pity Explanation */}
            <div className="text-[11px] text-gray-400 mt-2">
              Neuer Pity-Zähler: <span className="text-white font-bold">{drop.newPity}</span> / 4 (Garantierter APEX-Drop bei Zähler 4)
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-600 bg-gray-900/60 hover:bg-gray-800 text-gray-200 text-xs font-mono tracking-wider transition-colors"
          >
            [ESC] IM INVENTAR VERSTAUEN
          </button>

          {phase === 'REVEALED' && (
            <button
              onClick={onOpenAnother}
              disabled={!canOpenAnother}
              className={`px-5 py-2 border text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 ${
                canOpenAnother
                  ? 'border-amber-400 bg-amber-950/60 hover:bg-amber-800/80 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'border-gray-800 bg-gray-950 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>NOCH EINE KISTE ÖFFNEN ({costCrystals} CK)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
