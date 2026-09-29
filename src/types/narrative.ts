// types/narrative.ts - Datenstrukturen für Dialoge, Fraktionen, Kausalität & Kodex

export type FactionId = 'ASTRAEA' | 'GUILD' | 'HERETICS';

export interface IFactionReputation {
  astraea: number; // -100 bis +100
  guild: number; // -100 bis +100
  heretics: number; // -100 bis +100
}

export interface IDialogueChoice {
  id: number;
  text: string;
  factionAlignment: FactionId | 'NEUTRAL';
  reputationDelta: number;
  consequenceHint: string;
  isSilentOption?: boolean;
}

export interface IDialogueResponse {
  speakerText: string;
  choices: IDialogueChoice[];
  atmosphereNote?: string;
}

export interface INarrativeLogEntry {
  id: string;
  timestamp: string;
  speaker: string;
  faction: FactionId;
  text: string;
  chosenOption?: string;
  reputationImpact?: string;
}

export interface ISpeakerProfile {
  id: string;
  name: string;
  title: string;
  faction: FactionId;
  themeColor: string;
  glitchLevel: number; // 0.0 bis 1.0
  bio: string;
}

export interface INarrativeState {
  activeSpeaker: ISpeakerProfile;
  reputation: IFactionReputation;
  unlockedLogs: INarrativeLogEntry[];
  currentDilemmaTimeRemaining: number;
  isTyping: boolean;
}

export interface ICodexEntry {
  id: string;
  code: string;
  title: string;
  category: 'CHRONOS' | 'FACTIONS' | 'INCIDENTS' | 'ENTROPY';
  author: string;
  clearanceLevel: number;
  content: string;
  date: string;
  unlocked: boolean;
}
