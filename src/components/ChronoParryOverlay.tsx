import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface ChronoParryOverlayProps {
  attackerName: string;
  incomingDamage: number;
  onParrySuccess: () => void;
  onParryFail: () => void;
}

export const ChronoParryOverlay: React.FC<ChronoParryOverlayProps> = ({
  attackerName,
  incomingDamage,
  onParrySuccess,
  onParryFail,
}) => {
  const [progress, setProgress] = useState(0); // 0 bis 100%
  const [resolved, setResolved] = useState(false);
  const [resultState, setResultState] = useState<'IDLE' | 'PERFECT' | 'MISSED'>('IDLE');
  const progressRef = useRef(0);

  const audio = ProceduralAudioEngine.getInstance();

  const handleTrigger = useCallback(() => {
    if (resolved) return;
    setResolved(true);

    const currentProg = progressRef.current;
    // Sweet-spot: zwischen 60% und 76% (160ms Timing-Band)
    if (currentProg >= 60 && currentProg <= 76) {
      setResultState('PERFECT');
      audio.playParrySuccessBoom();
      setTimeout(() => {
        onParrySuccess();
      }, 400);
    } else {
      setResultState('MISSED');
      audio.playShieldDeflect();
      setTimeout(() => {
        onParryFail();
      }, 350);
    }
  }, [resolved, onParrySuccess, onParryFail, audio]);

  useEffect(() => {
    const startTime = performance.now();
    const duration = 1200; // 1,2 Sekunden Gesamtlaufzeit

    let animId: number;

    const frame = (now: number) => {
      if (resolved) return;
      const elapsed = now - startTime;
      const currentProgress = Math.min(100, (elapsed / duration) * 100);
      progressRef.current = currentProgress;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        setResolved(true);
        setResultState('MISSED');
        audio.playShieldDeflect();
        setTimeout(() => {
          onParryFail();
        }, 300);
      } else {
        animId = requestAnimationFrame(frame);
      }
    };

    animId = requestAnimationFrame(frame);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resolved, handleTrigger, onParryFail, audio]);

  return (
    <div
      onClick={handleTrigger}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs cursor-pointer select-none font-mono"
    >
      <div className="bg-[#0b1017] border-2 border-cyan-400 p-6 shadow-[0_0_40px_rgba(0,255,170,0.4)] max-w-md w-full text-center space-y-4">
        {resultState === 'IDLE' && (
          <>
            <div className="text-cyan-400 text-xs tracking-widest uppercase font-bold animate-pulse">
              [!] GEGNERISCHER ANGRIFF: {attackerName}
            </div>
            <div className="text-red-400 text-sm font-bold tracking-wider">
              EINGEHENDER SCHADEN: -{incomingDamage} DMG
            </div>
            <div className="text-[11px] text-gray-300">
              Klicke oder drücke <strong className="text-white underline">[LEERTASTE]</strong> im Sweet-Spot!
            </div>
          </>
        )}

        {resultState === 'PERFECT' && (
          <div className="text-2xl font-black text-[#00FFAA] tracking-widest drop-shadow-[0_0_20px_#00FFAA] animate-bounce">
            &gt;&gt; PERFEKTE CHRONO-PARADE! &lt;&lt;
            <div className="text-xs text-cyan-300 font-normal mt-1 tracking-wider">
              0 DMG ERLITTEN // GEGNER BETÄUBT // +1 AP NÄCHSTE RUNDE
            </div>
          </div>
        )}

        {resultState === 'MISSED' && (
          <div className="text-xl font-bold text-red-400 tracking-wider">
            PARADE VERFEHLT // VOLLER EINSCHLAG
          </div>
        )}

        {/* Chrono-Timing Bar */}
        <div className="w-full h-8 bg-slate-950 border border-cyan-800 relative overflow-hidden">
          {/* Sweet-Spot (60% bis 76% = 160ms) */}
          <div className="absolute left-[60%] w-[16%] top-0 bottom-0 bg-cyan-400/35 border-x-2 border-cyan-400 flex items-center justify-center">
            <span className="text-[9px] text-cyan-300 font-bold uppercase tracking-wider">
              PARRY
            </span>
          </div>

          {/* Running Cursor */}
          <div
            className="absolute top-0 bottom-0 w-2 bg-white shadow-[0_0_12px_#ffffff] transition-none"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="text-[10px] text-cyan-500/80 tracking-widest">
          TIMING-FENSTER: 160ms // REAKTIONS-EVENT
        </div>
      </div>
    </div>
  );
};
