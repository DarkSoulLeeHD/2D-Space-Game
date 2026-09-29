// types/mission.ts - Datenstrukturen für Sektor-Knoten-Topologie und Missionsbriefing

export type MapNodeType = 'COMBAT' | 'SALVAGE' | 'HAZARD' | 'EVENT' | 'BOSS';

export interface IMapNode {
  id: string;
  type: MapNodeType;
  label: string;
  title: string;
  depth: number; // 0 bis 3
  x: number;     // Absolute or relative canvas position
  y: number;
  connections: string[]; // IDs erreichbarer Folgeknoten
  completed: boolean;
  active: boolean;
}

export interface IMissionDossier {
  codename: string;
  objective: string;
  environmentalHazards: string[];
  enemyThreats: string[];
  tacticalAdvice: string;
}

export type ThreatLevel = 1 | 2 | 3; // 1: Kadett, 2: Operative, 3: Kollaps

export interface IThreatModifier {
  level: ThreatLevel;
  label: string;
  hpMult: number;
  dmgMult: number;
  lootMult: number;
  affixCount: number;
}

export interface IActiveMissionState {
  sectorId: number;
  sectorName: string;
  selectedNode: IMapNode;
  threatLevel: ThreatLevel;
  activeAffixes: string[];
  dossier: IMissionDossier | null;
  isLoadingAi: boolean;
  isLaunching: boolean;
}

export const THREAT_CONFIGS: Record<ThreatLevel, IThreatModifier> = {
  1: {
    level: 1,
    label: 'KADETT',
    hpMult: 1.0,
    dmgMult: 1.0,
    lootMult: 1.0,
    affixCount: 0,
  },
  2: {
    level: 2,
    label: 'OPERATIVE',
    hpMult: 1.4,
    dmgMult: 1.25,
    lootMult: 1.6,
    affixCount: 1,
  },
  3: {
    level: 3,
    label: 'KOLLAPS',
    hpMult: 2.2,
    dmgMult: 1.8,
    lootMult: 2.8,
    affixCount: 2,
  },
};

export const AFFIX_POOL: { id: string; name: string; desc: string; type: 'BUFF' | 'DEBUFF' }[] = [
  {
    id: 'affix-vacuum',
    name: 'VAKUUM-BRUCH',
    desc: 'Operative verliert 1% Lebenserhaltung pro Zug bei Schild-Kollaps.',
    type: 'DEBUFF',
  },
  {
    id: 'affix-entropy',
    name: 'ENTROPIE-PULS',
    desc: 'Alle 3 Runden teleportieren Feinde 1 Feld näher an Vance heran.',
    type: 'DEBUFF',
  },
  {
    id: 'affix-shield',
    name: 'SCHILD-DÄMPFUNG',
    desc: 'Schildregeneration um 50% verlangsamt durch magnetische Interferenz.',
    type: 'DEBUFF',
  },
  {
    id: 'affix-kinetic',
    name: 'KINETIK-SURGE',
    desc: 'Waffenschaden steigt um +20%, erhöht jedoch den Rückstoß.',
    type: 'BUFF',
  },
  {
    id: 'affix-hyper',
    name: 'HYPER-RESONANZ',
    desc: 'Drohnen-Fähigkeiten laden +25% schneller im temporalen Feld.',
    type: 'BUFF',
  },
];
