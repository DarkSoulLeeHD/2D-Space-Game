/**
 * CHRONO-STRATUM: PROTOCOL NULL
 * Interactive Tutorial Simulator (InteractiveTutorialSimulator.tsx)
 * 
 * Hands-on interaktive Trainingshalle für Operatives:
 * - Modul 1: Sektor-Radar & Hotkey-Drill (Tastatur-Matrix)
 * - Modul 2: Arsenal CAD-Schmiede & Naniten-Overclocking
 * - Modul 3: Taktischer Grid-Simulator (Bewegung, AP & Deckung)
 * - Modul 4: Zielerfassung & Kinetik-Feuer (Gefecht & Intents)
 * - Modul 5: Chrono-Parade QTE-Trainingshalle (160ms Sweetspot)
 * - Modul 6: Börsen-Terminal & Pity-Mystery-Kisten
 * - Modul 7: Kausalitäts-Bifurkation (Dual-Grid Vergangenheit & Zukunft)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface InteractiveTutorialSimulatorProps {
  initialDrill?: number;
  onExitToManual?: () => void;
  onCloseModal?: () => void;
}

interface IDrillModule {
  id: number;
  code: string;
  title: string;
  subtitle: string;
  tag: string;
}

const DRILL_MODULES: IDrillModule[] = [
  {
    id: 1,
    code: 'DRILL-01',
    title: 'KOMMANDO-DECK & HOTKEY-MATRIX',
    subtitle: 'Interaktive Tastatur-Diagnose & Sektor-Radar',
    tag: 'BEDIENUNG',
  },
  {
    id: 2,
    code: 'DRILL-02',
    title: 'ARSENAL CAD-SCHMIEDE & OVERCLOCKING',
    subtitle: '5 Waffensockel, Blueprint-Vektor & Naniten-Tuning',
    tag: 'SCHMIEDE',
  },
  {
    id: 3,
    code: 'DRILL-03',
    title: 'TAKTIK-GRID: BEWEGUNG & DECKUNG',
    subtitle: '10x10 Raster, 6 AP-System & Sichtlinien (LOS)',
    tag: 'TAKTIK',
  },
  {
    id: 4,
    code: 'DRILL-04',
    title: 'ZIELERFASSUNG & FEUERKAMPF',
    subtitle: 'Feind-Intents lesen, Kinetik-Salven & Trefferwurf',
    tag: 'FEUERKAMPF',
  },
  {
    id: 5,
    code: 'DRILL-05',
    title: 'DIE CHRONO-PARADE (160ms QTE)',
    subtitle: 'Zeit-Stasis, Sweetspot-Training & Bonus-AP',
    tag: 'TIMING-QTE',
  },
  {
    id: 6,
    code: 'DRILL-06',
    title: 'BÖRSE & PITY-MYSTERY-KISTEN',
    subtitle: '4 Händler, Tauschökonomie & garantierte Beute',
    tag: 'ÖKONOMIE',
  },
  {
    id: 7,
    code: 'DRILL-07',
    title: 'KAUSALITÄTS-BIFURKATION (DUAL-GRID)',
    subtitle: 'Vergangenheit & Zukunft synchron beeinflussen',
    tag: 'ENDGAME',
  },
];

export const InteractiveTutorialSimulator: React.FC<InteractiveTutorialSimulatorProps> = ({
  initialDrill = 1,
  onExitToManual,
  onCloseModal,
}) => {
  const [activeDrill, setActiveDrill] = useState<number>(initialDrill);
  const [completedDrills, setCompletedDrills] = useState<Set<number>>(new Set());
  const audio = ProceduralAudioEngine.getInstance();

  const markDrillCompleted = useCallback((drillId: number) => {
    setCompletedDrills((prev) => {
      const next = new Set(prev);
      if (!next.has(drillId)) {
        next.add(drillId);
        audio.playCriticalHit();
      }
      return next;
    });
  }, [audio]);

  // ===========================================================================
  // DRILL 1 STATE: HOTKEY MATRIX & RADAR
  // ===========================================================================
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [selectedSectorPreview, setSelectedSectorPreview] = useState<string>('SEKTOR 04: REAKTOR-BRUCH');

  // ===========================================================================
  // DRILL 2 STATE: WEAPON CAD & OVERCLOCKING
  // ===========================================================================
  const [weaponParts, setWeaponParts] = useState({
    barrel: 'Standard-Lauf',
    magazine: '36-Schuss Trommel',
    optics: 'Holo-Korn',
    stock: 'Kompensiert 0.0G',
    resonator: 'Kinetik-Kern',
  });
  const [overclockLevel, setOverclockLevel] = useState<number>(0);
  const [simulatedNanites, setSimulatedNanites] = useState<number>(180);
  const [testShotActive, setTestShotActive] = useState<boolean>(false);

  // ===========================================================================
  // DRILL 3 STATE: TACTICAL GRID (6x6)
  // ===========================================================================
  const [vancePos, setVancePos] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [gridAp, setGridAp] = useState<number>(6);
  const [vanceHp, setVanceHp] = useState<number>(85);
  const [vanceShield, setVanceShield] = useState<number>(125);
  const [gridEntropy, setGridEntropy] = useState<number>(10);

  // 6x6 Mini Grid tiles:
  // . = Floor, H = Half Cover, W = Full Wall, R = Radiation
  const MINI_GRID = [
    ['.', '.', '.', 'H', '.', '.'],
    ['.', 'V', '.', 'W', '.', '.'],
    ['.', '.', 'H', 'W', '.', '.'],
    ['H', '.', '.', '.', 'R', '.'],
    ['.', 'W', '.', '.', 'R', '.'],
    ['.', '.', 'H', '.', '.', '.'],
  ];

  // ===========================================================================
  // DRILL 4 STATE: TARGETING & COMBAT INTENTS
  // ===========================================================================
  const [dummyEnemyHp, setDummyEnemyHp] = useState<number>(50);
  const [dummyMaxHp] = useState<number>(50);
  const [combatAp, setCombatAp] = useState<number>(6);
  const [ammoCount, setAmmoCount] = useState<number>(30);
  const [combatLogs, setCombatLogs] = useState<string[]>([
    '>> DRILL INITIALISIERT: Feindlicher Chrono-Kriecher telegrafiert Angriff.',
  ]);

  // ===========================================================================
  // DRILL 5 STATE: CHRONO-PARADE QTE
  // ===========================================================================
  const [parryRunning, setParryRunning] = useState<boolean>(false);
  const [parryProgress, setParryProgress] = useState<number>(0);
  const [parryResult, setParryResult] = useState<'IDLE' | 'PERFECT' | 'MISSED'>('IDLE');
  const [parryCount, setParryCount] = useState<number>(0);
  const parryProgressRef = useRef<number>(0);
  const parryRunningRef = useRef<boolean>(false);
  const parryAnimRef = useRef<number>(0); // tracks RAF id for cleanup

  // ===========================================================================
  // DRILL 6 STATE: ECONOMY & PITY CRATES
  // ===========================================================================
  const [simulatedCredits, setSimulatedCredits] = useState<number>(300);
  const [pityCounter, setPityCounter] = useState<number>(0);
  const [lastLoot, setLastLoot] = useState<{ name: string; rarity: string; color: string } | null>(null);

  // ===========================================================================
  // DRILL 7 STATE: DUAL-GRID CAUSALITY
  // ===========================================================================
  const [pastSwitchActive, setPastSwitchActive] = useState<boolean>(false);
  const [futureDroneClaimed, setFutureDroneClaimed] = useState<boolean>(false);

  // Forward declarations for keyboard actions
  const triggerParryHitRef = useRef<() => void>(() => {});
  const startParryTrainingRef = useRef<() => void>(() => {});
  const handleGridMoveRef = useRef<(tx: number, ty: number) => void>(() => {});
  const handleGridDashRef = useRef<() => void>(() => {});
  const handleGridDroneShieldRef = useRef<() => void>(() => {});
  const handleGridStimRef = useRef<() => void>(() => {});
  const handleResetGridRef = useRef<() => void>(() => {});
  const handleAttackDummyRef = useRef<() => void>(() => {});
  const handleReloadCombatRef = useRef<() => void>(() => {});
  const handleEndCombatTurnRef = useRef<() => void>(() => {});
  const openMysteryCrateRef = useRef<() => void>(() => {});
  const togglePastSwitchRef = useRef<() => void>(() => {});
  const claimFutureCrystalRef = useRef<() => void>(() => {});

  // Global keydown handler inside the interactive simulator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow escape to close or exit
      if (e.key === 'Escape') {
        e.preventDefault();
        audio.playUiClick();
        if (onCloseModal) onCloseModal();
        return;
      }

      // Hotkey matrix tracking for Drill 1
      if (activeDrill === 1) {
        const k = e.key.toUpperCase();
        if (['1', '2', '3', '4', '5', '6', '7', 'T', 'B', 'N', 'M'].includes(k)) {
          audio.playHoverPing();
          setTestedKeys((prev) => {
            const next = new Set(prev);
            next.add(k);
            if (next.size >= 4) {
              markDrillCompleted(1);
            }
            return next;
          });
        }
      }

      // Drill 3: Tactical Grid Movement & Abilities
      if (activeDrill === 3) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          handleGridMoveRef.current(vancePos.x, Math.max(0, vancePos.y - 1));
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleGridMoveRef.current(vancePos.x, Math.min(5, vancePos.y + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handleGridMoveRef.current(Math.max(0, vancePos.x - 1), vancePos.y);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleGridMoveRef.current(Math.min(5, vancePos.x + 1), vancePos.y);
        } else if (e.key === '3') {
          e.preventDefault();
          handleGridDashRef.current();
        } else if (e.key === '4') {
          e.preventDefault();
          handleGridDroneShieldRef.current();
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          handleGridStimRef.current();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleResetGridRef.current();
        }
      }

      // Drill 4: Targeting & Combat Actions
      if (activeDrill === 4) {
        if (e.key === '2') {
          e.preventDefault();
          handleAttackDummyRef.current();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleReloadCombatRef.current();
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          handleEndCombatTurnRef.current();
        }
      }

      // QTE Space / Enter trigger for Drill 5
      if (activeDrill === 5) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (parryRunningRef.current) {
            triggerParryHitRef.current();
          } else {
            startParryTrainingRef.current();
          }
        }
      }

      // Drill 6: Mystery Crate
      if (activeDrill === 6) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          openMysteryCrateRef.current();
        }
      }

      // Drill 7: Causality
      if (activeDrill === 7) {
        if (e.key === '1') {
          e.preventDefault();
          togglePastSwitchRef.current();
        } else if (e.key === '2' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          claimFutureCrystalRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(parryAnimRef.current); // stop parry loop on drill switch/unmount
    };
  }, [activeDrill, audio, onCloseModal, markDrillCompleted, vancePos.x, vancePos.y]);

  // ===========================================================================
  // DRILL 2 LOGIC: WEAPON OVERCLOCKING & TEST FIRING
  // ===========================================================================
  const handleOverclock = () => {
    if (simulatedNanites < 40) return;
    audio.playPhaseShift(true);
    setSimulatedNanites((prev) => prev - 40);
    setOverclockLevel((prev) => {
      const next = prev + 1;
      if (next >= 2) markDrillCompleted(2);
      return next;
    });
  };

  const handleTestFire = () => {
    audio.playGunshotBurst();
    setTestShotActive(true);
    setTimeout(() => setTestShotActive(false), 200);
  };

  // ===========================================================================
  // DRILL 3 LOGIC: 6x6 GRID MOVEMENT & AP
  // ===========================================================================
  const handleGridMove = (tx: number, ty: number) => {
    if (gridAp < 1) return;
    const tile = MINI_GRID[ty]?.[tx];
    if (tile === 'W') {
      audio.playShieldDeflect();
      return;
    }

    audio.playApSpend();
    setGridAp((prev) => prev - 1);
    setVancePos({ x: tx, y: ty });

    if (tile === 'R') {
      // Radiation tile hazard
      setVanceHp((prev) => Math.max(1, prev - 10));
      audio.playShieldBreak();
    }

    markDrillCompleted(3);
  };

  const handleGridDash = () => {
    if (gridAp < 1) return;
    audio.playPhaseShift(false);
    setGridAp((prev) => prev - 1);
    setGridEntropy((prev) => Math.min(100, prev + 15));
    // Dash forward 2 tiles if within bounds
    setVancePos((prev) => ({
      x: Math.min(5, prev.x + 2),
      y: prev.y,
    }));
    markDrillCompleted(3);
  };

  const handleGridStim = () => {
    if (gridAp < 1) return;
    audio.playApSpend();
    setGridAp((prev) => prev - 1);
    setVanceHp((prev) => Math.min(100, prev + 35));
    setGridEntropy((prev) => Math.max(0, prev - 10));
    audio.playSelectClick();
  };

  const handleGridDroneShield = () => {
    if (gridAp < 1) return;
    audio.playApSpend();
    setGridAp((prev) => prev - 1);
    setVanceShield((prev) => Math.min(150, prev + 25));
  };

  const handleResetGrid = () => {
    audio.playUiClick();
    setGridAp(6);
    setVanceHp(85);
    setVanceShield(125);
    setGridEntropy(10);
    setVancePos({ x: 1, y: 1 });
  };

  // ===========================================================================
  // DRILL 4 LOGIC: TARGETING & FIRING
  // ===========================================================================
  const handleAttackDummy = () => {
    if (combatAp < 2) return;
    if (ammoCount < 6) return;

    audio.playApSpend();
    audio.playGunshotBurst();
    setCombatAp((prev) => prev - 2);
    setAmmoCount((prev) => Math.max(0, prev - 6));

    const dmg = 24;
    setDummyEnemyHp((prev) => {
      const remaining = Math.max(0, prev - dmg);
      if (remaining === 0) {
        audio.playCriticalHit();
        markDrillCompleted(4);
        setCombatLogs((logs) => [
          '>> [VOLLETREFFER]: Chrono-Kriecher vernichtet! +35 TN Beute gesichert.',
          ...logs,
        ]);
      } else {
        setCombatLogs((logs) => [
          `>> ARC-70 Salve trifft Kriecher für ${dmg} Schaden! (Rest-HP: ${remaining})`,
          ...logs,
        ]);
      }
      return remaining;
    });
  };

  const handleReloadCombat = () => {
    if (combatAp < 1) return;
    audio.playApSpend();
    setCombatAp((prev) => prev - 1);
    setAmmoCount(36);
    setCombatLogs((logs) => ['>> Magazin auf 36 Schuss nachgeladen [-1 AP].', ...logs]);
  };

  const handleEndCombatTurn = () => {
    audio.playSelectClick();
    setCombatAp(6);
    setCombatLogs((logs) => [
      '>> RUNDE BEENDET: 6 AP wiederhergestellt. Kriecher verharrt in Lauerstellung.',
      ...logs,
    ]);
  };

  const handleResetCombat = () => {
    audio.playUiClick();
    setDummyEnemyHp(50);
    setCombatAp(6);
    setAmmoCount(30);
    setCombatLogs(['>> DRILL INITIALISIERT: Feindlicher Chrono-Kriecher telegrafiert Angriff.']);
  };

  // ===========================================================================
  // DRILL 5 LOGIC: CHRONO-PARADE QTE
  // ===========================================================================
  const startParryTraining = () => {
    if (parryRunningRef.current) return;
    cancelAnimationFrame(parryAnimRef.current); // cancel any stale frame
    setParryResult('IDLE');
    setParryRunning(true);
    parryRunningRef.current = true;
    setParryProgress(0);
    parryProgressRef.current = 0;
    audio.playHoverPing();

    const startTime = performance.now();
    const duration = 1200; // 1,2s Timing-Band

    const frame = (now: number) => {
      if (!parryRunningRef.current) return;
      const elapsed = now - startTime;
      const prog = Math.min(100, (elapsed / duration) * 100);
      parryProgressRef.current = prog;
      setParryProgress(prog);

      if (prog >= 100) {
        parryRunningRef.current = false;
        setParryRunning(false);
        setParryResult('MISSED');
        audio.playShieldDeflect();
      } else {
        parryAnimRef.current = requestAnimationFrame(frame);
      }
    };

    parryAnimRef.current = requestAnimationFrame(frame);
  };

  const triggerParryHit = () => {
    if (!parryRunningRef.current) return;
    cancelAnimationFrame(parryAnimRef.current);
    parryRunningRef.current = false;
    setParryRunning(false);
    const p = parryProgressRef.current;

    // Sweetspot: 60% bis 76% (160ms Band)
    if (p >= 60 && p <= 76) {
      setParryResult('PERFECT');
      audio.playParrySuccessBoom();
      setParryCount((prev) => {
        const next = prev + 1;
        if (next >= 1) markDrillCompleted(5);
        return next;
      });
    } else {
      setParryResult('MISSED');
      audio.playShieldDeflect();
    }
  };

  // ===========================================================================
  // DRILL 6 LOGIC: PITY MYSTERY CRATES
  // ===========================================================================
  const openMysteryCrate = () => {
    if (simulatedCredits < 50) return;
    audio.playSelectClick();
    setSimulatedCredits((prev) => prev - 50);

    const nextPity = pityCounter + 1;
    let loot: { name: string; rarity: string; color: string };

    if (nextPity >= 10) {
      // Guaranteed Legendary on 10th draw (Pity-Garantie)
      loot = {
        name: 'Chrono-Verzerrer Prototyp Mk.IV',
        rarity: 'LEGENDÄR (PITY-GARANTIE)',
        color: '#f59e0b',
      };
      setPityCounter(0);
      audio.playCriticalHit();
    } else {
      setPityCounter(nextPity);
      const roll = Math.random();
      if (roll > 0.85) {
        loot = { name: 'Kausal-Resonator (Plasma)', rarity: 'EPISCH', color: '#a855f7' };
        audio.playCriticalHit();
      } else if (roll > 0.5) {
        loot = { name: 'Gezogener Präzisions-Lauf', rarity: 'SELTEN', color: '#38bdf8' };
        audio.playSelectClick();
      } else {
        loot = { name: 'Naniten-Kinetik Magazin (48)', rarity: 'STANDARD', color: '#00FFAA' };
        audio.playHoverPing();
      }
    }

    setLastLoot(loot);
    markDrillCompleted(6);
  };

  // ===========================================================================
  // DRILL 7 LOGIC: DUAL-GRID CAUSALITY
  // ===========================================================================
  const togglePastSwitch = () => {
    audio.playRelayClick();
    setPastSwitchActive((prev) => !prev);
  };

  const claimFutureCrystal = () => {
    if (!pastSwitchActive) {
      audio.playShieldDeflect();
      return;
    }
    audio.playCriticalHit();
    setFutureDroneClaimed(true);
    markDrillCompleted(7);
  };

  const handleResetCausality = () => {
    audio.playUiClick();
    setPastSwitchActive(false);
    setFutureDroneClaimed(false);
  };

  // Sync ref pointers for global keyboard listener
  handleGridMoveRef.current = handleGridMove;
  handleGridDashRef.current = handleGridDash;
  handleGridDroneShieldRef.current = handleGridDroneShield;
  handleGridStimRef.current = handleGridStim;
  handleResetGridRef.current = handleResetGrid;
  handleAttackDummyRef.current = handleAttackDummy;
  handleReloadCombatRef.current = handleReloadCombat;
  handleEndCombatTurnRef.current = handleEndCombatTurn;
  startParryTrainingRef.current = startParryTraining;
  triggerParryHitRef.current = triggerParryHit;
  openMysteryCrateRef.current = openMysteryCrate;
  togglePastSwitchRef.current = togglePastSwitch;
  claimFutureCrystalRef.current = claimFutureCrystal;

  const handleSelectDrill = (drillId: number) => {
    audio.playSelectClick();
    setActiveDrill(drillId);
  };

  const activeModule = DRILL_MODULES.find((m) => m.id === activeDrill) || DRILL_MODULES[0];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-mono select-none text-cyan-300">
      {/* ===================================================================== */}
      {/* DRILL DIRECTORY SIDEBAR */}
      {/* ===================================================================== */}
      <nav className="w-full md:w-72 border-b md:border-b-0 md:border-r border-cyan-900/80 bg-[#05080c] flex flex-col shrink-0 overflow-y-auto">
        <div className="p-3 border-b border-cyan-950 bg-black/50 flex items-center justify-between text-[10px] font-bold tracking-widest text-[#00FFAA]">
          <span>TRAININGS-MODULE</span>
          <span>{completedDrills.size} / 7 GEMEISTERT</span>
        </div>

        <div className="p-2 space-y-1.5 flex-1">
          {DRILL_MODULES.map((mod) => {
            const isActive = mod.id === activeDrill;
            const isDone = completedDrills.has(mod.id);
            return (
              <button
                key={mod.id}
                onClick={() => handleSelectDrill(mod.id)}
                className={`w-full text-left p-2.5 border transition-all text-xs cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'border-[#00FFAA] bg-cyan-950 text-white shadow-[0_0_12px_rgba(0,255,170,0.3)] font-bold'
                    : 'border-cyan-900/60 bg-black/40 text-slate-300 hover:border-cyan-600 hover:text-white font-medium'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-[10px] text-cyan-300 font-bold flex items-center gap-1.5">
                    <span>{mod.code}</span>
                    {isDone && <span className="text-[#00FFAA] font-extrabold">[✓]</span>}
                  </div>
                  <div className="truncate text-[11px] mt-0.5">{mod.title}</div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 border font-bold shrink-0 ${
                    isDone
                      ? 'border-[#00FFAA] text-[#00FFAA] bg-cyan-950'
                      : 'border-cyan-800 text-slate-400 bg-black/60'
                  }`}
                >
                  {mod.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Return to Manual Documentation */}
        {onExitToManual && (
          <div className="p-2.5 border-t border-cyan-950 bg-black/60">
            <button
              onClick={() => {
                audio.playUiClick();
                onExitToManual();
              }}
              className="w-full py-2 px-3 border border-cyan-700 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-500 hover:text-black font-bold text-xs tracking-wider transition-colors cursor-pointer text-center"
            >
              📖 ZUM THEORIE-HANDBUCH
            </button>
          </div>
        )}
      </nav>

      {/* ===================================================================== */}
      {/* INTERACTIVE SIMULATION VIEWPORT */}
      {/* ===================================================================== */}
      <main className="flex-1 p-4 sm:p-6 bg-black/70 overflow-y-auto flex flex-col justify-between space-y-6">
        <div>
          {/* Header of Active Drill */}
          <div className="border-b border-cyan-800/80 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs text-[#00FFAA] font-bold flex items-center gap-2">
                <span>{activeModule.code} // INTERAKTIVES TRAINING</span>
                {completedDrills.has(activeModule.id) && (
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-600 text-[9px] font-bold">
                    MODUL QUALIFIZIERT
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide mt-0.5">
                {activeModule.title}
              </h2>
              <p className="text-xs text-slate-300 font-medium">{activeModule.subtitle}</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  audio.playUiClick();
                  setActiveDrill((prev) => Math.max(1, prev - 1));
                }}
                disabled={activeDrill === 1}
                className="px-2.5 py-1 border border-cyan-800 bg-cyan-950/40 text-cyan-300 disabled:opacity-30 cursor-pointer"
              >
                ◀ VORHERIGES
              </button>
              <span className="text-[11px] font-bold text-cyan-200">{activeDrill} / 7</span>
              <button
                onClick={() => {
                  audio.playUiClick();
                  setActiveDrill((prev) => Math.min(7, prev + 1));
                }}
                disabled={activeDrill === 7}
                className="px-2.5 py-1 border border-cyan-800 bg-cyan-950/40 text-cyan-300 disabled:opacity-30 cursor-pointer"
              >
                NÄCHSTES ▶
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* DRILL 1: HOTKEY & SECTOR RADAR */}
          {/* ================================================================= */}
          {activeDrill === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Testen Sie die Stations-Tastaturmatrix. Drücken Sie physische Tasten auf Ihrer Tastatur oder klicken Sie die Kacheln unten, um das Astraea-Terminal zu kalibrieren.
              </div>

              {/* Interactive Keypad */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#00FFAA] flex justify-between">
                  <span>TASTATUR-MATRIX (GETESTET: {testedKeys.size} / 4 BENÖTIGT)</span>
                  <span className="text-slate-300 font-medium">Taste drücken oder klicken</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { key: '1', label: '[1] EINSATZ STARTEN', desc: 'Sektor-Deployment' },
                    { key: '2', label: '[2] GEMINI INTEL', desc: 'Funkberichte' },
                    { key: '3', label: '[3] ARSENAL', desc: 'Waffenschmiede' },
                    { key: '4', label: '[4] PARAMETER', desc: 'Konfiguration' },
                    { key: '6', label: '[6 / B] BÖRSE', desc: 'Handel & Forschung' },
                    { key: '7', label: '[7 / N] NULL-ZONE', desc: 'Dual-Grid Raid' },
                    { key: 'T', label: '[T] HANDBUCH', desc: 'Tutorial & Training' },
                    { key: 'M', label: '[M] AUDIO MUTE', desc: 'Sound-Stummschaltung' },
                  ].map((item) => {
                    const isTested = testedKeys.has(item.key);
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          audio.playHoverPing();
                          setTestedKeys((prev) => {
                            const next = new Set(prev);
                            next.add(item.key);
                            if (next.size >= 4) markDrillCompleted(1);
                            return next;
                          });
                        }}
                        className={`p-3 border text-left transition-all cursor-pointer ${
                          isTested
                            ? 'border-[#00FFAA] bg-cyan-950/80 shadow-[0_0_12px_rgba(0,255,170,0.3)] text-white'
                            : 'border-cyan-900 bg-black/50 text-slate-300 hover:border-cyan-600'
                        }`}
                      >
                        <div className="flex justify-between font-bold text-[11px]">
                          <span>{item.label}</span>
                          {isTested && <span className="text-[#00FFAA]">OK</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Mini-Radar Preview */}
              <div className="p-3 bg-black/60 border border-cyan-900 space-y-2">
                <div className="text-xs font-bold text-cyan-300">INTERAKTIVER SEKTOR-RADAR:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {['SEKTOR 01: HANGAR', 'SEKTOR 04: REAKTOR', 'SEKTOR 06: KÜHLTURM', 'SEKTOR 09: NULL-ZONE'].map(
                    (sec) => (
                      <button
                        key={sec}
                        onClick={() => {
                          audio.playSelectClick();
                          setSelectedSectorPreview(sec);
                        }}
                        className={`p-2 border text-center font-bold text-[11px] transition-colors cursor-pointer ${
                          selectedSectorPreview === sec
                            ? 'border-[#00FFAA] bg-cyan-950 text-[#00FFAA]'
                            : 'border-cyan-900/60 bg-black/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sec}
                      </button>
                    )
                  )}
                </div>
                <div className="text-[11px] text-slate-300 pt-1 border-t border-cyan-950">
                  Ausgewählter Knoten: <strong className="text-white">{selectedSectorPreview}</strong> // Status: BEREIT FÜR INFILTRATION
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 2: ARSENAL CAD & OVERCLOCKING */}
          {/* ================================================================= */}
          {activeDrill === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Passen Sie die Sockel der Waffe an, führen Sie ein Naniten-Overclocking durch und feuern Sie einen Probeschuss ab, um das Waffen-Labor zu bestehen.
              </div>

              {/* Sockets Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-black/60 border border-cyan-900 space-y-2">
                  <span className="text-[#00FFAA] font-bold block text-[11px]">LAUF-SOCKEL:</span>
                  {['Standard-Lauf', 'Gezogener Präzisionslauf (+15% Rng)', 'Plasma-Drall-Lauf (+20% Crit)'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        audio.playSelectClick();
                        setWeaponParts((prev) => ({ ...prev, barrel: opt }));
                      }}
                      className={`w-full text-left p-1.5 border text-[11px] transition-colors cursor-pointer ${
                        weaponParts.barrel === opt
                          ? 'border-[#00FFAA] bg-cyan-950 text-white font-bold'
                          : 'border-cyan-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-black/60 border border-cyan-900 space-y-2">
                  <span className="text-[#00FFAA] font-bold block text-[11px]">MAGAZIN-SOCKEL:</span>
                  {['36-Schuss Trommel', '48-Schuss Naniten-Magazin', 'Leichtbau-Magazin (-1 AP Reload)'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        audio.playSelectClick();
                        setWeaponParts((prev) => ({ ...prev, magazine: opt }));
                      }}
                      className={`w-full text-left p-1.5 border text-[11px] transition-colors cursor-pointer ${
                        weaponParts.magazine === opt
                          ? 'border-[#00FFAA] bg-cyan-950 text-white font-bold'
                          : 'border-cyan-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-black/60 border border-cyan-900 space-y-2">
                  <span className="text-[#00FFAA] font-bold block text-[11px]">VISIER & RESONATOR:</span>
                  {['Holo-Korn', 'Kausal-Linse (+15% Crit)', 'Plasma-Resonator (+10 MJ Dmg)'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        audio.playSelectClick();
                        setWeaponParts((prev) => ({ ...prev, optics: opt }));
                      }}
                      className={`w-full text-left p-1.5 border text-[11px] transition-colors cursor-pointer ${
                        weaponParts.optics === opt
                          ? 'border-[#00FFAA] bg-cyan-950 text-white font-bold'
                          : 'border-cyan-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Weapon CAD Display & Overclocking Bench */}
              <div className="p-4 bg-black/80 border-2 border-cyan-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-cyan-300">ARC-70 MODULAR-KARABINER [CAD-VORSCHAU]</div>
                  <div className="text-sm font-bold text-white">
                    Schaden: <span className="text-[#00FFAA]">{42 + overclockLevel * 5} DMG</span> // Magazin: 36 // Crit: 18%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Overclock-Rang: <strong className="text-amber-300">+{overclockLevel}</strong> // Verfügbare Naniten: <strong className="text-[#00FFAA]">{simulatedNanites} TN</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  {simulatedNanites < 40 && (
                    <button
                      onClick={() => setSimulatedNanites(180)}
                      className="px-3 py-2 border border-cyan-700 bg-cyan-950 text-cyan-300 text-xs hover:bg-cyan-500 hover:text-black cursor-pointer"
                    >
                      +180 TN AUFFÜLLEN
                    </button>
                  )}
                  <button
                    onClick={handleOverclock}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-950/70 border border-amber-500 text-amber-300 hover:bg-amber-500 hover:text-black font-bold text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  >
                    OVERCLOCK [+5 DMG] (40 TN)
                  </button>

                  <button
                    onClick={handleTestFire}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 border border-[#00FFAA] text-xs font-bold tracking-wider transition-all cursor-pointer ${
                      testShotActive
                        ? 'bg-white text-black shadow-[0_0_20px_#ffffff]'
                        : 'bg-[#00FFAA]/20 text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black'
                    }`}
                  >
                    TEST-SALVE FEUERN!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 3: 6x6 TACTICAL GRID SIMULATOR */}
          {/* ================================================================= */}
          {activeDrill === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Bewegen Sie Vance auf dem Kampfraster (<kbd className="px-1 bg-black border border-cyan-700 text-[#00FFAA]">[1]</kbd>), nutzen Sie halbe Deckungen (<strong className="text-amber-300">◧</strong>) und testen Sie den Chrono-Dash (<kbd className="px-1 bg-black border border-cyan-700 text-[#00FFAA]">[3]</kbd>).
              </div>

              {/* Status Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">AP:</span>
                  <span className="font-bold text-[#00FFAA]">{gridAp} / 6 AP</span>
                </div>
                <div className="p-2 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">HP:</span>
                  <span className="font-bold text-gray-100">{vanceHp} / 100</span>
                </div>
                <div className="p-2 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">SCHILD:</span>
                  <span className="font-bold text-cyan-200">{vanceShield} MJ</span>
                </div>
                <div className="p-2 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">ENTROPIE:</span>
                  <span className="font-bold text-amber-300">{gridEntropy}%</span>
                </div>
              </div>

              {/* 6x6 Playable Grid Area */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <div className="p-3 bg-black/80 border-2 border-cyan-800 shadow-[0_0_25px_rgba(0,255,170,0.15)] inline-block">
                  <div className="grid grid-cols-6 gap-1 w-64 h-64 sm:w-72 sm:h-72">
                    {MINI_GRID.map((row, y) =>
                      row.map((cell, x) => {
                        const isVance = vancePos.x === x && vancePos.y === y;
                        const isWall = cell === 'W';
                        const isCover = cell === 'H';
                        const isRad = cell === 'R';

                        return (
                          <button
                            key={`${x}-${y}`}
                            onClick={() => handleGridMove(x, y)}
                            className={`flex items-center justify-center border font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              isVance
                                ? 'bg-[#00FFAA] text-black border-white shadow-[0_0_15px_#00FFAA] scale-105 z-10'
                                : isWall
                                ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed'
                                : isCover
                                ? 'bg-amber-950/40 text-amber-300 border-amber-600/70 hover:bg-amber-900/60'
                                : isRad
                                ? 'bg-red-950/40 text-red-400 border-red-700/60 hover:bg-red-900/50'
                                : 'bg-black/50 text-cyan-900 border-cyan-900/40 hover:border-cyan-400 hover:bg-cyan-950/40'
                            }`}
                          >
                            {isVance ? 'V' : isWall ? '■' : isCover ? '◧' : isRad ? '☢' : '·'}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Grid Action Panel */}
                <div className="space-y-2 w-full max-w-xs text-xs">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase">AKTIONEN (1 AP):</div>
                  <button
                    onClick={handleGridDash}
                    className="w-full py-2 px-3 bg-cyan-950 border border-cyan-500 text-[#00FFAA] hover:bg-cyan-500 hover:text-black font-bold transition-colors cursor-pointer text-left flex justify-between"
                  >
                    <span>[3] CHRONO-DASH (+15% Entropie)</span>
                    <span>1 AP</span>
                  </button>
                  <button
                    onClick={handleGridDroneShield}
                    className="w-full py-2 px-3 bg-cyan-950 border border-cyan-500 text-cyan-200 hover:bg-cyan-500 hover:text-black font-bold transition-colors cursor-pointer text-left flex justify-between"
                  >
                    <span>[4] SCARAB SCHILD-BOOST (+25 MJ)</span>
                    <span>1 AP</span>
                  </button>
                  <button
                    onClick={handleGridStim}
                    className="w-full py-2 px-3 bg-cyan-950 border border-emerald-500 text-emerald-300 hover:bg-emerald-500 hover:text-black font-bold transition-colors cursor-pointer text-left flex justify-between"
                  >
                    <span>[H] MED-STIM (+35 HP // -10% Entr)</span>
                    <span>1 AP</span>
                  </button>
                  <button
                    onClick={handleResetGrid}
                    className="w-full py-2 px-3 border border-gray-700 text-slate-400 hover:text-white font-bold transition-colors cursor-pointer text-center"
                  >
                    RUNDE ZURÜCKSETZEN (6 AP AUFLADEN)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 4: TARGETING & COMBAT INTENTS */}
          {/* ================================================================= */}
          {activeDrill === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Der Chrono-Kriecher telegrafiert einen Nahkampfangriff. Setzen Sie Ihre AP ein, um das Ziel mit dem ARC-70 Karabiner zu zerstören.
              </div>

              {/* Combat Duel Stage */}
              <div className="p-5 bg-black/80 border-2 border-cyan-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Operative Vance */}
                <div className="p-4 bg-cyan-950/40 border border-cyan-500 text-center space-y-2 w-48">
                  <div className="text-xs text-cyan-400 font-bold">OPERATIVE VANCE</div>
                  <div className="text-2xl font-black text-[#00FFAA]">[V]</div>
                  <div className="text-[11px] text-gray-200">
                    AP: <strong className="text-[#00FFAA]">{combatAp}</strong> // Magazin: <strong className="text-white">{ammoCount}/36</strong>
                  </div>
                </div>

                {/* Intent Line */}
                <div className="text-center space-y-1">
                  <div className="text-red-400 text-xs font-bold animate-pulse">&lt;&lt; INTENT: KLAUENANGRIFF (24 DMG) &lt;&lt;</div>
                  <div className="w-32 h-0.5 bg-red-500 mx-auto" />
                  <div className="text-[10px] text-slate-400">DISTANZ: 3 KACHELN</div>
                </div>

                {/* Chrono-Creeper Target */}
                <div className="p-4 bg-red-950/30 border border-red-500 text-center space-y-2 w-48">
                  <div className="text-xs text-red-400 font-bold">CHRONO-KRIECHER</div>
                  <div className="text-2xl font-black text-[#E07A5F]">
                    {dummyEnemyHp > 0 ? '[☠]' : '[VERNICHTET]'}
                  </div>
                  <div className="text-[11px] text-gray-200">
                    HP: <strong className="text-red-400">{dummyEnemyHp}</strong> / {dummyMaxHp}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAttackDummy}
                  disabled={dummyEnemyHp <= 0 || combatAp < 2 || ammoCount < 6}
                  className="flex-1 py-3 px-4 bg-[#00FFAA] text-black font-extrabold text-xs tracking-widest hover:bg-white transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_#00FFAA]"
                >
                  [2] ANGRIFF FEUERN (-2 AP // -6 SCHUSS)
                </button>
                <button
                  onClick={handleReloadCombat}
                  disabled={combatAp < 1 || ammoCount === 36}
                  className="py-3 px-4 border border-cyan-600 bg-cyan-950 text-cyan-200 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
                >
                  [R] NACHLADEN (-1 AP)
                </button>
                <button
                  onClick={handleEndCombatTurn}
                  className="py-3 px-4 border border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
                >
                  [E] ZUG BEENDEN (6 AP)
                </button>
                <button
                  onClick={handleResetCombat}
                  className="py-3 px-4 border border-gray-700 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  FEIND ZURÜCKSETZEN
                </button>
              </div>

              {/* Combat Log */}
              <div className="p-3 bg-black/60 border border-cyan-950 space-y-1 text-[11px] text-cyan-300 max-h-24 overflow-y-auto">
                {combatLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 5: CHRONO-PARADE QTE TRAINING */}
          {/* ================================================================= */}
          {activeDrill === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Starten Sie den Feindangriff. Sobald der Laufbalken den türkisen Sweet-Spot (60% bis 76% // 160ms) erreicht, drücken Sie <kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[LEERTASTE]</kbd>, <kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[ENTER]</kbd> oder klicken Sie in den Balken!
              </div>

              {/* Parade Stage Display */}
              <div className="p-6 bg-black/90 border-2 border-cyan-800 shadow-[0_0_30px_rgba(0,255,170,0.2)] text-center space-y-5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-cyan-400">CHRONO-STASIS SIMULATOR</span>
                  <span className="text-amber-300">ERFOLGREICHE PARADEN: {parryCount}</span>
                </div>

                {/* Status Readout */}
                {parryResult === 'IDLE' && (
                  <div className="text-sm font-bold text-gray-200">
                    {parryRunning
                      ? '>> ANGRIFF IM ANFLUG! JETZT IM SWEET-SPOT PARIEREN! <<'
                      : 'Bereit. Klicke auf "ANGRIFF STARTEN" um die Parade zu üben.'}
                  </div>
                )}
                {parryResult === 'PERFECT' && (
                  <div className="text-lg font-black text-[#00FFAA] drop-shadow-[0_0_15px_#00FFAA] animate-bounce">
                    &gt;&gt; PERFEKTE CHRONO-PARADE! 0 DMG &amp; +1 BONUS-AP! &lt;&lt;
                  </div>
                )}
                {parryResult === 'MISSED' && (
                  <div className="text-base font-bold text-red-400">
                    PARADE VERFEHLT // SCHLAG SCHLÄGT DURCH (24 DMG)
                  </div>
                )}

                {/* Timing Bar */}
                <div
                  onClick={triggerParryHit}
                  className="w-full h-10 bg-slate-950 border-2 border-cyan-800 relative overflow-hidden cursor-pointer"
                >
                  {/* Sweetspot zone: 60% bis 76% (160ms) */}
                  <div className="absolute left-[60%] w-[16%] top-0 bottom-0 bg-cyan-400/40 border-x-2 border-cyan-300 flex items-center justify-center">
                    <span className="text-[10px] text-cyan-200 font-extrabold tracking-wider">
                      PARRY (160ms)
                    </span>
                  </div>

                  {/* Running Cursor */}
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-white shadow-[0_0_15px_#ffffff] transition-none"
                    style={{ left: `${parryProgress}%` }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={startParryTraining}
                    disabled={parryRunning}
                    className="py-3 px-6 bg-[#00FFAA] text-black font-extrabold text-xs tracking-widest hover:bg-white transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_#00FFAA]"
                  >
                    {parryRunning ? 'PARADE LÄUFT...' : 'ANGRIFF STARTEN (QTE ÜBEN)'}
                  </button>
                  {parryRunning && (
                    <button
                      onClick={triggerParryHit}
                      className="py-3 px-6 bg-cyan-500 text-black font-extrabold text-xs tracking-widest hover:bg-white transition-all cursor-pointer"
                    >
                      JETZT PARIEREN! [LEERTASTE]
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 6: ECONOMY & PITY MYSTERY CRATES */}
          {/* ================================================================= */}
          {activeDrill === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> Testen Sie die Stations-Börse und das transparente Pity-System (garantierte Epische/Legendäre Beute spätestens nach der 10. Ziehung).
              </div>

              {/* Wallet & Pity Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">CREDITS:</span>
                  <span className="font-bold text-[#00FFAA]">{simulatedCredits} AC</span>
                </div>
                <div className="p-3 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">PITY-ZÄHLER:</span>
                  <span className="font-bold text-amber-300">{pityCounter} / 10 ZIEHUNGEN</span>
                </div>
                <div className="p-3 bg-black/60 border border-cyan-900 flex justify-between">
                  <span className="text-slate-400">GARANTIE IN:</span>
                  <span className="font-bold text-white">{10 - pityCounter} ZIEHUNGEN</span>
                </div>
              </div>

              {/* Crate Opening Station */}
              <div className="p-6 bg-black/80 border-2 border-cyan-800 text-center space-y-4">
                <div className="text-sm font-bold text-cyan-300">
                  ASTRAEA MYSTERY-KISTE (50 CREDITS PRO ZIEHUNG)
                </div>

                {lastLoot && (
                  <div
                    className="p-4 border-2 max-w-sm mx-auto space-y-1 animate-in zoom-in-95 duration-200"
                    style={{ borderColor: lastLoot.color, backgroundColor: `${lastLoot.color}15` }}
                  >
                    <div className="text-[10px] font-bold tracking-widest" style={{ color: lastLoot.color }}>
                      GEZOGEN: [{lastLoot.rarity}]
                    </div>
                    <div className="text-base font-extrabold text-white">{lastLoot.name}</div>
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={openMysteryCrate}
                    disabled={simulatedCredits < 50}
                    className="py-3 px-6 bg-[#00FFAA] text-black font-bold text-xs tracking-widest hover:bg-white transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_#00FFAA]"
                  >
                    KISTE ÖFFNEN (-50 AC)
                  </button>
                  <button
                    onClick={() => setSimulatedCredits(500)}
                    className="py-3 px-4 border border-cyan-800 text-cyan-300 text-xs hover:bg-cyan-950 cursor-pointer"
                  >
                    CREDITS AUFLADEN (+500 AC)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* DRILL 7: DUAL-GRID CAUSALITY */}
          {/* ================================================================= */}
          {activeDrill === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/80 text-xs text-slate-200 leading-relaxed">
                <strong>ÜBUNGS-AUFTRAG:</strong> In der Null-Zone beeinflussen Aktionen in der Vergangenheit direkt die Zukunft. Aktivieren Sie den Relais-Schalter in der Vergangenheit, um die Barriere für die Drohne in der Zukunft zu deaktivieren.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Past Grid (Operative Vance) */}
                <div className="p-4 bg-black/80 border-2 border-[#00FFAA] text-center space-y-3">
                  <div className="text-xs font-bold text-[#00FFAA]">ZEITEBENE A // VERGANGENHEIT (VANCE)</div>
                  <div className="p-6 bg-cyan-950/30 border border-cyan-800 space-y-3">
                    <div className="text-sm font-bold text-gray-200">KRAFTFELD-RELAIS 01</div>
                    <button
                      onClick={togglePastSwitch}
                      className={`px-6 py-3 border font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                        pastSwitchActive
                          ? 'border-[#00FFAA] bg-[#00FFAA] text-black shadow-[0_0_20px_#00FFAA]'
                          : 'border-cyan-700 bg-black text-cyan-300 hover:border-cyan-400'
                      }`}
                    >
                      {pastSwitchActive ? '[RELAIS AKTIVIERT]' : '[RELAIS EINSCHALTEN]'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Schalter-Status: {pastSwitchActive ? 'LEITUNG OFFEN' : 'UNTERBROCHEN'}
                  </div>
                </div>

                {/* Future Grid (Scarab Drone) */}
                <div className="p-4 bg-black/80 border-2 border-purple-500 text-center space-y-3">
                  <div className="text-xs font-bold text-purple-400">ZEITEBENE B // ZUKUNFT (SCARAB-IV)</div>
                  <div className="p-6 bg-purple-950/20 border border-purple-800 space-y-3">
                    <div className="text-sm font-bold text-gray-200">CHRONO-KRISTALL KAMMER</div>
                    <button
                      onClick={claimFutureCrystal}
                      disabled={futureDroneClaimed || !pastSwitchActive}
                      className={`px-6 py-3 border font-extrabold text-xs tracking-wider transition-all cursor-pointer ${
                        futureDroneClaimed
                          ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                          : pastSwitchActive
                          ? 'border-purple-400 bg-purple-600 text-white shadow-[0_0_20px_#a855f7]'
                          : 'border-red-900 bg-red-950/40 text-red-500 cursor-not-allowed'
                      }`}
                    >
                      {futureDroneClaimed
                        ? '[KRISTALL GEBORGEN! ✓]'
                        : pastSwitchActive
                        ? '[KRISTALL BERGEN (TOR OFFEN)]'
                        : '[TOR GESPERRT // ERFORDERT VERGANGENHEIT]'}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Kausalitäts-Brücke: {pastSwitchActive ? 'SYNCHRONISIERT' : 'BLOCKIERT'}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={handleResetCausality}
                  className="py-2.5 px-5 border border-cyan-800 bg-cyan-950/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500 hover:text-black transition-colors cursor-pointer"
                >
                  KAUSALITÄTS-EXPERIMENT ZURÜCKSETZEN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* SIMULATOR FOOTER & PROGRESS */}
        {/* ===================================================================== */}
        <div className="pt-4 border-t border-cyan-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-cyan-300 font-medium">
            Trainings-Fortschritt: <strong className="text-[#00FFAA]">{completedDrills.size} von 7 Modulen</strong> gemeistert // Tastatur: <kbd className="px-1 bg-black border border-red-700 text-red-300 font-bold">[ESC]</kbd> Schließen
          </div>

          <div className="flex items-center gap-2">
            {onExitToManual && (
              <button
                onClick={() => {
                  audio.playUiClick();
                  onExitToManual();
                }}
                className="px-4 py-2 border border-cyan-700 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-500 hover:text-black text-xs font-bold transition-all cursor-pointer"
              >
                📖 THEORIE-HANDBUCH
              </button>
            )}

            {completedDrills.size === 7 ? (
              <button
                onClick={() => {
                  audio.playCriticalHit();
                  if (onCloseModal) onCloseModal();
                }}
                className="px-5 py-2 border border-[#00FFAA] bg-[#00FFAA] text-black font-extrabold text-xs tracking-wider transition-all shadow-[0_0_20px_#00FFAA] cursor-pointer"
              >
                VANGUARD-QUALIFIKATION BESTANDEN! [SCHLIESSEN]
              </button>
            ) : (
              <button
                onClick={() => {
                  audio.playSelectClick();
                  setActiveDrill((prev) => Math.min(7, prev + 1));
                }}
                className="px-5 py-2 border border-[#00FFAA] bg-[#00FFAA]/15 text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black text-xs font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,170,0.3)] cursor-pointer"
              >
                NÄCHSTE ÜBUNG &gt;
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
