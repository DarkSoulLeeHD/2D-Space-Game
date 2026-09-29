// services/endgameService.ts - Mathematische Score-Berechnung, Dual-Grid-Kausalität & Live-Ops

import {
  IDualTile,
  ILeaderboardEntry,
  IRaidAffix,
  ISeasonPassReward,
  ISeasonPassState,
  WorldTier,
} from '../types/endgame';
import { SeededRng } from './seededRng';

const LEADERBOARD_KEY = 'chrono_endgame_leaderboard_v14';
const SEASON_PASS_KEY = 'chrono_season_pass_v14';

export const WORLD_TIER_MULTIPLIERS: Record<WorldTier, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.0,
  4: 2.5,
  5: 3.5,
};

export const DEFAULT_WEEKLY_AFFIXES: IRaidAffix[] = [
  {
    id: 'TIME_DILATION',
    name: '[!] ZEIT-VERZÖGERUNG',
    description: 'Aktionskosten für Ausweichschritte auf beiden Grids um 1 AP erhöht.',
    isHarmful: true,
  },
  {
    id: 'KINETIC_BREACH',
    name: '[!] KINETIK-BRUCH',
    description: 'Feinde besitzen 30% panzerbrechende Munition; Schild absorbiert weniger.',
    isHarmful: true,
  },
  {
    id: 'AP_SURGE',
    name: '[+] AP-SURGE (ANOMALIE)',
    description: 'Das Schließen von Kausalitäts-Schleifen regeneriert instantan 2 AP.',
    isHarmful: false,
  },
];

export class EndgameService {
  // 1. Die Mathematische End-Score Formel
  // End-Score = Round( (BasePoints - (Rounds * 250) - (DamageTaken * 15) + (Crits * 120)) * TierMultiplier )
  public static calculateRaidScore(
    rounds: number,
    damageTaken: number,
    criticalHits: number,
    worldTier: WorldTier,
    basePoints: number = 100000
  ): number {
    const roundPenalty = rounds * 250;
    const damagePenalty = damageTaken * 15;
    const critBonus = criticalHits * 120;
    const rawScore = Math.max(1000, basePoints - roundPenalty - damagePenalty + critBonus);
    const tierMultiplier = WORLD_TIER_MULTIPLIERS[worldTier] || 1.0;
    return Math.round(rawScore * tierMultiplier);
  }

