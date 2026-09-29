import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ITacticalTile,
  ICombatEntity,
  CombatActionType,
  CombatPhase,
  IDamageParticle,
  ITracerLine,
} from '../types/combat';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { EnemyAudioEngine } from '../services/enemyAudio';
import { EnemyAiService } from '../services/enemyAiService';
import { fetchBossPhaseTaunt } from '../services/geminiBossDialogue';
import { CombatResolutionService } from '../services/combatResolutionService';
import { useGameStorage } from '../services/storageService';
import { TacticalGridCanvas } from './TacticalGridCanvas';
import { ChronoParryOverlay } from './ChronoParryOverlay';

interface CombatHUDProps {
  sectorName: string;
  threatLevel: number;
  onExitCombat: () => void;
}

// 10x10 Starter Kampffeld mit Deckungen und Gefahrenfeldern
const INITIAL_GRID: ITacticalTile[][] = Array(10)
  .fill(null)
  .map((_, y) =>
    Array(10)
      .fill(null)
      .map((_, x) => {
        let type: ITacticalTile['type'] = 'FLOOR';
        // Wand-Hindernisse
        if ((x === 3 && y === 2) || (x === 6 && y === 7) || (x === 3 && y === 6)) {
          type = 'WALL_FULL';
        }
        // Halbe Deckungen
        else if ((x === 2 && y === 4) || (x === 5 && y === 3) || (x === 7 && y === 5)) {
          type = 'COVER_HALF';
        }
        // Strahlungsfelder
        else if ((x === 4 && y === 5) || (x === 5 && y === 5)) {
          type = 'HAZARD_RADIATION';
        }
        return { x, y, type, explored: true, visible: true };
      })
  );

// Starter Einheiten: Vance, Drohne, Praetor-Mech & Chrono-Kriecher
const INITIAL_ENTITIES: ICombatEntity[] = [
  {
    id: 'vance',
    name: 'VANCE',
    isPlayer: true,
    x: 1,
    y: 2,
    hp: 85,
    maxHp: 100,
    shield: 125,
    maxShield: 150,
    armor: 3,
    color: '#00FFAA',
  },
  {
    id: 'drone',
    name: 'SCARAB-IV',
    isPlayer: true,
    isDrone: true,
    x: 1,
    y: 3,
    hp: 250,
    maxHp: 250,
    shield: 50,
    maxShield: 50,
    armor: 1,
    color: '#00FFAA',
  },
  {
    id: 'creeper-1',
    name: 'CHRONO-KRIECHER',
    isPlayer: false,
    archetype: 'CREEPER',
    x: 6,
    y: 3,
    hp: 45,
    maxHp: 60,
    shield: 0,
    maxShield: 0,
    armor: 2,
    attackRange: 1,
    damage: 24,
    color: '#E07A5F',
    intent: {
      actionType: 'ATTACK',
      targetTile: { x: 1, y: 2 },
      damagePreview: 24,
      description: 'Plant Kinetik-Klauenangriff auf Operative Vance.',
    },
  },
  {
    id: 'praetor-1',
    name: 'PRAETOR MECH',
    isPlayer: false,
    archetype: 'PRAETOR',
    x: 7,
    y: 6,
    hp: 75,
    maxHp: 80,
    shield: 30,
    maxShield: 50,
    armor: 4,
    attackRange: 6,
    damage: 18,
    color: '#38bdf8',
    intent: {
      actionType: 'ATTACK',
      targetTile: { x: 1, y: 2 },
      damagePreview: 18,
      description: 'Lädt Impuls-Sperrfeuer (18 DMG) auf Operative Vance.',
    },
  },
];

