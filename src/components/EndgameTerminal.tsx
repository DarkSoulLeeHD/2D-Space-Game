import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  IDualTile,
  ILeaderboardEntry,
  IRaidState,
  ISeasonPassState,
  WorldTier,
} from '../types/endgame';
import {
  DEFAULT_WEEKLY_AFFIXES,
  EndgameService,
  WORLD_TIER_MULTIPLIERS,
} from '../services/endgameService';
import { SeededRng } from '../services/seededRng';
import { DualGridCanvas } from './DualGridCanvas';
import { RaidAudioEngine } from '../services/raidAudio';

interface EndgameTerminalProps {
  onBackToDeck: () => void;
  playerLevel?: number;
}

export const EndgameTerminal: React.FC<EndgameTerminalProps> = ({
  onBackToDeck,
  playerLevel = 20,
}) => {
  const weeklySeed = useMemo(() => SeededRng.getCurrentWeeklySeed(), []);

  // Raid & Modifiers State
  const [selectedMode, setSelectedMode] = useState<'CHRONO_SPINDLE' | 'WEEKLY_INCURSION'>('CHRONO_SPINDLE');
  const [worldTier, setWorldTier] = useState<WorldTier>(4);

  // Dual-Grid Simulation State
  const [raidState, setRaidState] = useState<IRaidState>(() => {
    const { gridA, gridB, vanceStart, droneStart } = EndgameService.generateDualGrids(weeklySeed);
    return {
      activeRaidId: 'CHRONO_SPINDLE',
      currentPhase: 1,
      worldTier: 4,
      roundsTaken: 8,
      enrageTimerRounds: 25,
      damageTaken: 45,
      criticalHits: 6,
      score: 185400,
      gridA,
      gridB,
      vancePos: vanceStart,
      dronePos: droneStart,
      activeEpoch: 'PAST',
      isBifurcated: true,
      causalityTriggerCount: 0,
      coreExtracted: false,
    };
  });

  // Leaderboard & Season Pass State
  const [leaderboard, setLeaderboard] = useState<ILeaderboardEntry[]>(() =>
    EndgameService.loadLeaderboard()
  );
  const [seasonPass, setSeasonPass] = useState<ISeasonPassState>(() =>
    EndgameService.loadSeasonPass()
  );

  // Status ticker notification
  const [statusText, setStatusText] = useState<string>(
    'STATUS: BIFURKATION SYNCHRON // Vance steuert Vergangenheit, Scarab-IV die Zukunft.'
  );

  // Calculate live tactical score
  const liveScore = useMemo(() => {
    return EndgameService.calculateRaidScore(
      raidState.roundsTaken,
      raidState.damageTaken,
      raidState.criticalHits,
      worldTier
    );
  }, [raidState.roundsTaken, raidState.damageTaken, raidState.criticalHits, worldTier]);

  // Restart / Reset Grids
  const handleResetSimulation = useCallback(() => {
    const { gridA, gridB, vanceStart, droneStart } = EndgameService.generateDualGrids(weeklySeed);
    setRaidState((prev) => ({
      ...prev,
      roundsTaken: 0,
      damageTaken: 0,
      criticalHits: 0,
      gridA,
      gridB,
      vancePos: vanceStart,
      dronePos: droneStart,
      coreExtracted: false,
      causalityTriggerCount: 0,
      activeEpoch: 'PAST',
    }));
    RaidAudioEngine.getInstance().playGridShiftWhoosh();
    setStatusText('BIFURKATIONS-GRID NEU INITIALISIERT // KAUSALITÄT BEREIT');
  }, [weeklySeed]);

  // Switch Epoch
  const handleToggleEpoch = () => {
    setRaidState((prev) => {
      const nextEpoch = prev.activeEpoch === 'PAST' ? 'FUTURE' : 'PAST';
      RaidAudioEngine.getInstance().playGridShiftWhoosh();
      setStatusText(
        nextEpoch === 'PAST'
          ? 'ZEITACHSE GEWECHSELT: VERGANGENHEIT (VANCE STEUERBAR)'
          : 'ZEITACHSE GEWECHSELT: ZUKUNFT (SCARAB-IV STEUERBAR)'
      );
      return { ...prev, activeEpoch: nextEpoch };
    });
  };

  // Movement Logic
  const handleMove = (dx: number, dy: number) => {
    if (raidState.coreExtracted) return;

    setRaidState((prev) => {
      if (prev.activeEpoch === 'PAST') {
        const nx = Math.max(0, Math.min(7, prev.vancePos.x + dx));
        const ny = Math.max(0, Math.min(7, prev.vancePos.y + dy));
        const targetTile = prev.gridA[ny]?.[nx];

        if (targetTile && !targetTile.blocked) {
          const newRounds = prev.roundsTaken + 1;
          // Enrage Warning at 5 rounds left
          if (prev.enrageTimerRounds - newRounds <= 5) {
            RaidAudioEngine.getInstance().playEnrageKlaxon();
          }
          return {
            ...prev,
            vancePos: { x: nx, y: ny },
            roundsTaken: newRounds,
          };
        }
      } else {
        const nx = Math.max(0, Math.min(7, prev.dronePos.x + dx));
        const ny = Math.max(0, Math.min(7, prev.dronePos.y + dy));
        const targetTile = prev.gridB[ny]?.[nx];

        if (targetTile && !targetTile.blocked) {
          const newRounds = prev.roundsTaken + 1;
          // Check if reached core
          if (targetTile.objectType === 'CHRONO_CORE') {
            RaidAudioEngine.getInstance().playCoreExtractedChime();
            const finalScore = EndgameService.calculateRaidScore(
              newRounds,
              prev.damageTaken,
              prev.criticalHits + 4,
              worldTier
            );
            const updatedRoster = EndgameService.recordPlayerScore(
              finalScore,
              newRounds,
              prev.damageTaken,
              worldTier,
              weeklySeed
            );
            setLeaderboard(updatedRoster);

            // Add season XP
            const updatedPass = EndgameService.addSeasonXp(1250);
            setSeasonPass(updatedPass);

            setStatusText(
              `★ APEX-RAID VOLLENDET! CHRONO-KERN GESICHERT! SCORE: ${finalScore.toLocaleString()} PUNKTE ★`
            );
            return {
              ...prev,
              dronePos: { x: nx, y: ny },
              roundsTaken: newRounds,
              coreExtracted: true,
              score: finalScore,
            };
          }

          return {
            ...prev,
            dronePos: { x: nx, y: ny },
            roundsTaken: newRounds,
          };
        }
      }
      return prev;
    });
  };

  // Interact with nearby terminal in Vergangenheit
  const handleTriggerTerminal = () => {
    const { x, y } = raidState.vancePos;
    // Check adjacent tiles for active terminal
    const offsets = [
      { dx: 0, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const off of offsets) {
      const tx = x + off.dx;
      const ty = y + off.dy;
      const tile = raidState.gridA[ty]?.[tx];
      if (tile?.objectType === 'TERMINAL' && tile.terminalActive) {
        const result = EndgameService.triggerPastTerminal(
          raidState.gridA,
          raidState.gridB,
          tx,
          ty
        );
        if (result.openedDoorPos) {
          RaidAudioEngine.getInstance().playCausalityTrigger();
          setRaidState((prev) => ({
            ...prev,
            gridA: result.updatedGridA,
            gridB: result.updatedGridB,
            causalityTriggerCount: prev.causalityTriggerCount + 1,
            criticalHits: prev.criticalHits + 2,
          }));
          setStatusText(
            `KAUSALITÄTS-PARADOXON AUSGELÖST: Terminal (${tx}, ${ty}) zerstört -> Schott (${result.openedDoorPos.x}, ${result.openedDoorPos.y}) in Zukunft geöffnet!`
          );
          return;
        }
      }
    }

    setStatusText('KEIN AKTIVES TERMINAL IN REICHWEITE VON VANCE (VERGANGENHEIT).');
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToDeck();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleToggleEpoch();
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleMove(0, -1);
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleMove(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleMove(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleMove(1, 0);
      } else if (e.key.toLowerCase() === 'e' || e.key === 'Enter') {
        e.preventDefault();
        handleTriggerTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raidState, onBackToDeck]);

  return (
    <div className="relative w-screen h-screen bg-[#070a0e] text-[#d8e2dc] font-mono flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER: KAUSALITÄTS- & RAID-STATUS */}
      <header className="h-16 px-6 bg-[#090e15] border-b border-[#00f0ff]/30 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-400 rounded-sm animate-pulse" />
            <h1 className="text-base font-bold tracking-wider text-amber-400">
              NULL-ZONE // APEX-RAID TERMINAL SYS-ENDG-14
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 font-medium border-l border-white/10 pl-4">
            <span>SEED:</span>
            <span className="text-cyan-300 font-bold bg-black/50 px-2 py-0.5 border border-cyan-500/30">
              {weeklySeed}
            </span>
            <span className="text-cyan-400">|</span>
            <span>WORLD-TIER:</span>
            <span className="text-amber-400 font-bold">
              [ RESONANZ {['I', 'II', 'III', 'IV', 'V'][worldTier - 1]} ]
            </span>
            <span className="text-[10px] text-slate-300 font-medium">(x{WORLD_TIER_MULTIPLIERS[worldTier]} Score)</span>
          </div>
        </div>

        {/* Live Raid Telemetry */}
        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-white/10 rounded">
            <span className="text-gray-400">RUNDEN:</span>
            <span className="font-bold text-white text-sm">{raidState.roundsTaken}</span>
            <span className="text-[10px] text-red-400">
              (ENRAGE: {raidState.enrageTimerRounds - raidState.roundsTaken})
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-white/10 rounded">
            <span className="text-gray-400">DMG GENOMMEN:</span>
            <span className="font-bold text-red-400 text-sm">{raidState.damageTaken} HP</span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-amber-500/30 rounded">
            <span className="text-gray-400">APEX-SCORE:</span>
            <span className="font-bold text-amber-300 text-sm">
              {liveScore.toLocaleString()} PKT
            </span>
          </div>

          <button
            onClick={handleResetSimulation}
            className="px-2.5 py-1 bg-white/5 border border-white/20 hover:bg-white/10 text-[10px] text-gray-300 rounded"
          >
            RESET GRID
          </button>
        </div>
      </header>

      {/* 2. MASTER 3-COLUMN WIREFRAME LAYOUT */}
      <main className="flex-1 flex overflow-hidden">
        {/* SPALTE 1: RAID-AUSWAHL & MODIFIKATOREN (25% BREITE) */}
        <section className="w-80 lg:w-96 border-r border-white/10 flex flex-col bg-[#080d14] shrink-0">
          <div className="p-3 bg-[#0a121c] border-b border-white/10 text-xs font-bold text-amber-400 tracking-wider">
            [1] RAID-MODUS &amp; RESONANZ-MATRIX
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Mode 1: Chrono-Spindel */}
            <div
              onClick={() => setSelectedMode('CHRONO_SPINDLE')}
              className={`p-4 border transition-all cursor-pointer ${
                selectedMode === 'CHRONO_SPINDLE'
                  ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                  : 'border-white/10 bg-black/30 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>⌛</span>
                  <span>1. DIE CHRONO-SPINDEL</span>
                </span>
                <span className="px-1.5 py-0.5 bg-amber-400 text-black text-[9px] font-bold">
                  APEX-RAID
                </span>
              </div>
              <div className="text-[11px] text-amber-300 font-mono mb-2">
                Dual-Grid Kausalitäts-Bruch // Phase {raidState.currentPhase}
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                Operiere synchron in Vergangenheit und Zukunft. Handlungen auf Deck A eröffnen 30
                Jahre später Pfade für die Drohne.
              </p>
              <div className="text-[10px] text-cyan-400 font-mono">
                GEAR-SCORE MIN: 450 // LEVEL 20 ERFORDERLICH
              </div>
            </div>

            {/* Mode 2: Wochen-Inkursion */}
            <div
              onClick={() => setSelectedMode('WEEKLY_INCURSION')}
              className={`p-4 border transition-all cursor-pointer ${
                selectedMode === 'WEEKLY_INCURSION'
                  ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
                  : 'border-white/10 bg-black/30 hover:border-white/30'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white flex items-center gap-2">
                  <span>🌐</span>
                  <span>2. WOCHEN-INKURSION</span>
                </span>
                <span className="px-1.5 py-0.5 bg-cyan-400 text-black text-[9px] font-bold">
                  SEED-SYNC
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 font-mono mb-2">
                Mulberry32 PRNG // {weeklySeed}
              </div>

              {/* 3 Weekly Affixes */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  3 AKTIVE WÖCHENTLICHE AFFIXE:
                </div>
                {DEFAULT_WEEKLY_AFFIXES.map((affix) => (
                  <div
                    key={affix.id}
                    className={`p-1.5 border text-[10px] rounded ${
                      affix.isHarmful
                        ? 'border-red-500/30 bg-red-950/20 text-red-300'
                        : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                    }`}
                  >
                    <div className="font-bold">{affix.name}</div>
                    <div className="text-[9px] text-gray-400 mt-0.5">{affix.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mode 3: Resonanz-Stufe Selector */}
            <div className="p-4 border border-white/10 bg-black/40">
              <div className="text-xs font-bold text-amber-400 mb-2 flex items-center justify-between">
                <span>3. RESONANZ-STUFE (WORLD-TIER)</span>
                <span className="text-[11px] text-white">x{WORLD_TIER_MULTIPLIERS[worldTier]}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setWorldTier(tier)}
                    className={`py-2 text-center text-xs font-mono font-bold border transition-colors ${
                      worldTier === tier
                        ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 text-gray-400 hover:border-white/30'
                    }`}
                  >
                    {['I', 'II', 'III', 'IV', 'V'][tier - 1]}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                Höhere Stufen erhöhen gegnerische Rüstung und Tempo, multiplizieren jedoch den
                finalen Bestenlisten-Score drastisch.
              </div>
            </div>
          </div>
        </section>

        {/* SPALTE 2: DUAL-GRID VIEWPORT & LIVE-SIMULATION (50% BREITE) */}
        <section className="flex-1 flex flex-col bg-[#060a0e] border-r border-white/10">
          {/* Sub-Header: Active Epoch Controls */}
          <div className="p-3 bg-[#0a1017] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-amber-400 mr-2">
                [2] BIFURKATIONS-VIEWPORT:
              </span>
              <button
                onClick={handleToggleEpoch}
                className={`px-3 py-1 text-xs font-mono font-bold tracking-wider border transition-all flex items-center gap-2 ${
                  raidState.activeEpoch === 'PAST'
                    ? 'border-[#00FFAA] bg-[#00FFAA]/20 text-[#00FFAA] shadow-[0_0_10px_rgba(0,255,170,0.3)]'
                    : 'border-[#E07A5F] bg-[#E07A5F]/20 text-[#E07A5F] shadow-[0_0_10px_rgba(224,122,95,0.3)]'
                }`}
              >
                <span>[TAB] ZEITACHSE: {raidState.activeEpoch === 'PAST' ? 'VERGANGENHEIT [VANCE]' : 'ZUKUNFT [SCARAB-IV]'}</span>
              </button>
            </div>

            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>KAUSALITÄTS-LINKS:</span>
              <span className="text-amber-400 font-bold">{raidState.causalityTriggerCount} AKTIVIERT</span>
            </div>
          </div>

          {/* Interactive Dual-Grid Canvas */}
          <div className="flex-1 relative">
            <DualGridCanvas
              gridA={raidState.gridA}
              gridB={raidState.gridB}
              vancePos={raidState.vancePos}
              dronePos={raidState.dronePos}
              activeEpoch={raidState.activeEpoch}
              onTileClick={(gridType, x, y) => {
                if (gridType === 'PAST') {
                  const dx = x - raidState.vancePos.x;
                  const dy = y - raidState.vancePos.y;
                  if (Math.abs(dx) + Math.abs(dy) === 1) handleMove(dx, dy);
                } else {
                  const dx = x - raidState.dronePos.x;
                  const dy = y - raidState.dronePos.y;
                  if (Math.abs(dx) + Math.abs(dy) === 1) handleMove(dx, dy);
                }
              }}
            />

            {/* Victory overlay banner if core extracted */}
            {raidState.coreExtracted && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                <div className="w-16 h-16 rounded-full border-2 border-amber-400 flex items-center justify-center text-3xl mb-4 bg-amber-950/60 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                  💎
                </div>
                <h2 className="text-xl font-bold text-amber-300 tracking-widest mb-1">
                  &gt;&gt; APEX-CHRONO-KERN GESICHERT &lt;&lt;
                </h2>
                <p className="text-xs text-gray-300 max-w-md mb-4 leading-relaxed font-mono">
                  Die Kausalitäts-Schleife der Spindel wurde stabilisiert. Ihr Score von{' '}
                  <strong className="text-white">{raidState.score.toLocaleString()}</strong> wurde
                  in die globale Saison-Bestenliste eingetragen.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={handleResetSimulation}
                    className="px-5 py-2.5 bg-amber-400 text-black font-bold text-xs tracking-wider hover:bg-white transition-colors"
                  >
                    NEUE SCHLEIFE STARTEN
                  </button>
                  <button
                    onClick={onBackToDeck}
                    className="px-5 py-2.5 border border-white/30 text-white font-bold text-xs hover:bg-white/10 transition-colors"
                  >
                    ZUM HAUPTDECK
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tactical Action Dock */}
          <div className="p-3 bg-[#0a1017] border-t border-white/10 flex items-center justify-between text-xs">
            {/* Movement Cross */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 mr-2 text-[11px]">MANÖVER:</span>
              <button
                onClick={() => handleMove(-1, 0)}
                className="w-7 h-7 bg-black/60 border border-white/20 hover:border-white/50 text-white font-bold text-xs"
              >
                ◄
              </button>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMove(0, -1)}
                  className="w-7 h-7 bg-black/60 border border-white/20 hover:border-white/50 text-white font-bold text-xs"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMove(0, 1)}
                  className="w-7 h-7 bg-black/60 border border-white/20 hover:border-white/50 text-white font-bold text-xs"
                >
                  ▼
                </button>
              </div>
              <button
                onClick={() => handleMove(1, 0)}
                className="w-7 h-7 bg-black/60 border border-white/20 hover:border-white/50 text-white font-bold text-xs"
              >
                ►
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleTriggerTerminal}
                className="px-4 py-2 border border-cyan-400 bg-cyan-950/70 hover:bg-cyan-800 text-cyan-200 font-bold text-xs tracking-wider transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              >
                [E] TERMINAL HACKEN / ZERSTÖREN
              </button>

              <button
                onClick={handleToggleEpoch}
                className="px-4 py-2 border border-amber-400 bg-amber-950/70 hover:bg-amber-800 text-amber-200 font-bold text-xs tracking-wider transition-all"
              >
                [TAB] ZEITEBENE WECHSELN
              </button>
            </div>
          </div>
        </section>

        {/* SPALTE 3: LEADERBOARD & CHRONO-EPOCHEN PASS (25% BREITE) */}
        <section className="w-80 lg:w-96 flex flex-col bg-[#070a0f] shrink-0">
          <div className="p-3 bg-[#0a121c] border-b border-white/10 flex items-center justify-between text-xs font-bold text-amber-400">
            <span>[3] SAISON-BESTENLISTE</span>
            <span className="text-[10px] text-gray-400">RESET IN: 4T 12H</span>
          </div>

          {/* Leaderboard Table */}
          <div className="h-1/2 border-b border-white/10 p-3 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-gray-400 uppercase">
                  <th className="pb-1.5">RANG</th>
                  <th className="pb-1.5">CALLSIGN</th>
                  <th className="pb-1.5 text-right">SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className={`${
                      entry.isPlayer
                        ? 'bg-amber-500/15 text-amber-300 font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <td className="py-1.5">
                      {entry.rank <= 3 ? (
                        <span className="text-amber-400 font-bold">#{entry.rank < 10 ? `0${entry.rank}` : entry.rank}</span>
                      ) : (
                        `#${entry.rank < 10 ? `0${entry.rank}` : entry.rank}`
                      )}
                    </td>
                    <td className="py-1.5 truncate max-w-[100px]">
                      {entry.callsign} {entry.isPlayer ? '(SIE)' : ''}
                    </td>
                    <td className="py-1.5 text-right font-bold font-mono">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Non-FOMO Season Pass */}
          <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-[#080d14]">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                <span>{seasonPass.seasonName}</span>
                <span className="text-[10px] text-emerald-400 font-bold">KEIN FOMO</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3">
                Verfällt niemals. Alte Epochen bleiben jederzeit aktivierbar.
              </p>

              {/* Level Progress */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-bold">STUFE {seasonPass.currentLevel} / 50</span>
                  <span className="text-gray-400 text-[10px]">
                    {seasonPass.currentXp} / {seasonPass.maxXpPerLevel} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-900 rounded overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (seasonPass.currentXp / seasonPass.maxXpPerLevel) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rewards List */}
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                NÄCHSTE KOSMETISCHE BELOHNUNGEN:
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {seasonPass.rewards
                  .filter((r) => r.level >= seasonPass.currentLevel - 1 && r.level <= seasonPass.currentLevel + 5)
                  .map((r) => (
                    <div
                      key={r.level}
                      className={`p-2 border text-[11px] rounded flex items-center justify-between ${
                        r.unlocked
                          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                          : 'border-white/10 bg-black/40 text-gray-400'
                      }`}
                    >
                      <div>
                        <div className="font-bold">
                          [LVL {r.level}] {r.title}
                        </div>
                        <div className="text-[9px] text-slate-300 font-medium">{r.rewardValue}</div>
                      </div>
                      <span className="text-[9px] font-bold">
                        {r.unlocked ? '✓ AKTIV' : 'GESPERRT'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Season XP Boost Demo */}
            <button
              onClick={() => {
                const nextPass = EndgameService.addSeasonXp(1000);
                setSeasonPass(nextPass);
                setStatusText('+1.000 SAISON-XP ERHALTEN (FORTSCHRITT IM EPOCHEN-PASS)');
              }}
              className="mt-4 py-2 border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono tracking-wider transition-colors"
            >
              +1.000 SAISON-XP (DEMO)
            </button>
          </div>
        </section>
      </main>

      {/* 3. BOTTOM FOOTER: LAUNCH-GATE & STATUS BAR */}
      <footer className="h-12 px-6 bg-[#060a0f] border-t border-[#00f0ff]/30 flex items-center justify-between text-xs shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-6 text-[11px] text-gray-400">
          <span>[TAB] ZEITACHSE WECHSELN</span>
          <span>[WASD / PFEIL] BEWEGEN</span>
          <span>[E] TERMINAL ZERSTÖREN</span>
          <button
            onClick={onBackToDeck}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold tracking-wider rounded transition-colors"
          >
            [ESC] ZUM HAUPTDECK
          </button>
        </div>
      </footer>
    </div>
  );
};