  // 2. Initialisierung des Dual-Grid-Paares (8x8)
  public static generateDualGrids(seedStr?: string): {
    gridA: IDualTile[][];
    gridB: IDualTile[][];
    vanceStart: { x: number; y: number };
    droneStart: { x: number; y: number };
  } {
    const rng = new SeededRng(seedStr || SeededRng.getCurrentWeeklySeed());

    const gridA: IDualTile[][] = [];
    const gridB: IDualTile[][] = [];

    // Erzeuge 8x8 Kacheln
    for (let y = 0; y < 8; y++) {
      gridA[y] = [];
      gridB[y] = [];
      for (let x = 0; x < 8; x++) {
        // Standardmäßig freie Bodenkacheln
        gridA[y][x] = {
          x,
          y,
          blocked: false,
          objectType: 'NONE',
        };
        gridB[y][x] = {
          x,
          y,
          blocked: false,
          objectType: 'NONE',
        };
      }
    }

    // Feste Kausalitäts-Verbindungen
    // Terminal 1 in Vergangenheit auf (2, 3) schaltet Tür 1 in Zukunft auf (2, 3) frei
    gridA[3][2] = {
      x: 2,
      y: 3,
      blocked: true,
      objectType: 'TERMINAL',
      terminalActive: true,
      label: 'TERMINAL ALPHA',
      hasCausalityLink: true,
      linkedTilePos: { x: 2, y: 3 },
    };

    gridB[3][2] = {
      x: 2,
      y: 3,
      blocked: true,
      objectType: 'DOOR',
      doorOpen: false,
      label: 'KRAFTFELD 30J',
      hasCausalityLink: true,
      linkedTilePos: { x: 2, y: 3 },
    };

    // Terminal 2 in Vergangenheit auf (5, 2) schaltet Schott 2 in Zukunft auf (4, 5) frei
    gridA[2][5] = {
      x: 5,
      y: 2,
      blocked: true,
      objectType: 'TERMINAL',
      terminalActive: true,
      label: 'TERMINAL BETA',
      hasCausalityLink: true,
      linkedTilePos: { x: 4, y: 5 },
    };

    gridB[5][4] = {
      x: 4,
      y: 5,
      blocked: true,
      objectType: 'DOOR',
      doorOpen: false,
      label: 'SCHOTT BETA',
      hasCausalityLink: true,
      linkedTilePos: { x: 5, y: 2 },
    };

    // Chrono-Kern als Hauptziel in Grid B (Zukunft)
    gridB[6][1] = {
      x: 1,
      y: 6,
      blocked: false,
      objectType: 'CHRONO_CORE',
      label: 'CHRONO-SPINDEL KERN',
    };

    // Zusätzliche prozedurale Hindernisse basierend auf PRNG
    const obstacleCount = 4;
    for (let i = 0; i < obstacleCount; i++) {
      const ox = rng.nextRange(1, 6);
      const oy = rng.nextRange(1, 6);
      if ((ox === 2 && oy === 3) || (ox === 5 && oy === 2) || (ox === 1 && oy === 1)) continue;
      gridA[oy][ox].blocked = true;
      gridA[oy][ox].objectType = 'DEBRIS';
    }

    for (let i = 0; i < obstacleCount + 2; i++) {
      const ox = rng.nextRange(1, 6);
      const oy = rng.nextRange(1, 6);
      if ((ox === 2 && oy === 3) || (ox === 4 && oy === 5) || (ox === 1 && oy === 6) || (ox === 6 && oy === 6)) continue;
      gridB[oy][ox].blocked = true;
      gridB[oy][ox].objectType = 'VOID_RIFT';
    }

    return {
      gridA,
      gridB,
      vanceStart: { x: 1, y: 1 },
      droneStart: { x: 6, y: 6 },
    };
  }

  // 3. Kausalitäts-Interaktion: Terminal in Vergangenheit zerstören -> Tür in Zukunft öffnet sich
  public static triggerPastTerminal(
    gridA: IDualTile[][],
    gridB: IDualTile[][],
    targetX: number,
    targetY: number
  ): {
    updatedGridA: IDualTile[][];
    updatedGridB: IDualTile[][];
    openedDoorPos: { x: number; y: number } | null;
  } {
    const tileA = gridA[targetY]?.[targetX];
    if (!tileA || tileA.objectType !== 'TERMINAL' || !tileA.terminalActive || !tileA.linkedTilePos) {
      return { updatedGridA: gridA, updatedGridB: gridB, openedDoorPos: null };
    }

    // Terminal in A deaktivieren / zerstören
    const newGridA = gridA.map((row) =>
      row.map((t) =>
        t.x === targetX && t.y === targetY
          ? { ...t, terminalActive: false, blocked: false, label: 'TERMINAL [ZERSTÖRT]' }
          : t
      )
    );

    // Entsprechende Tür in B instantan öffnen (30 Jahre später existiert die Blockade nicht mehr)
    const linked = tileA.linkedTilePos;
    const newGridB = gridB.map((row) =>
      row.map((t) =>
        t.x === linked.x && t.y === linked.y
          ? { ...t, doorOpen: true, blocked: false, label: 'SCHOTT [OFFEN]' }
          : t
      )
    );

    return {
      updatedGridA: newGridA,
      updatedGridB: newGridB,
      openedDoorPos: linked,
    };
  }