export const CombatHUD: React.FC<CombatHUDProps> = ({
  sectorName,
  threatLevel: initialThreatLevel,
  onExitCombat,
}) => {
  const { updatePlayer } = useGameStorage();
  const [grid, setGrid] = useState<ITacticalTile[][]>(INITIAL_GRID);
  const [entities, setEntities] = useState<ICombatEntity[]>(INITIAL_ENTITIES);
  const [round, setRound] = useState<number>(1);
  const [phase, setPhase] = useState<CombatPhase>('PLAYER_TURN');
  const [actionPoints, setActionPoints] = useState<number>(6);
  const maxActionPoints = 6;
  const [bonusApNextTurn, setBonusApNextTurn] = useState<number>(0);
  const [entropyLevel, setEntropyLevel] = useState<number>(20);
  const [medStims, setMedStims] = useState<number>(2);
  const maxMedStims = 3;
  const [ammoCurrent, setAmmoCurrent] = useState<number>(30);
  const ammoMax = 36;

  const [selectedAction, setSelectedAction] = useState<CombatActionType>('MOVE');
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 2, y: 2 });
  const [targetTile, setTargetTile] = useState<{ x: number; y: number } | null>({ x: 2, y: 2 });
  const [focusedEnemyId, setFocusedEnemyId] = useState<string>('creeper-1');
  const [damageParticles, setDamageParticles] = useState<IDamageParticle[]>([]);
  const [tracerLines, setTracerLines] = useState<ITracerLine[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [radioIntercept, setRadioIntercept] = useState<string | null>(null);
  const [isSectorCleared, setIsSectorCleared] = useState<boolean>(false);

  // Chrono-Parade QTE State
  const [parryState, setParryState] = useState<{
    isActive: boolean;
    attackerName: string;
    damage: number;
    attackerId: string;
  } | null>(null);

  const [combatLogs, setCombatLogs] = useState<string[]>([
    '>> [AICR GEFECHTS-SYSTEM INITIALISIERT]: "Kinetischer Schild auf 125 MJ kalibriert."',
    '>> [INTENT-VORHERSAGE AKTIV]: Feindliche Absichten werden offen auf dem Grid telegrafiert.',
  ]);

  const audio = ProceduralAudioEngine.getInstance();
  const enemyAudio = EnemyAudioEngine.getInstance();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const playerEntity = useMemo(
    () => entities.find((e) => e.isPlayer && !e.isDrone) || entities[0],
    [entities]
  );
  const focusedEnemy = useMemo(
    () => entities.find((e) => e.id === focusedEnemyId) || entities.find((e) => !e.isPlayer && e.hp > 0),
    [entities, focusedEnemyId]
  );

  // Initial & Round-Start Intent Recalculation
  const refreshIntents = useCallback(() => {
    setEntities((prev) => {
      const p = prev.find((e) => e.isPlayer && !e.isDrone) || prev[0];
      return EnemyAiService.calculateIntents(prev, grid, p);
    });
  }, [grid]);

  // Recalculate intents on round change or player movement
  useEffect(() => {
    refreshIntents();
  }, [round, playerEntity.x, playerEntity.y, refreshIntents]);

  // Particle & Tracer Decay Loop
  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const updateEffects = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setTracerLines((prev) =>
        prev
          .map((t) => ({ ...t, life: t.life - dt * 3.5 }))
          .filter((t) => t.life > 0)
      );

      setDamageParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            offsetY: p.offsetY + 22 * dt,
            alpha: p.alpha - 1.2 * dt,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0)
      );

      animId = requestAnimationFrame(updateEffects);
    };

    animId = requestAnimationFrame(updateEffects);
    return () => cancelAnimationFrame(animId);
  }, []);

  const spawnDamageParticle = useCallback((x: number, y: number, text: string, color: string) => {
    const newParticle: IDamageParticle = {
      id: `dp-${Date.now()}-${Math.random()}`,
      text,
      x,
      y,
      color,
      alpha: 1.0,
      life: 0.8,
      offsetY: 0,
    };
    setDamageParticles((prev) => [...prev, newParticle]);
  }, []);

  const spawnTracer = useCallback((sx: number, sy: number, ex: number, ey: number, color: string) => {
    const newTracer: ITracerLine = {
      id: `tr-${Date.now()}-${Math.random()}`,
      startX: sx,
      startY: sy,
      endX: ex,
      endY: ey,
      color,
      life: 1.0,
    };
    setTracerLines((prev) => [...prev, newTracer]);
  }, []);

  // Reachable tiles calculation based on selected action
  const reachableTiles = useMemo(() => {
    const reachable: { x: number; y: number }[] = [];
    const px = playerEntity.x;
    const py = playerEntity.y;

    if (selectedAction === 'MOVE') {
      const moveRange = 3;
      for (let dy = -moveRange; dy <= moveRange; dy++) {
        for (let dx = -moveRange; dx <= moveRange; dx++) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist > 0 && dist <= moveRange) {
            const tx = px + dx;
            const ty = py + dy;
            if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10) {
              const tile = grid[ty]?.[tx];
              if (tile && tile.type !== 'WALL_FULL' && tile.type !== 'HAZARD_VOID') {
                reachable.push({ x: tx, y: ty });
              }
            }
          }
        }
      }
    } else if (selectedAction === 'DASH') {
      const dashOffsets = [
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 },
      ];
      dashOffsets.forEach(({ dx, dy }) => {
        const tx = px + dx;
        const ty = py + dy;
        if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10) {
          const tile = grid[ty]?.[tx];
          if (tile && tile.type !== 'WALL_FULL' && tile.type !== 'HAZARD_VOID') {
            reachable.push({ x: tx, y: ty });
          }
        }
      });
    } else if (selectedAction === 'ATTACK') {
      entities.forEach((ent) => {
        if (!ent.isPlayer && ent.hp > 0) {
          reachable.push({ x: ent.x, y: ent.y });
        }
      });
    }

    return reachable;
  }, [playerEntity, selectedAction, grid, entities]);

  // Handle Tile Selection on Grid
  const handleTileSelect = useCallback(
    (pos: { x: number; y: number }) => {
      setCursorPos(pos);
      setTargetTile(pos);

      const clickedEnemy = entities.find(
        (e) => !e.isPlayer && e.hp > 0 && e.x === pos.x && e.y === pos.y
      );
      if (clickedEnemy) {
        setFocusedEnemyId(clickedEnemy.id);
      }
    },
    [entities]
  );

  // Execute Action (Player Phase)
  const handleExecuteAction = useCallback(() => {
    if (phase !== 'PLAYER_TURN' || !targetTile) return;

    if (selectedAction === 'MOVE') {
      if (actionPoints < 1) {
        showToast('NICHT GENUG AP (1 AP BENÖTIGT)');
        return;
      }
      const isReachable = reachableTiles.some(
        (t) => t.x === targetTile.x && t.y === targetTile.y
      );
      if (!isReachable) {
        showToast('ZIEL AUSSERHALB DER REICHWEITE (MAX 3 KACHELN)');
        return;
      }

      audio.playApSpend();
      setActionPoints((prev) => prev - 1);
      setEntities((prev) =>
        prev.map((e) =>
          e.isPlayer && !e.isDrone ? { ...e, x: targetTile.x, y: targetTile.y } : e
        )
      );

      const targetTileObj = grid[targetTile.y]?.[targetTile.x];
      if (targetTileObj?.type === 'HAZARD_RADIATION') {
        setEntities((prev) =>
          prev.map((e) =>
            e.isPlayer && !e.isDrone ? { ...e, hp: Math.max(1, e.hp - 10) } : e
          )
        );
        spawnDamageParticle(targetTile.x, targetTile.y, 'STRAHLUNG: -10 HP', '#E63946');
        audio.playShieldBreak();
        setCombatLogs((prev) => [
          `>> WARNUNG: Strahlungszone betreten! -10 HP Strahlungsschaden!`,
          ...prev,
        ]);
      }

      setCombatLogs((prev) => [
        `>> BEWEGUNG: Operative Vance verlegt auf Koordinate (${targetTile.x}, ${targetTile.y}) [-1 AP]`,
        ...prev,
      ]);
      showToast('BEWEGUNG AUSGEFÜHRT');
    } else if (selectedAction === 'DASH') {
      if (actionPoints < 1) {
        showToast('NICHT GENUG AP (1 AP)');
        return;
      }
      audio.playPhaseShift(true);
      setActionPoints((prev) => prev - 1);
      setEntropyLevel((prev) => Math.min(100, prev + 15));
      setEntities((prev) =>
        prev.map((e) =>
          e.isPlayer && !e.isDrone ? { ...e, x: targetTile.x, y: targetTile.y } : e
        )
      );
      spawnDamageParticle(targetTile.x, targetTile.y, 'CHRONO-DASH', '#00FFAA');
      setCombatLogs((prev) => [
        `>> QUANTEN-DASH: Phasen-Sprung auf (${targetTile.x}, ${targetTile.y}) [+15% Entropie]`,
        ...prev,
      ]);
      showToast('PHASEN-SPRUNG DURCHGEFÜHRT');
    } else if (selectedAction === 'ATTACK') {
      if (actionPoints < 2) {
        showToast('NICHT GENUG AP FÜR ANGRIFF (2 AP)');
        return;
      }
      if (ammoCurrent < 6) {
        showToast('MAGAZIN FAST LEER - BITTE NACHLADEN [R]');
        return;
      }

      const targetEnemy = entities.find(
        (e) => !e.isPlayer && e.hp > 0 && e.x === targetTile.x && e.y === targetTile.y
      );

      audio.playApSpend();
      setActionPoints((prev) => prev - 2);
      setAmmoCurrent((prev) => Math.max(0, prev - 6));
      spawnTracer(playerEntity.x, playerEntity.y, targetTile.x, targetTile.y, '#00FFAA');
      audio.playGunshotBurst();
      // Sidechain-Ducking bei Waffenschuss (-12 dB)
      (window as unknown as { terminalMusicEngine?: { triggerSidechainDuck: (db: number, s: number) => void } }).terminalMusicEngine?.triggerSidechainDuck(-12, 0.25);

      if (targetEnemy) {
        const dist =
          Math.abs(playerEntity.x - targetEnemy.x) + Math.abs(playerEntity.y - targetEnemy.y);
        const targetCover = grid[targetEnemy.y]?.[targetEnemy.x]?.type || 'FLOOR';
        const result = CombatResolutionService.resolveAttack(
          42,
          targetEnemy,
          dist,
          targetCover,
          'KINETIC'
        );

        if (result.hit) {
          const remainingHp = Math.max(0, targetEnemy.hp - result.damage);
          const newShield = Math.max(0, targetEnemy.shield - result.damage);

          setEntities((prev) =>
            prev.map((e) =>
              e.id === targetEnemy.id
                ? {
                    ...e,
                    hp: remainingHp,
                    shield: newShield,
                  }
                : e
            )
          );

          if (result.isCrit) {
            audio.playCriticalHit();
          }

          spawnDamageParticle(
            targetEnemy.x,
            targetEnemy.y,
            `-${result.damage} ${result.isCrit ? 'CRIT!' : ''}`,
            result.isCrit ? '#FFE600' : '#E63946'
          );

          setCombatLogs((prev) => [
            `>> ARC-70 FEUERSALVE: ${targetEnemy.name} getroffen! ${result.text}`,
            ...prev,
          ]);
          showToast(`TREFFER: ${result.text}`);

          // Check Boss Phase Transition if Nilus
          if (targetEnemy.archetype === 'BOSS_NILUS') {
            const hpPct = (remainingHp / targetEnemy.maxHp) * 100;
            const currentBossPhase = targetEnemy.bossPhase || 1;
            const newBossPhase = hpPct > 66 ? 1 : hpPct > 33 ? 2 : 3;

            if (newBossPhase > currentBossPhase) {
              setEntities((prev) =>
                prev.map((e) =>
                  e.id === targetEnemy.id ? { ...e, bossPhase: newBossPhase } : e
                )
              );
              // Fetch Gemini Boss Phase Taunt
              fetchBossPhaseTaunt(
                undefined,
                'APEX-WÄCHTER NILUS',
                newBossPhase,
                Math.round((playerEntity.hp / playerEntity.maxHp) * 100)
              ).then((taunt) => {
                setRadioIntercept(taunt);
                audio.playShieldBreak();
                setCombatLogs((prev) => [taunt, ...prev]);
              });
            }
          }

          // Enemy Defeated & Loot Drop
          if (remainingHp <= 0) {
            const loot = CombatResolutionService.generateLootOnKill(
              targetEnemy.maxHp,
              1.6,
              true,
              targetEnemy.archetype === 'BOSS_NILUS'
            );
            updatePlayer((prev) => ({
              ...prev,
              nanites: prev.nanites + loot.nanites,
              chronoCrystals: prev.chronoCrystals + loot.crystals,
            }));

            audio.playCriticalHit();
            spawnDamageParticle(targetEnemy.x, targetEnemy.y, `BEUTE: +${loot.nanites} TN`, '#00FFAA');
            setCombatLogs((prev) => [
              `>> [FEIND ELIMINIERT]: ${targetEnemy.name} vernichtet! +${loot.nanites} Naniten ${
                loot.crystals > 0 ? `+${loot.crystals} CK` : ''
              } geborgen!`,
              ...prev,
            ]);
            showToast(`ZIEL VERNICHTET (+${loot.nanites} TN)`);

            // Check if all enemies are defeated
            const remainingEnemies = entities.filter(
              (e) => !e.isPlayer && e.id !== targetEnemy.id && e.hp > 0
            );
            if (remainingEnemies.length === 0) {
              setIsSectorCleared(true);
              enemyAudio.playVictoryFanfare();
              (window as unknown as { terminalMusicEngine?: { setMusicState: (st: string) => void } }).terminalMusicEngine?.setMusicState('VICTORY');
              setCombatLogs((prev) => [
                '>> [SEKTOR GESICHERT]: Alle Feind-Signaturen eliminiert! Schleusen-Tor aktiv.',
                ...prev,
              ]);
            }
          }
        } else {
          spawnDamageParticle(targetEnemy.x, targetEnemy.y, 'FEHLSCHUSS', '#64748b');
          setCombatLogs((prev) => [
            `>> ARC-70 Salve verfehlt ${targetEnemy.name} (Querschläger in Deckung)`,
            ...prev,
          ]);
          showToast('FEHLSCHUSS [VERFEHLT]');
        }
      }
    } else if (selectedAction === 'DRONE') {
      if (actionPoints < 1) {
        showToast('NICHT GENUG AP');
        return;
      }
      audio.playApSpend();
      setActionPoints((prev) => prev - 1);
      setEntities((prev) =>
        prev.map((e) =>
          e.isPlayer && !e.isDrone ? { ...e, shield: Math.min(e.maxShield, e.shield + 25) } : e
        )
      );
      spawnDamageParticle(playerEntity.x, playerEntity.y, '+25 SCHILD', '#00FFAA');
      setCombatLogs((prev) => [
        '>> SCARAB-IV LINK: Kinetik-Schild um +25 MJ regeneriert [-1 AP]',
        ...prev,
      ]);
      showToast('SCHILD REGENERIERT (+25 MJ)');
    }
  }, [
    phase,
    targetTile,
    selectedAction,
    actionPoints,
    ammoCurrent,
    reachableTiles,
    entities,
    playerEntity,
    grid,
    audio,
    enemyAudio,
    spawnDamageParticle,
    spawnTracer,
    updatePlayer,
  ]);

  // Reload Ammo
  const handleReload = useCallback(() => {
    if (actionPoints < 1) {
      showToast('NICHT GENUG AP ZUM NACHLADEN (1 AP)');
      return;
    }
    audio.playApSpend();
    setActionPoints((prev) => prev - 1);
    setAmmoCurrent(ammoMax);
    setCombatLogs((prev) => ['>> TAKTIK-NACHLADEN: Magazin gefüllt (36/36) [-1 AP]', ...prev]);
    showToast('MAGAZIN NACHGELADEN (36 SCHUSS)');
  }, [actionPoints, ammoMax, audio]);

  // Use Med-Stim
  const handleMedStim = useCallback(() => {
    if (actionPoints < 1) {
      showToast('NICHT GENUG AP (1 AP BENÖTIGT)');
      return;
    }
    if (medStims <= 0) {
      showToast('KEINE MED-STIMS MEHR VERFÜGBAR');
      return;
    }
    audio.playApSpend();
    setActionPoints((prev) => prev - 1);
    setMedStims((prev) => prev - 1);
    setEntities((prev) =>
      prev.map((e) =>
        e.isPlayer && !e.isDrone ? { ...e, hp: Math.min(e.maxHp, e.hp + 35) } : e
      )
    );
    setEntropyLevel((prev) => Math.max(0, prev - 10));
    spawnDamageParticle(playerEntity.x, playerEntity.y, '+35 HP', '#34d399');
    setCombatLogs((prev) => [
      '>> MED-STIM INJEKTION: +35 HP regeneriert // -10% Entropie abgebaut [-1 AP]',
      ...prev,
    ]);
    showToast('MED-STIM INJIZIERT (+35 HP)');
  }, [actionPoints, medStims, playerEntity, audio, spawnDamageParticle]);

  // Boss Spawner (Encounter Simulation Helper)
  const handleSpawnNilusBoss = useCallback(() => {
    const nilusExists = entities.some((e) => e.archetype === 'BOSS_NILUS');
    if (nilusExists) {
      showToast('APEX-WÄCHTER NILUS BEREITS AUF DEM GRID');
      return;
    }

    const bossNilus: ICombatEntity = {
      id: `nilus-${Date.now()}`,
      name: 'APEX-WÄCHTER NILUS',
      isPlayer: false,
      archetype: 'BOSS_NILUS',
      isBoss: true,
      bossPhase: 1,
      x: 7,
      y: 4,
      hp: 160,
      maxHp: 160,
      shield: 80,
      maxShield: 80,
      armor: 4,
      attackRange: 8,
      damage: 32,
      color: '#E63946',
    };

    setEntities((prev) => [...prev, bossNilus]);
    enemyAudio.playBossChargeHum();
    showToast('ALARM: APEX-WÄCHTER NILUS ENTDECKT!');
    setCombatLogs((prev) => [
      '>> [SEKTOR-ALARM]: Schwere kybernetische Resonanz! Boss Apex-Wächter Nilus hat das Kampfraster betreten!',
      ...prev,
    ]);

    fetchBossPhaseTaunt(
      undefined,
      'APEX-WÄCHTER NILUS',
      1,
      Math.round((playerEntity.hp / playerEntity.maxHp) * 100)
    ).then((taunt) => {
      setRadioIntercept(taunt);
    });
  }, [entities, enemyAudio, playerEntity]);

  // Turn Resolution Engine (Enemy Turn Sequence)
  const completeEnemyTurn = useCallback(
    (damageTaken: number) => {
      setParryState(null);
      (window as unknown as { terminalMusicEngine?: { setMusicState: (st: string) => void } }).terminalMusicEngine?.setMusicState('COMBAT');

      if (damageTaken > 0) {
        setEntities((prev) =>
          prev.map((e) => {
            if (e.isPlayer && !e.isDrone) {
              let s = e.shield;
              let hp = e.hp;
              if (s >= damageTaken) {
                s -= damageTaken;
              } else {
                const rem = damageTaken - s;
                s = 0;
                hp = Math.max(1, hp - rem);
              }
              return { ...e, shield: s, hp };
            }
            return e;
          })
        );
        spawnDamageParticle(playerEntity.x, playerEntity.y, `-${damageTaken} HP`, '#E63946');
      }

      // Return to Player Turn
      setTimeout(() => {
        audio.playPhaseShift(true);
        setRound((r) => r + 1);
        const allocatedAp = maxActionPoints + bonusApNextTurn;
        setActionPoints(allocatedAp);
        setBonusApNextTurn(0);
        setPhase('PLAYER_TURN');
        showToast(`RUNDE GESTARTET // ${allocatedAp} AP ZUGETEILT`);
      }, 350);
    },
    [playerEntity, bonusApNextTurn, maxActionPoints, audio, spawnDamageParticle]
  );

  // SEQUENZIELLE FEIND-PHASE (Teil 8 Choreografie)
  const handleEndTurn = useCallback(async () => {
    if (phase !== 'PLAYER_TURN') return;

    audio.playPhaseShift(false);
    setPhase('ENEMY_TURN');
    showToast('OPERATIVE-ZUG BEENDET // FEIND-PHASE');

    const livingEnemies = entities.filter((e) => !e.isPlayer && e.hp > 0);

    if (livingEnemies.length === 0) {
      setIsSectorCleared(true);
      enemyAudio.playVictoryFanfare();
      setPhase('PLAYER_TURN');
      return;
    }

    let pendingPlayerDamage = 0;
    let pendingParryAttacker: { name: string; damage: number; id: string } | null = null;

    // Sequenzielle Ausführung jedes Gegners nacheinander
    for (const enemy of livingEnemies) {
      const occupied = entities
        .filter((e) => e.hp > 0 && e.id !== enemy.id)
        .map((e) => ({ x: e.x, y: e.y }));

      const result = await EnemyAiService.executeSingleEnemyAction(
        enemy,
        playerEntity,
        grid,
        occupied,
        enemyAudio
      );

      // 1. Position aktualisieren
      if (result.newPos.x !== enemy.x || result.newPos.y !== enemy.y) {
        setEntities((prev) =>
          prev.map((e) => (e.id === enemy.id ? { ...e, x: result.newPos.x, y: result.newPos.y } : e))
        );
      }

      // 2. Kacheln zerstören (Boss Phase 3)
      if (result.destroyTiles && result.destroyTiles.length > 0) {
        setGrid((prev) =>
          prev.map((row) =>
            row.map((tile) =>
              result.destroyTiles!.some((dt) => dt.x === tile.x && dt.y === tile.y)
                ? { ...tile, type: 'HAZARD_VOID' }
                : tile
            )
          )
        );
        audio.playShieldBreak();
        setCombatLogs((prev) => [
          '>> [GRAVITATIONS-KOLLAPS]: Zwei Bodenkacheln sind in das Vakuum gerissen worden!',
          ...prev,
        ]);
      }

      // 3. Zeit-Echo spawnen (Boss Phase 2)
      if (result.spawnEcho) {
        const echoExists = entities.some((e) => e.id === 'nilus-echo');
        if (!echoExists) {
          const echoClone: ICombatEntity = {
            id: 'nilus-echo',
            name: 'NILUS-ECHO (KLON)',
            isPlayer: false,
            archetype: 'NILUS_CLONE',
            x: Math.max(0, enemy.x - 2),
            y: enemy.y,
            hp: 60,
            maxHp: 60,
            shield: 20,
            maxShield: 20,
            armor: 2,
            damage: 20,
            color: '#a855f7',
          };
          setEntities((prev) => [...prev, echoClone]);
          spawnDamageParticle(echoClone.x, echoClone.y, 'BIFURKATION!', '#a855f7');
        }
      }

      // 4. Logbuch Eintrag
      if (result.logText) {
        setCombatLogs((prev) => [result.logText, ...prev]);
      }

      // 5. Angriffsausführung
      if (result.attackExecuted && result.damageAmount > 0) {
        spawnTracer(enemy.x, enemy.y, playerEntity.x, playerEntity.y, enemy.color || '#E07A5F');

        if (result.attackType === 'AOE') {
          // Direkter AOE Schaden
          pendingPlayerDamage += result.damageAmount;
          spawnDamageParticle(playerEntity.x, playerEntity.y, `-${result.damageAmount} HP`, '#E63946');
        } else {
          // Direkter Angriff -> Parade-Fenster vorbereiten!
          pendingParryAttacker = {
            name: enemy.name,
            damage: result.damageAmount,
            id: enemy.id,
          };
        }
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    // Wenn ein direkter Angriff auf Vance erfolgte: Starte Chrono-Parry QTE!
    if (pendingParryAttacker) {
      (window as unknown as { terminalMusicEngine?: { setMusicState: (st: string) => void } }).terminalMusicEngine?.setMusicState('CHRONO_STASIS');
      setParryState({
        isActive: true,
        attackerName: pendingParryAttacker.name,
        damage: pendingParryAttacker.damage + pendingPlayerDamage,
        attackerId: pendingParryAttacker.id,
      });
    } else {
      // Nur AOE oder kein Schaden
      setTimeout(() => {
        completeEnemyTurn(pendingPlayerDamage);
      }, 400);
    }
  }, [phase, entities, playerEntity, grid, audio, enemyAudio, completeEnemyTurn, spawnTracer, spawnDamageParticle]);

  // Handle Parry QTE Success
  const handleParrySuccess = useCallback(() => {
    spawnDamageParticle(playerEntity.x, playerEntity.y, 'PERFEKTE PARADE! 0 DMG', '#00FFAA');
    setBonusApNextTurn(1);
    setCombatLogs((prev) => [
      '>> [PERFEKTE CHRONO-PARADE]: Angriff pariert (0 HP Schaden)! Angreifer geblendet // +1 AP nächste Runde',
      ...prev,
    ]);
    showToast('PERFEKTE PARADE! (+1 BONUS-AP)');
    completeEnemyTurn(0);
  }, [playerEntity, completeEnemyTurn, spawnDamageParticle]);

  // Handle Parry QTE Failure
  const handleParryFail = useCallback(() => {
    const dmg = parryState?.damage || 24;
    setCombatLogs((prev) => [
      `>> [PARADE VERFEHLT]: ${parryState?.attackerName} trifft voll! -${dmg} Schaden absorbiert`,
      ...prev,
    ]);
    completeEnemyTurn(dmg);
  }, [parryState, completeEnemyTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'PLAYER_TURN') return;

      if (e.key === '1') {
        setSelectedAction('MOVE');
        audio.playHoverPing();
      } else if (e.key === '2') {
        setSelectedAction('ATTACK');
        audio.playHoverPing();
      } else if (e.key === '3') {
        setSelectedAction('DASH');
        audio.playHoverPing();
      } else if (e.key === '4') {
        setSelectedAction('DRONE');
        audio.playHoverPing();
      } else if (e.key.toLowerCase() === 'r') {
        handleReload();
      } else if (e.key.toLowerCase() === 'h') {
        handleMedStim();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleEndTurn();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleExecuteAction();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setCursorPos((prev) => {
          const next = { ...prev, y: Math.max(0, prev.y - 1) };
          setTargetTile(next);
          return next;
        });
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setCursorPos((prev) => {
          const next = { ...prev, y: Math.min(9, prev.y + 1) };
          setTargetTile(next);
          return next;
        });
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCursorPos((prev) => {
          const next = { ...prev, x: Math.max(0, prev.x - 1) };
          setTargetTile(next);
          return next;
        });
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCursorPos((prev) => {
          const next = { ...prev, x: Math.min(9, prev.x + 1) };
          setTargetTile(next);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, audio, handleReload, handleMedStim, handleEndTurn, handleExecuteAction]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#05070a] text-cyan-400 font-mono select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* CHRONO-PARRY OVERLAY MODAL */}
      {/* ========================================================================= */}
      {parryState?.isActive && (
        <ChronoParryOverlay
          incomingDamage={parryState.damage}
          attackerName={parryState.attackerName}
          onParrySuccess={handleParrySuccess}
          onParryFail={handleParryFail}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTOR SECURED BANNER OVERLAY (ÜBERGANG ZU TEIL 9) */}
      {/* ========================================================================= */}
      {isSectorCleared && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-lg w-full bg-[#080d14] border-2 border-[#00FFAA] p-6 shadow-[0_0_30px_rgba(0,255,170,0.4)] text-center space-y-4">
            <div className="text-2xl font-bold tracking-widest text-[#00FFAA] phosphor-glow animate-pulse">
              &gt;&gt; SEKTOR-ABSCHNITT GESICHERT &lt;&lt;
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Alle feindlichen Signaturen wurden eliminiert. Das Vakuum-Schott zum nächsten Sektor-Knoten wurde entriegelt.
            </p>
            <div className="p-3 bg-black/60 border border-cyan-900 text-xs text-cyan-300 flex justify-around">
              <div>RUNDEN: <strong className="text-white">{round}</strong></div>
              <div>ENTROPIE: <strong className="text-white">{entropyLevel}%</strong></div>
              <div>STATUS: <strong className="text-[#00FFAA]">SCHLEUSE OFFEN</strong></div>
            </div>
            <div className="pt-2 flex gap-3 justify-center">
              <button
                onClick={onExitCombat}
                className="px-6 py-3 bg-[#00FFAA] text-black font-bold text-xs tracking-widest hover:bg-white transition-all shadow-[0_0_15px_#00FFAA] cursor-pointer"
              >
                [ZUR NÄCHSTEN SCHLEUSE VORRÜCKEN &gt;]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIEGETIC RADIO INTERCEPT BANNER (GEMINI FLASH BOSS TAUNT) */}
      {/* ========================================================================= */}
      {radioIntercept && (
        <div className="relative z-30 bg-red-950/90 border-b border-red-500 px-4 py-2 flex items-center justify-between text-xs text-red-200 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <strong className="text-red-400 font-bold">[FUNK-INTERZEPT // FREQUENZ 142.8 MHz]:</strong>
            <span className="italic">{radioIntercept}</span>
          </div>
          <button
            onClick={() => setRadioIntercept(null)}
            className="text-[10px] text-red-400 hover:text-white px-2 py-0.5 border border-red-800"
          >
            QUITTIEREN [X]
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZONE 1: TACTICAL HUD HEADER */}
      {/* ========================================================================= */}
      <header className="relative z-20 h-14 border-b border-cyan-900/60 bg-[#070b10] px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FFAA] animate-ping" />
            <span className="font-bold text-white tracking-widest text-[11px] sm:text-xs">
              AICR-MODEL-7 // {sectorName}
            </span>
          </div>
          <span className="hidden md:inline px-2 py-0.5 bg-red-950/70 border border-red-500/50 text-red-300 text-[10px] font-bold">
            BEDROHUNG: STUFE {initialThreatLevel}
          </span>
          <span className="hidden sm:inline text-cyan-300 text-[11px] font-bold">RUNDE: {round}</span>
        </div>

        {/* Phase Indicator & Encounter Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSpawnNilusBoss}
            title="Spawnt den mehrphasigen Boss Apex-Wächter Nilus für diesen Encounter"
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 border border-red-600 text-red-300 hover:bg-red-800 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
          >
            <span>[!] NILUS BOSS SPAWNEN</span>
          </button>

          <div
            className={`px-3 py-1 border font-bold text-xs tracking-wider transition-all ${
              phase === 'PLAYER_TURN'
                ? 'bg-cyan-950 border-[#00FFAA] text-[#00FFAA] shadow-[0_0_10px_rgba(0,255,170,0.3)]'
                : 'bg-red-950 border-red-500 text-red-300 animate-pulse'
            }`}
          >
            {phase === 'PLAYER_TURN' ? 'OPERATIVE PHASE' : 'FEIND PHASE...'}
          </div>

          <button
            onClick={onExitCombat}
            className="px-2.5 py-1 border border-cyan-800 hover:border-red-500 text-slate-300 hover:text-red-300 text-[11px] transition-colors font-medium"
          >
            RÜCKZUG [ESC]
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#070b10] border border-[#00FFAA] px-4 py-1.5 text-xs text-[#00FFAA] shadow-[0_0_15px_rgba(0,255,170,0.4)] animate-bounce">
          {notification}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN COMBAT ARENA LAYOUT (ZONE 2, 3, 4) */}
      {/* ========================================================================= */}
      <main className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ========================================================================= */}
        {/* ZONE 2: VANCE & VITAL-TELEMETRIE DOCK (LINKS) */}
        {/* ========================================================================= */}
        <section className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-cyan-900/60 bg-[#06090e]/95 p-3 flex flex-col justify-between shrink-0 text-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="font-bold text-gray-200">TELEMETRIE: VANCE</span>
              <span className="text-[10px] text-cyan-300 font-bold">OPERATIVE-01</span>
            </div>

            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-medium">VITAL-INTEGRITÄT</span>
                <span className="font-bold text-emerald-400">
                  {playerEntity.hp}/{playerEntity.maxHp} HP
                </span>
              </div>
              <div className="w-full h-2.5 bg-black border border-cyan-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(playerEntity.hp / playerEntity.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Shield Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 font-medium">KINETIK-SCHILD</span>
                <span className="font-bold text-cyan-300">
                  {playerEntity.shield}/{playerEntity.maxShield} MJ
                </span>
              </div>
              <div className="w-full h-2.5 bg-black border border-cyan-900 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${(playerEntity.shield / playerEntity.maxShield) * 100}%` }}
                />
              </div>
            </div>

            {/* Armor & Entropy */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 bg-black/50 border border-cyan-950">
                <div className="text-cyan-300 text-[10px] font-bold">RÜSTUNG</div>
                <div className="font-bold text-white text-sm">{playerEntity.armor} PT</div>
              </div>
              <div className="p-2 bg-black/50 border border-cyan-950">
                <div className="text-cyan-300 text-[10px] font-bold">ENTROPIE</div>
                <div className="font-bold text-purple-300 text-sm">{entropyLevel}%</div>
              </div>
            </div>

            {/* Med-Stims Inventory */}
            <div className="p-2.5 bg-black/60 border border-cyan-950 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-medium">MED-STIM DEPOT:</span>
                <span className="text-emerald-400 font-bold">{medStims}/{maxMedStims}</span>
              </div>
              <button
                onClick={handleMedStim}
                disabled={medStims <= 0 || actionPoints < 1 || phase !== 'PLAYER_TURN'}
                className="w-full py-1.5 bg-emerald-950/80 border border-emerald-600 text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors text-[10px] font-bold cursor-pointer disabled:opacity-40"
              >
                [H] INJIZIEREN (+35 HP // -1 AP)
              </button>
            </div>
          </div>

          {/* Scarab-IV Drone Status */}
          <div className="pt-3 border-t border-cyan-950">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-300 font-medium">DROHNE SCARAB-IV</span>
              <span className="text-[#00FFAA] text-[10px] font-bold">VERBUNDEN</span>
            </div>
            <div className="w-full h-1.5 bg-black border border-cyan-950 mb-2">
              <div className="h-full bg-[#00FFAA] w-full" />
            </div>
            <div className="text-[10px] text-slate-300 font-medium leading-tight">
              Astraea Drohnen-Link bereit. [4] Schild-Regeneration (+25 MJ) einsatzbereit.
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ZONE 3: DAS 10x10 TAKTISCHE GRID-CANVAS (MITTE) */}
        {/* ========================================================================= */}
        <section className="flex-1 relative flex items-center justify-center p-2 bg-[#05070a] overflow-hidden">
          <TacticalGridCanvas
            grid={grid}
            entities={entities}
            playerPos={{ x: playerEntity.x, y: playerEntity.y }}
            targetTile={targetTile}
            cursorPos={cursorPos}
            selectedAction={selectedAction}
            reachableTiles={reachableTiles}
            damageParticles={damageParticles}
            tracerLines={tracerLines}
            isSectorCleared={isSectorCleared}
            exitTile={{ x: 9, y: 5 }}
            onTileSelect={handleTileSelect}
          />
        </section>

        {/* ========================================================================= */}
        {/* ZONE 4: ZIELERFASSUNG & GEFECHTS-LOG (RECHTS) */}
        {/* ========================================================================= */}
        <section className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-cyan-900/60 bg-[#06090e]/95 p-3 flex flex-col justify-between shrink-0 text-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-950">
              <span className="font-bold text-gray-300">ZIELERFASSUNG</span>
              <span className="text-[10px] text-red-400">RADAR-LINK</span>
            </div>

            {/* Focused Enemy Dossier & Telegraphed Intent */}
            {focusedEnemy && focusedEnemy.hp > 0 ? (
              <div className="p-3 bg-black/60 border border-cyan-950 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-400 text-xs">{focusedEnemy.name}</span>
                  <span className="text-[10px] text-gray-400">
                    POS: ({focusedEnemy.x}, {focusedEnemy.y})
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>STATUS</span>
                    <span>{focusedEnemy.hp}/{focusedEnemy.maxHp} HP</span>
                  </div>
                  <div className="w-full h-1.5 bg-black border border-cyan-950">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(focusedEnemy.hp / focusedEnemy.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Telegraphed Intent Box */}
                {focusedEnemy.intent && (
                  <div className="p-2 bg-red-950/40 border border-red-500/40 text-[10px] space-y-1">
                    <div className="flex justify-between text-red-300 font-bold">
                      <span>! FEINDLICHE ABSICHT:</span>
                      <span>
                        {focusedEnemy.intent.actionType === 'AOE_HAMMER'
                          ? '3x3 FLÄCHENSCHLAG'
                          : focusedEnemy.intent.actionType === 'DEFENSE'
                          ? 'SCHILD-AUFBAU'
                          : `${focusedEnemy.intent.damagePreview} DMG`}
                      </span>
                    </div>
                    <p className="text-gray-300 italic">{focusedEnemy.intent.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-black/50 border border-cyan-900 text-cyan-300 font-medium text-center text-xs">
                Kein lebendes Feind-Ziel erfasst.
              </div>
            )}

            {/* Combat Logs Output */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
                GEFECHTS-LOG // STREAM
              </div>
              <div className="h-44 overflow-y-auto bg-black/90 border border-cyan-900 p-2 space-y-1 text-[10px] font-mono scrollbar-thin">
                {combatLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-tight font-medium ${
                      log.includes('ELIMINIERT') || log.includes('BEUTE')
                        ? 'text-[#00FFAA]'
                        : log.includes('TREFFER')
                        ? 'text-yellow-300'
                        : log.includes('FUNK-INTERZEPT')
                        ? 'text-red-400 font-bold'
                        : log.includes('WARNUNG') || log.includes('erleidet')
                        ? 'text-red-300 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* End Turn Trigger */}
          <div className="pt-3 border-t border-cyan-950">
            <button
              onClick={handleEndTurn}
              disabled={phase !== 'PLAYER_TURN'}
              className="w-full py-3 bg-cyan-950 border border-cyan-400 text-cyan-200 font-bold hover:bg-cyan-500 hover:text-black transition-colors text-xs tracking-widest cursor-pointer disabled:opacity-50"
            >
              [LEERTASTE] RUNDE BEENDEN &gt;
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* ZONE 5: AKTIONS-MATRIX & WAFFEN-DOCK (UNTEN // VOLLE BREITE) */}
      {/* ========================================================================= */}
      <footer className="relative z-30 min-h-20 p-3 sm:px-6 bg-[#070b10] border-t border-cyan-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cyan-300 font-medium shrink-0">
        {/* AP-Pool (6 AP as per specs) */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-cyan-300 font-bold">AP-POOL:</span>
          <div className="flex gap-1.5">
            {Array(maxActionPoints)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 border flex items-center justify-center font-bold text-[10px] ${
                    i < actionPoints
                      ? 'bg-[#00FFAA] text-black border-[#00FFAA] shadow-[0_0_8px_#00FFAA]'
                      : 'bg-black/60 text-cyan-700 border-cyan-900'
                  }`}
                >
                  ◆
                </div>
              ))}
          </div>
          <span className="text-gray-200 font-bold text-[11px]">({actionPoints}/{maxActionPoints} AP)</span>
        </div>

        {/* Action Buttons Matrix */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'MOVE' as const, num: '1', label: 'BEWEGEN', cost: '1 AP' },
            { id: 'ATTACK' as const, num: '2', label: 'FEUERN', cost: '2 AP' },
            { id: 'DASH' as const, num: '3', label: 'CHRONO-DASH', cost: '1 AP' },
            { id: 'DRONE' as const, num: '4', label: 'DROHNEN-LINK', cost: '1 AP' },
          ].map((act) => {
            const isSelected = selectedAction === act.id;
            return (
              <button
                key={act.id}
                onClick={() => {
                  setSelectedAction(act.id);
                  audio.playHoverPing();
                }}
                className={`px-3 py-2 border font-bold text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#00FFAA] bg-cyan-950 text-[#00FFAA] shadow-[0_0_12px_rgba(0,255,170,0.3)]'
                    : 'border-cyan-800 bg-black/40 text-slate-200 hover:border-cyan-500'
                }`}
              >
                [{act.num}] {act.label} <span className="text-[10px] text-cyan-200 font-medium">({act.cost})</span>
              </button>
            );
          })}

          <button
            onClick={handleReload}
            className="px-3 py-2 border border-cyan-700 bg-black/40 text-slate-200 hover:bg-cyan-950 hover:text-cyan-200 text-xs font-bold"
          >
            [R] NACHLADEN ({ammoCurrent}/{ammoMax})
          </button>
        </div>

        {/* Weapon Ammo Readout */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-gray-200 bg-black/60 px-3 py-1.5 border border-cyan-800/80">
          <span>WAFFE: <strong className="text-white">ARC-70 IMPULS</strong></span>
          <span className="text-cyan-300 font-bold">MUNITION: {ammoCurrent}/{ammoMax}</span>
        </div>
      </footer>
    </div>
  );
};
