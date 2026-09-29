// hooks/useWebSoundtrack.ts - Reaktiver Hook für den prozeduralen Web-Soundtrack

import { useEffect, useRef } from 'react';
import { ProceduralMusicEngine, MusicState } from '../services/proceduralMusicEngine';
import { ProceduralAudioEngine } from '../services/audioEngine';

export const useWebSoundtrack = (activeState: MusicState, isMuted: boolean = false) => {
  const engineRef = useRef<ProceduralMusicEngine | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Singleton-Engine Referenz am Window-Objekt zur persistenten Vermeidung von Audio-Duplikaten
    const win = window as unknown as {
      terminalAudioCtx?: AudioContext;
      terminalMusicEngine?: ProceduralMusicEngine;
    };

    if (!win.terminalMusicEngine) {
      const parentAudio = ProceduralAudioEngine.getInstance();
      const audioCtx =
        parentAudio.ctx ||
        win.terminalAudioCtx ||
        new AudioContext({ sampleRate: 48000 });

      win.terminalAudioCtx = audioCtx;
      const destination = parentAudio.ambientGain || undefined;
      const engine = new ProceduralMusicEngine(audioCtx, destination);
      win.terminalMusicEngine = engine;
      engineRef.current = engine;

      if (!isMuted) {
        engine.start();
      }
    } else {
      engineRef.current = win.terminalMusicEngine;
    }

    if (engineRef.current) {
      engineRef.current.setMusicState(activeState);
    }
  }, [activeState]);

  // Stummschaltung synchronisieren
  useEffect(() => {
    if (engineRef.current) {
      if (isMuted) {
        engineRef.current.stop();
      } else {
        engineRef.current.start();
        engineRef.current.setMusicState(activeState);
      }
    }
  }, [isMuted, activeState]);

  // Tab-Wechsel überwachen (CPU-Schonung auf 0.0%)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!engineRef.current) return;
      if (document.hidden) {
        engineRef.current.stop();
      } else if (!isMuted) {
        engineRef.current.start();
        engineRef.current.setMusicState(activeState);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMuted, activeState]);

  return engineRef.current;
};