  // 4. Bestenlisten-Verwaltung (Local & Seeded)
  public static loadLeaderboard(): ILeaderboardEntry[] {
    try {
      const saved = localStorage.getItem(LEADERBOARD_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }

    // Standard-Saison-Bestenliste
    const defaultList: ILeaderboardEntry[] = [
      {
        rank: 1,
        callsign: 'Sarah_K',
        score: 284200,
        rounds: 11,
        damageTaken: 20,
        worldTier: 5,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Vor 2 Stunden',
      },
      {
        rank: 2,
        callsign: 'VoidWalk_99',
        score: 254110,
        rounds: 13,
        damageTaken: 45,
        worldTier: 4,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Vor 5 Stunden',
      },
      {
        rank: 3,
        callsign: 'Astraea_Ghost',
        score: 241212,
        rounds: 14,
        damageTaken: 65,
        worldTier: 4,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Vor 8 Stunden',
      },
      {
        rank: 4,
        callsign: 'Operative_Vance',
        score: 198500,
        rounds: 16,
        damageTaken: 80,
        worldTier: 3,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Aktueller Run',
        isPlayer: true,
      },
      {
        rank: 5,
        callsign: 'CausalBreaker',
        score: 175400,
        rounds: 18,
        damageTaken: 95,
        worldTier: 3,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Gestern',
      },
      {
        rank: 6,
        callsign: 'ApexScarab',
        score: 142000,
        rounds: 20,
        damageTaken: 110,
        worldTier: 2,
        seed: 'WEEK-2026-W40-NULL',
        timestamp: 'Vor 2 Tagen',
      },
    ];

    return defaultList;
  }

  public static recordPlayerScore(
    score: number,
    rounds: number,
    damageTaken: number,
    worldTier: WorldTier,
    seed: string
  ): ILeaderboardEntry[] {
    const list = this.loadLeaderboard();
    const newEntry: ILeaderboardEntry = {
      rank: 0,
      callsign: 'Operative_Vance',
      score,
      rounds,
      damageTaken,
      worldTier,
      seed,
      timestamp: 'Gerade eben',
      isPlayer: true,
    };

    // Bestehende Player-Einträge ersetzen falls Score höher
    const filtered = list.filter((e) => !e.isPlayer);
    filtered.push(newEntry);
    filtered.sort((a, b) => b.score - a.score);

    // Ränge neu vergeben
    const ranked = filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));

    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(ranked));
    } catch {
      // Ignore
    }

    return ranked;
  }

  // 5. 50-Stufen Non-FOMO Season-Pass
  public static loadSeasonPass(): ISeasonPassState {
    try {
      const saved = localStorage.getItem(SEASON_PASS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }

    const defaultRewards: ISeasonPassReward[] = Array.from({ length: 50 }, (_, i) => {
      const lvl = i + 1;
      let title = `Klon-Modul Stufe ${lvl}`;
      let type: ISeasonPassReward['type'] = 'TITLE';
      let rewardValue = `TITEL: KAUSAL-OPERATIVE ${lvl}`;

      if (lvl === 5) {
        title = 'Bernstein-CRT Phosphor-Shader';
        type = 'SHADER';
        rewardValue = 'AMBER_CRT';
      } else if (lvl === 15) {
        title = 'Scarab-IV Gold-Legierungs-Chassis';
        type = 'DRONE_SKIN';
        rewardValue = 'GOLD_SCARAB';
      } else if (lvl === 25) {
        title = 'Synthesizer-Stem: Null-Resonanz';
        type = 'AUDIO_THEME';
        rewardValue = 'NULL_SYNTH';
      } else if (lvl === 50) {
        title = 'APEX: Kausalitäts-Meister (Holo-Aura)';
        type = 'TITLE';
        rewardValue = 'APEX_AURA';
      }

      return {
        level: lvl,
        title,
        type,
        unlocked: lvl <= 24, // Initial Level 24 wie im Wireframe
        rewardValue,
      };
    });

    return {
      currentLevel: 24,
      currentXp: 3400,
      maxXpPerLevel: 5000,
      activeSeasonId: 'SEASON_01_NULL_PARADOX',
      seasonName: 'EPOCHE 01: DAS NULL-PARADOXON',
      rewards: defaultRewards,
    };
  }

  public static addSeasonXp(amount: number): ISeasonPassState {
    const current = this.loadSeasonPass();
    let { currentLevel, currentXp, maxXpPerLevel, rewards } = current;

    currentXp += amount;
    while (currentXp >= maxXpPerLevel && currentLevel < 50) {
      currentXp -= maxXpPerLevel;
      currentLevel += 1;
      rewards = rewards.map((r) => (r.level <= currentLevel ? { ...r, unlocked: true } : r));
    }

    const updated: ISeasonPassState = {
      ...current,
      currentLevel,
      currentXp,
      rewards,
    };

    try {
      localStorage.setItem(SEASON_PASS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    return updated;
  }
}
