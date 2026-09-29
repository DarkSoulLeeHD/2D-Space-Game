// types/game.ts - Die zentralen Datenstrukturen für Chrono-Stratum

export interface IEquippedWeapon {
  id: string;
  name: string;
  damage: number;
  ammoCurrent: number;
  ammoMax: number;
}

export interface IPlayerState {
  callsign: string;
  level: number;
  credits: number;
  nanites: number;
  chronoCrystals: number;
  rigIntegrity: number; // 0 - 100%
  equippedWeapon: IEquippedWeapon;
  activeSector: number;
  unlockedSectors: number[];
}

export type SectorStatus = 'STABLE' | 'ANOMALY' | 'COLLAPSED' | 'ALERT';

export interface ISectorNode {
  id: number;
  name: string;
  code: string;
  threatLevel: 1 | 2 | 3 | 4 | 5;
  status: SectorStatus;
  x: number; // Relative Canvas-Koordinaten 0.0 - 1.0
  y: number;
  description: string;
  temperature: string;
  gravity: string;
  hazardNote: string;
  connections: number[]; // Node IDs connected to
}

export interface IGameSaveData {
  version: string;
  timestamp: number;
  player: IPlayerState;
  unlockedLogsCount: number;
  settings: {
    crtOpacity: number;
    audioVolume: number;
    colorTheme: 'CYAN' | 'AMBER' | 'GREEN';
  };
}
