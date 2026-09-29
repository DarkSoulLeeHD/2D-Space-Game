import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { BootPhase, IBootTelemetry } from '../types/boot';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { AttractCanvas } from './AttractCanvas';
import { TutorialModal } from './TutorialModal';

interface BootSequenceProps {
  onBootComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onBootComplete }) => {
  const [phase, setPhase] = useState<BootPhase>('HARDWARE_PROBE');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [, startTransition] = useTransition();

  // Telemetry state
  const [telemetry, setTelemetry] = useState<IBootTelemetry>({
    webGlSupported: true,
    audioUnlocked: false,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 32) : 'Astraea-Agent/7.0',
    hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    deviceMemory: typeof navigator !== 'undefined' ? (navigator as unknown as { deviceMemory?: number }).deviceMemory || 8 : 8,
    networkLatency: 14,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
    localStorageAvailable: true,
  });

  // Settings & Accessibility
  const [reducedMotion, setReducedMotion] = useState(false);
  const [disableFlicker, setDisableFlicker] = useState(false);
  const [audioBlockedWarning, setAudioBlockedWarning] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Probe environment on mount
  useEffect(() => {
    // 1. Detect prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReducedMotion(true);
    }

    // 2. Test LocalStorage sandbox integrity
    let storageAvailable = true;
    try {
      const testKey = '__astraea_probe__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      storageAvailable = false;
    }

    // 3. Test WebGL / Canvas capabilities
    let webGlOk = true;
    try {
      const c = document.createElement('canvas');
      webGlOk = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch {
      webGlOk = false;
    }

    setTelemetry((prev) => ({
      ...prev,
      webGlSupported: webGlOk,
      localStorageAvailable: storageAvailable,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    }));

    // Phase 1 timer -> Move to AWAITING_USER_GESTURE after 1.20s POST
    const timer = setTimeout(() => {
      setPhase('AWAITING_USER_GESTURE');
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  // Handle User Gesture to Unlock Web Audio (Phase 2 -> Phase 3)
  const handleUserUnlock = useCallback(async () => {
    if (phase !== 'AWAITING_USER_GESTURE') return;

    const audio = ProceduralAudioEngine.getInstance();
    const unlocked = await audio.initAudio();

    if (!unlocked) {
      setAudioBlockedWarning(true);
    }

    setTelemetry((prev) => ({ ...prev, audioUnlocked: unlocked }));

    // Switch to Phase 03: PHOSPHOR_IGNITION
    setPhase('PHOSPHOR_IGNITION');

    // Trigger CRT power-on transient and relay click
    if (unlocked) {
      audio.playCrtPowerOn();
      setTimeout(() => {
        audio.playRelayClick();
      }, 150);
    }

    // After Phosphor ignition & Monogram (2.3s), transition to Phase 04: ATTRACT_ACTIVE
    setTimeout(() => {
      setPhase('ATTRACT_ACTIVE');
      if (unlocked && !isAudioMuted) {
        audio.startAttractDrone();
      }
    }, 2200);
  }, [phase, isAudioMuted]);

  // Transition from Attract to Home Screen (Phase 04 -> Phase 05 -> Home)
  const handleInitializeTerminal = useCallback(() => {
    if (phase !== 'ATTRACT_ACTIVE') return;

    const audio = ProceduralAudioEngine.getInstance();
    audio.playUiClick();

    // 0ms - 80ms: Screen flash
    setFlashActive(true);
    setPhase('TRANSITIONING_HOME');

    setTimeout(() => {
      setFlashActive(false);
    }, 90);

    // Stop attract drone smoothly
    audio.stopAttractDrone();

    // Complete boot sequence at 450ms
    setTimeout(() => {
      startTransition(() => {
        onBootComplete();
      });
    }, 450);
  }, [phase, onBootComplete]);

  // Global Keyboard listener for Gestures, Enter/Space and [T] Tutorial
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTutorialOpen) {
        // Tutorial modal handles its own Escape and arrow keys
        return;
      }

      // Hotkey [T] opens Operative Manual / Tutorial anytime
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        const audio = ProceduralAudioEngine.getInstance();
        audio.playSelectClick();
        setIsTutorialOpen(true);
        return;
      }

      if (e.key === 'Tab') return;

      if (phase === 'AWAITING_USER_GESTURE') {
        handleUserUnlock();
      } else if (phase === 'PHOSPHOR_IGNITION') {
        // Fast-forward to Attract on Enter or Space
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPhase('ATTRACT_ACTIVE');
        }
      } else if (phase === 'ATTRACT_ACTIVE') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleInitializeTerminal();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, isTutorialOpen, handleUserUnlock, handleInitializeTerminal]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = ProceduralAudioEngine.getInstance();
    const muted = audio.toggleMute();
    setIsAudioMuted(muted);
    if (!muted && phase === 'ATTRACT_ACTIVE') {
      audio.startAttractDrone();
    }
  };

  return (
    <div
      onClick={
        phase === 'AWAITING_USER_GESTURE'
          ? handleUserUnlock
          : phase === 'ATTRACT_ACTIVE'
          ? handleInitializeTerminal
          : undefined
      }
      className={`relative w-screen h-screen bg-[#070a0e] text-[#d8e2dc] font-mono overflow-hidden select-none flex flex-col justify-between ${
        phase === 'AWAITING_USER_GESTURE' || phase === 'ATTRACT_ACTIVE' ? 'cursor-pointer' : ''
      }`}
    >
      {/* Diegetischer CRT Phosphor Flash */}
      {flashActive && (
        <div className="absolute inset-0 z-[60] bg-cyan-300 pointer-events-none transition-opacity duration-75" />
      )}

      {/* CRT Scanline Overlay (Deaktivierbar via Barrierefreiheit) */}
      {!disableFlicker && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.38)_50%)] bg-[length:100%_4px] opacity-35"
        />
      )}

      {/* Subtle CRT Vignette Shader */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(4,6,9,0.85)_100%)]"
      />

      {/* ========================================================================= */}
      {/* TOP-DOCK: SYSTEM-TELEMETRIE & RUNTIME SPECS */}
      {/* ========================================================================= */}
      <header className="relative z-30 h-12 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/60 bg-[#070a0e]/90 text-[10px] sm:text-xs text-cyan-300 font-medium tracking-wider">
        <div className="flex items-center gap-3 sm:gap-6 truncate">
          <span className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                phase === 'HARDWARE_PROBE'
                  ? 'bg-amber-400 animate-ping'
                  : phase === 'AWAITING_USER_GESTURE'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-[#00FFAA] shadow-[0_0_8px_#00FFAA]'
              }`}
            />
            NODE: AETHEL-WEB-01
          </span>
          <span className="hidden md:inline text-cyan-200">LATENCY: {telemetry.networkLatency}ms</span>
          <span className="hidden lg:inline text-cyan-200">CORE-TEMP: 38°C</span>
          <span className="hidden sm:inline text-cyan-200">MEM: {telemetry.deviceMemory}GB</span>
          <span className="hidden xl:inline text-cyan-200">STORAGE: {telemetry.localStorageAvailable ? 'OK' : 'VOLATILE'}</span>
        </div>

        {/* Accessibility, Tutorial & Audio Controls */}
        <div className="flex items-center gap-3 text-[10px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const audio = ProceduralAudioEngine.getInstance();
              audio.playSelectClick();
              setIsTutorialOpen(true);
            }}
            className="px-2 py-0.5 border border-[#00FFAA]/80 bg-[#00FFAA]/10 text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-[0_0_8px_rgba(0,255,170,0.3)] animate-pulse"
            title="Operative Manual / Handbuch öffnen [Taste T]"
          >
            <span>[T] TUTORIAL</span>
          </button>
          <button
            onClick={handleToggleMute}
            className="px-2 py-0.5 border border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
            title="Audio Stummschaltung"
          >
            {isAudioMuted ? '[ AUDIO: AUS ]' : '[ AUDIO: AN ]'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDisableFlicker(!disableFlicker);
            }}
            className="hidden sm:inline-block px-2 py-0.5 border border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
          >
            {disableFlicker ? '[ FLACKERN: AUS ]' : '[!] FLACKERN DEAKTIVIEREN'}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT: PHASES (POST / GESTURE GATE / IGNITION / ATTRACT DIORAMA) */}
      {/* ========================================================================= */}
      <main className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* PHASE 01: HARDWARE PROBE (0.00s - 1.20s) */}
        {phase === 'HARDWARE_PROBE' && (
          <div className="flex flex-col items-center space-y-4 max-w-md px-6 text-center animate-pulse">
            <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <h2 className="text-cyan-400 font-bold tracking-[0.3em] text-sm">
              PHASE 01: SYSTEM POST & HARDWARE PROBE
            </h2>
            <div className="text-[11px] text-cyan-200 font-mono space-y-1 text-left bg-black/50 p-4 border border-cyan-800/80 w-full font-medium">
              <p>&gt; PROBING BROWSER RUNTIME MATRIX...</p>
              <p>&gt; SCREEN RES: {telemetry.screenWidth}x{telemetry.screenHeight} px [OK]</p>
              <p>&gt; HARDWARE THREADS: {telemetry.hardwareConcurrency} CORES [OK]</p>
              <p>&gt; SANDBOX STORAGE INTEGRITY: {telemetry.localStorageAvailable ? 'SANDBOX VERIFIED' : 'LOCAL QUOTA OVERFLOW'}</p>
              <p>&gt; WEBGL 2D RENDERER: {telemetry.webGlSupported ? 'INITIALIZED' : 'SOFTWARE EMULATION'}</p>
            </div>
          </div>
        )}

        {/* PHASE 02: THE USER GESTURE GATE */}
        {phase === 'AWAITING_USER_GESTURE' && (
          <div className="flex flex-col items-center justify-center space-y-8 max-w-lg px-6 text-center z-20">
            <div className="space-y-3">
              <div className="text-xs text-cyan-300 tracking-[0.4em] uppercase font-bold">
                ASTRAEA MODEL-7 // TAKTIK-TERMINAL
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-[0.25em] text-[#00FFAA] drop-shadow-[0_0_20px_rgba(0,255,170,0.5)]">
                CHRONO-STRATUM
              </h1>
              <div className="text-sm tracking-[0.3em] text-cyan-200 font-semibold">
                PROTOCOL : NULL
              </div>
            </div>

            <div className="p-6 bg-cyan-950/30 border border-cyan-400/80 shadow-[0_0_25px_rgba(0,255,170,0.15)] rounded-xs w-full space-y-4">
              <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs tracking-widest font-bold animate-pulse">
                INTERAKTIONS-SCHRANKE // AUDIO-GATEWAY
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Der Browser erfordert eine physische Benutzer-Geste zur Entriegelung der prozeduralen Web Audio Synthesizer-Engine.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUserUnlock();
                }}
                className="w-full py-4 bg-[#00FFAA]/10 border border-[#00FFAA] text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black font-bold tracking-[0.25em] transition-all duration-150 shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_35px_rgba(0,255,170,0.7)] text-sm sm:text-base cursor-pointer"
              >
                [ &gt; ] SYSTEM BEREIT // KLICKEN ZUR INITIALISIERUNG
              </button>
              <div className="text-[10px] text-cyan-300 tracking-wider font-semibold">
                ODER EINE BELIEBIGE TASTE DRÜCKEN
              </div>
            </div>
          </div>
        )}

        {/* PHASE 03: PHOSPHOR-BLÜHEN & MIDDLEWARE-STINGER (1.20s - 3.50s) */}
        {phase === 'PHOSPHOR_IGNITION' && (
          <div className="flex flex-col items-center justify-center space-y-6 z-20 animate-in fade-in zoom-in-95 duration-500">
            {/* Vektor-Monogramm: ASTRAEA INTERACTIVE */}
            <div className="relative p-8 border-2 border-cyan-400 bg-cyan-950/30 shadow-[0_0_40px_rgba(0,255,170,0.4)]">
              <div className="text-4xl sm:text-6xl font-black text-cyan-300 tracking-[0.3em] font-mono">
                ASTRAEA
              </div>
              <div className="text-center text-xs tracking-[0.6em] text-cyan-400 mt-2 font-bold border-t border-cyan-800/80 pt-2">
                INTERACTIVE SYSTEMS
              </div>
            </div>
            <div className="text-xs font-mono text-cyan-300 tracking-widest flex items-center gap-2 font-semibold">
              <span className="w-2 h-2 bg-cyan-400 animate-ping inline-block" />
              PHOSPHOR-BLÜHEN // SYNTHESIZER 48.000 Hz INITIALISIERT...
            </div>
          </div>
        )}

        {/* PHASE 04: THE GREETING GATE / ATTRACT SCREEN */}
        {(phase === 'ATTRACT_ACTIVE' || phase === 'TRANSITIONING_HOME') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* HTML5 Canvas 2D Echtzeit-Viewport (Attract Diorama) */}
            <div className="absolute inset-0 z-10">
              <AttractCanvas
                reducedMotion={reducedMotion}
                isTransitioning={phase === 'TRANSITIONING_HOME'}
              />
            </div>

            {/* Overlaid Attract HUD Controls */}
            <div className="relative z-20 flex flex-col items-center text-center space-y-5 px-4 max-w-xl pointer-events-auto">
              <div className="space-y-2 bg-[#070a0e]/85 p-4 border border-cyan-700/60 backdrop-blur-xs">
                <div className="text-xs sm:text-sm text-cyan-300 tracking-[0.35em] font-bold">
                  ORBITAL-STATION STRATUM-09
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-[0.2em] text-[#00FFAA] drop-shadow-[0_0_25px_rgba(0,255,170,0.6)]">
                  CHRONO-STRATUM
                </h1>
                <div className="text-xs sm:text-sm tracking-[0.3em] text-cyan-200 font-semibold">
                  PROTOCOL : NULL
                </div>
                <div className="text-[11px] text-slate-200 tracking-widest pt-1 border-t border-cyan-800/80 mt-2 font-medium">
                  TERMINAL STATUS: ONLINE // OPERATIVE BEREIT
                </div>
              </div>

              {/* Call-to-Action (CTA) Buttons: System Initialisieren & Operative Manual */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInitializeTerminal();
                  }}
                  className="group relative flex-1 w-full py-4 px-6 bg-cyan-950/80 border border-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-150 ease-out shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_35px_rgba(0,255,170,0.7)] cursor-pointer text-sm sm:text-base tracking-[0.2em] font-bold text-center"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span>[ &gt; ]</span>
                    <span>INITIALISIEREN</span>
                    <span className="text-xs font-semibold opacity-90 text-cyan-200 group-hover:text-black">(ENTER)</span>
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const audio = ProceduralAudioEngine.getInstance();
                    audio.playSelectClick();
                    setIsTutorialOpen(true);
                  }}
                  className="flex-1 w-full py-4 px-6 bg-[#00FFAA]/15 border-2 border-[#00FFAA] text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black transition-all duration-150 shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_35px_rgba(0,255,170,0.7)] cursor-pointer text-xs sm:text-sm tracking-[0.15em] font-extrabold text-center flex items-center justify-center gap-2 animate-pulse"
                >
                  <span>[T]</span>
                  <span>OPERATIVE MANUAL</span>
                </button>
              </div>

              <div className="text-[10px] text-cyan-200 tracking-widest bg-[#070a0e]/95 px-4 py-1.5 border border-cyan-800 font-medium">
                DRÜCKE [ENTER] ODER KLICKE BELIEBIG // TASTE [T] FÜR TUTORIAL
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* BOTTOM-DOCK: HARDWARE-STATUS & PROFIL-VALIDIERUNG */}
      {/* ========================================================================= */}
      <footer className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-t border-cyan-900/60 bg-[#070a0e]/90 text-[10px] sm:text-xs text-cyan-300 tracking-wider font-medium">
        <div className="flex items-center gap-2 sm:gap-4 truncate">
          <span className="font-bold text-gray-100">PROFIL: OPERATIVE_LOCAL</span>
          <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-700/60 text-[9px] font-bold">
            VERIFIZIERT
          </span>
          <span className="hidden md:inline text-cyan-200">
            AUDIO: {telemetry.audioUnlocked ? (isAudioMuted ? 'STUMM' : '48kHz AKTIV') : 'STANDBY'}
          </span>
          {audioBlockedWarning && (
            <span className="text-amber-300 font-bold animate-pulse">
              WARNUNG: AUDIO-ENGINE BLOCKIERT // KLICKEN ZUR FREIGABE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-cyan-200">
          <span className="hidden sm:inline">INPUT: TASTATUR / TOUCH DETEKTIERT</span>
          <span className="text-cyan-300 font-bold">AICR v9.4</span>
        </div>
      </footer>

      {/* Operative Manual & Tutorial Walkthrough Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};
