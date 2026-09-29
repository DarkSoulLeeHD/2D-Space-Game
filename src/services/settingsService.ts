import { ITerminalSettings } from '../types/settings';
import { ProceduralAudioEngine } from './audioEngine';
import { TerminalSpeechSynthesizer } from './speechService';

const SETTINGS_KEY = 'CHRONO_SETTINGS_v1';
const GEMINI_KEY_STORAGE = 'GEMINI_API_KEY';

export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  moveNorth: 'KeyW',
  moveSouth: 'KeyS',
  moveWest: 'KeyA',
  moveEast: 'KeyD',
  interact: 'KeyE',
  scanRadar: 'Space',
  shieldOverload: 'ShiftLeft',
};

export const ACTION_LABELS: Record<string, string> = {
  moveNorth: 'Taktischer Schritt: NORD',
  moveSouth: 'Taktischer Schritt: SÜD',
  moveWest: 'Taktischer Schritt: WEST',
  moveEast: 'Taktischer Schritt: OST',
  interact: 'Interaktion / Terminal-Login',
  scanRadar: 'Scanner-Impuls (Radar)',
  shieldOverload: 'Notfall-Schild-Überlastung',
};

export const DEFAULT_SETTINGS: ITerminalSettings = {
  audio: {
    masterVolume: 0.75,
    sfxVolume: 1.0,
    ambientVolume: 0.5,
    uiVolume: 0.8,
    beepPitchHz: 1800,
    isMuted: false,
  },
  display: {
    crtScanlineOpacity: 0.6,
    bloomIntensity: 0.8,
    isCurvatureEnabled: false,
    colorTheme: 'CYAN',
    highContrast: false,
  },
  keybindings: DEFAULT_KEYBINDINGS,
  aiCore: {
    apiKey: '',
    model: 'gemini-2.5-flash',
    temperature: 0.4,
    useOfflineFallback: true,
  },
  a11y: {
    speechNarration: false,
    speechRate: 1.0,
    showTouchControls: false,
  },
};

export class SettingsService {
  public static loadSettings(): ITerminalSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const savedKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';

      if (!raw) {
        return {
          ...DEFAULT_SETTINGS,
          aiCore: {
            ...DEFAULT_SETTINGS.aiCore,
            apiKey: savedKey,
          },
        };
      }

      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
        display: { ...DEFAULT_SETTINGS.display, ...parsed.display },
        keybindings: { ...DEFAULT_KEYBINDINGS, ...parsed.keybindings },
        aiCore: {
          ...DEFAULT_SETTINGS.aiCore,
          ...parsed.aiCore,
          apiKey: savedKey || parsed.aiCore?.apiKey || '',
        },
        a11y: { ...DEFAULT_SETTINGS.a11y, ...parsed.a11y },
      };
    } catch (e) {
      console.warn('Failed to load settings from storage:', e);
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: ITerminalSettings): boolean {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

      // Separate storage for GEMINI_API_KEY as per spec
      if (settings.aiCore.apiKey !== undefined) {
        localStorage.setItem(GEMINI_KEY_STORAGE, settings.aiCore.apiKey.trim());
      }

      // Live-apply audio settings to ProceduralAudioEngine
      const audio = ProceduralAudioEngine.getInstance();
      audio.setMasterVolume(settings.audio.masterVolume);
      audio.setSfxVolume(settings.audio.sfxVolume);
      audio.setAmbientVolume(settings.audio.ambientVolume);
      audio.setUiVolume(settings.audio.uiVolume);

      // Live-apply speech settings
      const speech = TerminalSpeechSynthesizer.getInstance();
      speech.isEnabled = settings.a11y.speechNarration;
      speech.voiceRate = settings.a11y.speechRate;

      return true;
    } catch (e) {
      console.error('Failed to save settings:', e);
      return false;
    }
  }

  public static resetToDefaults(): ITerminalSettings {
    SettingsService.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}
