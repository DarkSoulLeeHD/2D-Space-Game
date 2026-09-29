import { ITerminalSettings } from '../types/settings';
import { ProceduralAudioEngine } from './audioEngine';
import { TerminalSpeechSynthesizer } from './speechService';
import { CloudPersistenceService } from './supabaseClient';

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
    crtScanlineOpacity: 0.38,
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
      // Remove any legacy insecure cleartext key if present
      try {
        localStorage.removeItem(GEMINI_KEY_STORAGE);
        localStorage.removeItem('GEMINI_API_KEY_v1');
      } catch {
        // Ignore storage access errors
      }

      const raw = localStorage.getItem(SETTINGS_KEY);

      if (!raw) {
        return {
          ...DEFAULT_SETTINGS,
          aiCore: {
            ...DEFAULT_SETTINGS.aiCore,
            apiKey: '',
          },
        };
      }

      const parsed = JSON.parse(raw);
      const activeCachedKey = CloudPersistenceService.getCachedApiKey();
      const loadedScanline = parsed.display?.crtScanlineOpacity;
      const tunedScanline = typeof loadedScanline === 'number' && loadedScanline > 0.45 ? 0.38 : (loadedScanline ?? 0.38);

      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        audio: { ...DEFAULT_SETTINGS.audio, ...parsed.audio },
        display: {
          ...DEFAULT_SETTINGS.display,
          ...parsed.display,
          crtScanlineOpacity: tunedScanline,
        },
        keybindings: { ...DEFAULT_KEYBINDINGS, ...parsed.keybindings },
        aiCore: {
          ...DEFAULT_SETTINGS.aiCore,
          ...parsed.aiCore,
          apiKey: activeCachedKey || '',
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
      // If user configured an API key in UI, update in-memory cache and Supabase cloud profile if logged in
      if (settings.aiCore?.apiKey !== undefined) {
        const cleanedKey = settings.aiCore.apiKey.trim();
        CloudPersistenceService.setCachedApiKey(cleanedKey);

        const currentUser = CloudPersistenceService.getCurrentUser();
        if (currentUser) {
          CloudPersistenceService.syncApiKey(currentUser.id, cleanedKey).catch((err) => {
            console.warn('[SettingsService] Failed to sync API key to Supabase:', err);
          });
        }
      }

      // Sanitize settings: Never persist sensitive raw API key in clear text to localStorage (CWE-312)
      const settingsToPersist: ITerminalSettings = {
        ...settings,
        aiCore: {
          ...settings.aiCore,
          apiKey: '',
        },
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsToPersist));
      localStorage.removeItem(GEMINI_KEY_STORAGE);
      localStorage.removeItem('GEMINI_API_KEY_v1');

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
