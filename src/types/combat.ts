// types/combat.ts - Datenstrukturen für das taktische Grid-Gefecht & Feind-KI

export type CombatPhase = 'PLAYER_TURN' | 'ENEMY_TURN' | 'RESOLVING_ANIMATION';

export type TileType = 'FLOOR' | 'WALL_FULL' | 'COVER_HALF' | 'HAZARD_RADIATION' | 'HAZARD_VOID';

export interface ITacticalTile {
  x: number; // 0 bis 9
  y: number; // 0 bis 9
  type: TileType;
  explored: boolean;
  visible: boolean;
}

export type CombatActionType = 'MOVE' | 'ATTACK' | 'DASH' | 'DRONE' | 'RELOAD' | 'MEDSTIM';

export type EnemyArchetype = 'PRAETOR' | 'CREEPER' | 'BOSS_NILUS' | 'NILUS_CLONE';

export interface ICombatIntent {
  actionType: 'ATTACK' | 'BUFF' | 'MOVE' | 'AOE_HAMMER' | 'DEFENSE';
  targetTile: { x: number; y: number };
  affectedTiles?: { x: number; y: number }[]; // Für 3x3 Flächenangriffe
  damagePreview: number;
  description: string;
}

export interface ICombatEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  isDrone?: boolean;
  archetype?: EnemyArchetype;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  armor: number;
  color: string;
  attackRange?: number;
  damage?: number;
  isBoss?: boolean;
  bossPhase?: number;
  intent?: ICombatIntent;
}

export interface ICombatState {
  round: number;
  phase: CombatPhase;
  actionPoints: number;
  maxActionPoints: number;
  entropyLevel: number; // 0 - 100%
  medStimsRemaining: number;
  maxMedStims: number;
  ammoCurrent: number;
  ammoMax: number;
  entities: ICombatEntity[];
  selectedAction: CombatActionType;
  cursorPos: { x: number; y: number };
  targetTile: { x: number; y: number } | null;
  combatLog: string[];
}

export interface IDamageParticle {
  id: string;
  text: string;
  x: number; // Grid coordinates
  y: number;
  color: string;
  alpha: number;
  life: number;
  offsetY: number;
}

export interface ITracerLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  life: number; // 0 to 1
}

export interface IAttackResult {
  hit: boolean;
  damage: number;
  isCrit: boolean;
  text: string;
  damageType: 'KINETIC' | 'ENERGY' | 'ENTROPY';
}
