// types/settings.ts - Die zentralen Einstellungs- und Parameter-Strukturen

export type PhosphorTheme = 'CYAN' | 'AMBER' | 'GREEN' | 'MONO';

export interface ITerminalSettings {
  // Audio-Subsystem (Gain-Werte)
  audio: {
    masterVolume: number;   // 0.0 bis 1.0
    sfxVolume: number;      // 0.0 bis 1.0
    ambientVolume: number;  // 0.0 bis 1.0
    uiVolume: number;       // 0.0 bis 1.0
    beepPitchHz: number;    // 800 bis 2800 Hz
    isMuted: boolean;
  };
  // Display- & Shader-Optionen
  display: {
    crtScanlineOpacity: number; // 0.0 bis 1.0
    bloomIntensity: number;     // 0.0 bis 1.0
    isCurvatureEnabled: boolean;
    colorTheme: PhosphorTheme;
    highContrast: boolean;
  };
  // Tastenbelegung (Action Name -> Key Code)
  keybindings: Record<string, string>;
  // KI-Integration
  aiCore: {
    apiKey: string;
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
    temperature: number;
    useOfflineFallback: boolean;
  };
  // Barrierefreiheit
  a11y: {
    speechNarration: boolean;
    speechRate: number;
    showTouchControls: boolean;
  };
}

export const THEME_COLORS: Record<PhosphorTheme, {
  primary: string;
  glow: string;
  bgTint: string;
  name: string;
  hex: string;
}> = {
  CYAN: {
    primary: '#00FFAA',
    glow: 'rgba(0, 255, 170, 0.6)',
    bgTint: 'rgba(0, 255, 170, 0.04)',
    name: 'ASTRAEA CYAN',
    hex: '#00FFAA',
  },
  AMBER: {
    primary: '#FFB703',
    glow: 'rgba(255, 183, 3, 0.6)',
    bgTint: 'rgba(255, 183, 3, 0.04)',
    name: 'BERNSTEIN 1982',
    hex: '#FFB703',
  },
  GREEN: {
    primary: '#39FF14',
    glow: 'rgba(57, 255, 20, 0.6)',
    bgTint: 'rgba(57, 255, 20, 0.04)',
    name: 'MILITÄR-GRÜN',
    hex: '#39FF14',
  },
  MONO: {
    primary: '#E0E1DD',
    glow: 'rgba(224, 225, 221, 0.5)',
    bgTint: 'rgba(224, 225, 221, 0.04)',
    name: 'EIS-MONOCHROM',
    hex: '#E0E1DD',
  },
};
