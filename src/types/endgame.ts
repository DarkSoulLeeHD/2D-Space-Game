// types/endgame.ts - Datenstrukturen für Apex-Raids, Dual-Grid-Mechaniken & Live-Ops (SYS-ENDG-14)

export type WorldTier = 1 | 2 | 3 | 4 | 5;

export type TileObjectType = 'NONE' | 'TERMINAL' | 'DOOR' | 'CHRONO_CORE' | 'VOID_RIFT' | 'DEBRIS';

export interface IDualTile {
  x: number;
  y: number;
  blocked: boolean;
  objectType: TileObjectType;
  terminalActive?: boolean;
  doorOpen?: boolean;
  label?: string;
  hasCausalityLink?: boolean;
  linkedTilePos?: { x: number; y: number };
}

export interface IRaidAffix {
  id: string;
  name: string;
  description: string;
  isHarmful: boolean;
}

export interface IRaidState {
  activeRaidId: 'CHRONO_SPINDLE' | 'WEEKLY_INCURSION';
  currentPhase: 1 | 2 | 3;
  worldTier: WorldTier;
  roundsTaken: number;
  enrageTimerRounds: number; // Max rounds before total enrage wipe
  damageTaken: number;
  criticalHits: number;
  score: number;
  gridA: IDualTile[][]; // Vergangenheit (8x8)
  gridB: IDualTile[][]; // Zukunft (8x8)
  vancePos: { x: number; y: number };
  dronePos: { x: number; y: number };
  activeEpoch: 'PAST' | 'FUTURE';
  isBifurcated: boolean;
  causalityTriggerCount: number;
  coreExtracted: boolean;
}

export interface ILeaderboardEntry {
  rank: number;
  callsign: string;
  score: number;
  rounds: number;
  damageTaken: number;
  worldTier: WorldTier;
  seed: string;
  timestamp: string;
  isPlayer?: boolean;
}

export interface ISeasonPassReward {
  level: number;
  title: string;
  type: 'SHADER' | 'TITLE' | 'DRONE_SKIN' | 'AUDIO_THEME';
  unlocked: boolean;
  rewardValue: string;
}

export interface ISeasonPassState {
  currentLevel: number;
  currentXp: number;
  maxXpPerLevel: number;
  activeSeasonId: string;
  seasonName: string;
  rewards: ISeasonPassReward[];
}
