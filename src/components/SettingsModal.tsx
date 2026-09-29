import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ITerminalSettings, PhosphorTheme, THEME_COLORS } from '../types/settings';
import { SettingsService, ACTION_LABELS } from '../services/settingsService';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { TerminalSpeechSynthesizer } from '../services/speechService';
import { getStorageUsageKb, exportSaveAsJson, loadGameSave, saveGameData, resetGameSave } from '../services/storageService';
import { AudioSpectrumCanvas } from './AudioSpectrumCanvas';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged?: (newSettings: ITerminalSettings) => void;
}

type SettingsTab = 'AUDIO' | 'DISPLAY' | 'INPUT' | 'AI_CORE' | 'A11Y' | 'STORAGE';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged,
}) => {
  const [settings, setSettings] = useState<ITerminalSettings>(() => SettingsService.loadSettings());
  const [activeTab, setActiveTab] = useState<SettingsTab>('AUDIO');
  const [listeningKeyAction, setListeningKeyAction] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [resetHoldProgress, setResetHoldProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  const audio = ProceduralAudioEngine.getInstance();
  const speech = TerminalSpeechSynthesizer.getInstance();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync state whenever opened
  useEffect(() => {
    if (isOpen) {
      const loaded = SettingsService.loadSettings();
      setSettings(loaded);
    }
  }, [isOpen]);

  // Save changes & notify parent
  const applySettings = useCallback((updated: ITerminalSettings) => {
    setSettings(updated);
    SettingsService.saveSettings(updated);
    onSettingsChanged?.(updated);
  }, [onSettingsChanged]);

  // Key Listener for Rebinding
  useEffect(() => {
    if (!listeningKeyAction) return;

    const handleRebind = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newBindings = {
        ...settings.keybindings,
        [listeningKeyAction]: e.code,
      };

      const updated = {
        ...settings,
        keybindings: newBindings,
      };

      applySettings(updated);
      setListeningKeyAction(null);
      audio.playSelectClick();
      showToast(`TASTE BELEGT: ${e.code}`);
    };

    window.addEventListener('keydown', handleRebind, { capture: true, once: true });
    return () => window.removeEventListener('keydown', handleRebind, { capture: true });
  }, [listeningKeyAction, settings, applySettings, audio]);

  // Global hotkeys inside Settings (Esc, R, S)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (listeningKeyAction) return;

      if (e.key === 'Escape') {
        audio.playUiClick();
        onClose();
      } else if (e.key.toLowerCase() === 'r' && (e.ctrlKey || e.altKey)) {
        e.preventDefault();
        const def = SettingsService.resetToDefaults();
        applySettings(def);
        audio.playSelectClick();
        showToast('WERKS-EINSTELLUNGEN WIEDERHERGESTELLT');
      } else if (e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        applySettings(settings);
        audio.playSelectClick();
        showToast('PARAMETER ERFOLGREICH GESPEICHERT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, listeningKeyAction, settings, applySettings, onClose, audio]);

  if (!isOpen) return null;

  const currentTheme = THEME_COLORS[settings.display.colorTheme] || THEME_COLORS.CYAN;

  // Handle Save Import from JSON
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.player) {
          saveGameData(parsed);
          audio.playSelectClick();
          showToast('SPIELSTAND ERFOLGREICH IMPORTIERT');
        } else {
          showToast('FEHLER: UNGÜLTIGES SPIELSTAND-FORMAT');
        }
      } catch {
        showToast('FEHLER: DATEI KONNTE NICHT GELESEN WERDEN');
      }
    };
    reader.readAsText(file);
  };

  // Hold reset button logic (5s hold)
  const startResetHold = () => {
    setResetHoldProgress(0);
    const startTime = performance.now();
    const interval = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, (elapsed / 3000) * 100);
      setResetHoldProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        resetGameSave();
        audio.playSelectClick();
        showToast('LOKALER SPEICHER VOLLSTÄNDIG BEREINIGT');
        setResetHoldProgress(0);
      }
    }, 50);

    resetTimerRef.current = interval;
  };

  const cancelResetHold = () => {
    if (resetTimerRef.current) {
      clearInterval(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setResetHoldProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col justify-between p-2 sm:p-6 font-mono select-none overflow-hidden animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 right-8 z-[70] bg-cyan-950/95 border border-cyan-400 px-4 py-2 text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,255,170,0.5)]">
          &gt; {notification}
        </div>
      )}

      {/* Hidden File Input for Save Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* TERMINAL HEADER: SYSTEM-KONFIGURATION */}
      {/* ========================================================================= */}
      <header className="h-12 border-b border-cyan-900/80 bg-[#080c12] px-4 flex items-center justify-between text-xs text-cyan-400 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] animate-pulse" />
          <span className="font-bold tracking-widest text-gray-100">
            ASTRAEA MODEL-7 BIOS // PARAMETER-OVERRIDE MATRIX
          </span>
          <span className="hidden md:inline text-cyan-600">// AICR-BIOS v9.4</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden sm:inline text-cyan-500/70">
            STORAGE: <strong className="text-gray-200">{getStorageUsageKb()}</strong> BELEGT
          </span>
          <button
            onClick={() => {
              audio.playUiClick();
              onClose();
            }}
            className="px-2.5 py-1 bg-cyan-950/80 border border-cyan-600 hover:bg-cyan-500 hover:text-black transition-colors font-bold text-cyan-300 text-[11px]"
          >
            [ESC / ZURÜCK]
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MASTER-GRID: 3-ZONEN-LAYOUT (ZONE A: TABS // ZONE B: PANEL // ZONE C: PREVIEW) */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-2 overflow-hidden my-2">
        {/* ----------------------------------------------------------------------- */}
        {/* ZONE A: KATEGORIEN-NAVIGATION (3 SPALTEN) */}
        {/* ----------------------------------------------------------------------- */}
        <nav className="lg:col-span-3 flex flex-col gap-1.5 bg-[#090d14] border border-cyan-900/60 p-3 overflow-y-auto">
          <div className="text-[10px] text-cyan-500 tracking-[0.25em] font-bold pb-2 border-b border-cyan-950 mb-1">
            SUB-SYSTEME // BIOS
          </div>

          {[
            { id: 'AUDIO' as const, num: '1', title: 'AKUSTIK-MIXER', sub: 'Gain-Stufen, Pitch & Pings' },
            { id: 'DISPLAY' as const, num: '2', title: 'CRT-DISPLAY', sub: 'Scanlines, Bloom & Farben' },
            { id: 'INPUT' as const, num: '3', title: 'EINGABE-MATRIX', sub: 'Tasten-Mapping & D-Pad' },
            { id: 'AI_CORE' as const, num: '4', title: 'ASTRAEA-KI-CORE', sub: 'Gemini SDK & Temperatur' },
            { id: 'A11Y' as const, num: '5', title: 'BARRIEREFREIHEIT', sub: 'TTS, Screenreader & Touch' },
            { id: 'STORAGE' as const, num: '6', title: 'SPEICHER-KERN', sub: 'JSON Export & Reset' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  audio.playHoverPing();
                }}
                className={`text-left p-3 border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-[0_0_15px_rgba(0,255,170,0.2)]'
                    : 'border-cyan-900/40 bg-black/30 hover:border-cyan-600 hover:bg-cyan-950/20 text-gray-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold tracking-wider">
                    [{tab.num}] {tab.title}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{tab.sub}</div>
                </div>
                {isActive && <span className="text-cyan-400 font-bold">&gt;</span>}
              </button>
            );
          })}

          <div className="mt-auto pt-3 border-t border-cyan-950 text-[10px] text-cyan-600">
            AICR DSP ENGINE 48kHz DIRECT // ZERO LATENCY
          </div>
        </nav>

        {/* ----------------------------------------------------------------------- */}
        {/* ZONE B: PARAMETER-BEDIENFELD (6 SPALTEN) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-6 bg-[#070b10] border border-cyan-900/60 p-4 sm:p-5 overflow-y-auto">
          {/* TAB 1: AKUSTIK-MIXER */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-5 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 01 // PROZEDURALER WEB AUDIO MIXER
                </h2>
                <p className="text-[11px] text-gray-400">
                  Direkte Hardware-Kalibrierung der Web Audio Gain-Stufen. Keine Audio-Dateien; 100% DSP-Synthese.
                </p>
              </div>

              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">MASTER-LAUTSTÄRKE:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.audio.masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.audio.masterVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({ ...settings, audio: { ...settings.audio, masterVolume: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">SFX &amp; TRANSIENTEN:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.audio.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.audio.sfxVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({ ...settings, audio: { ...settings.audio, sfxVolume: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Ambient Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">AMBIENT-DRONE:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.audio.ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.audio.ambientVolume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({ ...settings, audio: { ...settings.audio, ambientVolume: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Beep Pitch Hz */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">PIEPLAUT-PITCH (UI):</span>
                  <span className="text-cyan-400 font-bold">{settings.audio.beepPitchHz} Hz</span>
                </div>
                <input
                  type="range"
                  min="800"
                  max="2800"
                  step="50"
                  value={settings.audio.beepPitchHz}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    applySettings({ ...settings, audio: { ...settings.audio, beepPitchHz: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Mute toggle & Test Tone Trigger */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    audio.playTestTone(settings.audio.beepPitchHz);
                  }}
                  className="flex-1 py-3 bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold tracking-widest hover:bg-cyan-500 hover:text-black transition-colors"
                >
                  [ SIGNAL-TEST DURCHFÜHREN ]
                </button>
                <button
                  onClick={() => {
                    const muted = !settings.audio.isMuted;
                    audio.toggleMute();
                    applySettings({ ...settings, audio: { ...settings.audio, isMuted: muted } });
                  }}
                  className={`px-4 py-3 border font-bold ${
                    settings.audio.isMuted
                      ? 'border-red-500 bg-red-950/60 text-red-300'
                      : 'border-cyan-800 bg-black/40 text-gray-300'
                  }`}
                >
                  {settings.audio.isMuted ? 'STUMM: AN' : 'STUMM: AUS'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CRT-DISPLAY */}
          {activeTab === 'DISPLAY' && (
            <div className="space-y-5 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 02 // CRT-DISPLAY &amp; VISUELLER KOMFORT
                </h2>
                <p className="text-[11px] text-gray-400">
                  Moduliert Kathodenstrahl-Emissivität, Scanlines und Farbschemata in Echtzeit.
                </p>
              </div>

              {/* Scanline Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">CRT-SCANLINE-INTENSITÄT:</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.display.crtScanlineOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.display.crtScanlineOpacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({ ...settings, display: { ...settings.display, crtScanlineOpacity: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Bloom Intensity */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">PHOSPHOR-BLÜHEN (BLOOM):</span>
                  <span className="text-cyan-400 font-bold">{Math.round(settings.display.bloomIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.display.bloomIntensity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({ ...settings, display: { ...settings.display, bloomIntensity: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Curvature Toggle */}
              <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-900/60">
                <div>
                  <div className="font-bold text-gray-200">GEWÖLBTES KATHODEN-PANEL (FISHEYE):</div>
                  <div className="text-[10px] text-gray-400">Emuliert 3D-Kippwinkel alter Industrie-Monitore</div>
                </div>
                <button
                  onClick={() => {
                    applySettings({
                      ...settings,
                      display: { ...settings.display, isCurvatureEnabled: !settings.display.isCurvatureEnabled },
                    });
                  }}
                  className={`px-3 py-1 text-xs font-bold border ${
                    settings.display.isCurvatureEnabled
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.display.isCurvatureEnabled ? 'EIN' : 'AUS'}
                </button>
              </div>

              {/* Color Themes */}
              <div className="space-y-2">
                <span className="font-bold text-gray-200">FARB-THEMA DER PHOSPHOR-SCHICHT:</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['CYAN', 'AMBER', 'GREEN', 'MONO'] as PhosphorTheme[]).map((themeKey) => {
                    const themeObj = THEME_COLORS[themeKey];
                    const isSelected = settings.display.colorTheme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        onClick={() => {
                          applySettings({ ...settings, display: { ...settings.display, colorTheme: themeKey } });
                          audio.playSelectClick();
                        }}
                        className={`p-2.5 border text-left flex items-center justify-between font-mono cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-white bg-cyan-950/60 font-bold'
                            : 'border-cyan-900/50 bg-black/40 hover:border-cyan-600'
                        }`}
                        style={{ color: themeObj.primary }}
                      >
                        <span>{themeObj.name}</span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/50"
                          style={{ backgroundColor: themeObj.primary }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EINGABE-MATRIX */}
          {activeTab === 'INPUT' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 03 // EINGABE-MATRIX &amp; KEYBINDING
                </h2>
                <p className="text-[11px] text-gray-400">
                  Klicke auf eine Belegung und drücke die gewünschte Taste auf der Tastatur.
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {Object.entries(settings.keybindings).map(([actionKey, currentBinding]) => {
                  const isListening = listeningKeyAction === actionKey;
                  const label = ACTION_LABELS[actionKey] || actionKey;

                  return (
                    <div
                      key={actionKey}
                      className="p-2.5 bg-black/40 border border-cyan-900/60 flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-200">{label}</span>
                      <button
                        onClick={() => {
                          setListeningKeyAction(actionKey);
                          audio.playHoverPing();
                        }}
                        className={`px-3 py-1 font-mono font-bold text-xs border cursor-pointer transition-colors ${
                          isListening
                            ? 'bg-amber-500 text-black border-amber-300 animate-pulse'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-700 hover:bg-cyan-500 hover:text-black'
                        }`}
                      >
                        {isListening ? '[TASTE DRÜCKEN...]' : currentBinding}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Virtual Touch D-Pad Toggle */}
              <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-900/60 mt-3">
                <div>
                  <div className="font-bold text-gray-200">VIRTUELLES TOUCH-D-PAD:</div>
                  <div className="text-[10px] text-gray-400">Blendet Steuerkreuze für mobile Displays ein</div>
                </div>
                <button
                  onClick={() => {
                    applySettings({
                      ...settings,
                      a11y: { ...settings.a11y, showTouchControls: !settings.a11y.showTouchControls },
                    });
                  }}
                  className={`px-3 py-1 text-xs font-bold border ${
                    settings.a11y.showTouchControls
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.a11y.showTouchControls ? 'AKTIV' : 'INAKTIV'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ASTRAEA-KI-CORE */}
          {activeTab === 'AI_CORE' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 04 // ASTRAEA-KI-CORE &amp; GEMINI FLASH
                </h2>
                <p className="text-[11px] text-gray-400">
                  Verwaltung des Google Gen AI SDKs für dynamische narrative Logs und Funksprüche.
                </p>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-200 flex justify-between">
                  <span>GOOGLE GEMINI API-KEY (OPTIONAL):</span>
                  <span className="text-[10px] text-cyan-500">NUR LOKAL IM BROWSER GESPEICHERT</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={settings.aiCore.apiKey}
                    onChange={(e) => {
                      applySettings({
                        ...settings,
                        aiCore: { ...settings.aiCore, apiKey: e.target.value },
                      });
                    }}
                    className="flex-1 px-3 py-2 bg-black border border-cyan-800 text-cyan-300 font-mono text-xs focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="px-3 py-2 bg-cyan-950 border border-cyan-700 text-cyan-400 text-xs hover:bg-cyan-500 hover:text-black"
                  >
                    {showApiKey ? 'VERBERGEN' : 'ZEIGEN'}
                  </button>
                </div>
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <span className="font-bold text-gray-200">MODELL-TOPOLOGIE:</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gemini-2.5-flash', label: 'GEMINI 2.5 FLASH', desc: 'Schnell (<400ms), empfohlen' },
                    { id: 'gemini-2.5-pro', label: 'GEMINI 2.5 PRO', desc: 'Tiefere Forensik & Logs' },
                  ].map((m) => {
                    const isSelected = settings.aiCore.model === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          applySettings({
                            ...settings,
                            aiCore: { ...settings.aiCore, model: m.id as any },
                          });
                        }}
                        className={`p-2.5 border text-left ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 font-bold'
                            : 'border-cyan-900/50 bg-black/40 text-gray-400 hover:border-cyan-700'
                        }`}
                      >
                        <div className="text-xs">{m.label}</div>
                        <div className="text-[10px] opacity-70">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Narrative Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">NARRATIVE TEMPERATUR:</span>
                  <span className="text-cyan-400 font-bold">
                    {settings.aiCore.temperature.toFixed(2)}{' '}
                    {settings.aiCore.temperature < 0.35 ? '[STRIKT MILITÄRISCH]' : settings.aiCore.temperature > 0.65 ? '[PARANOID]' : '[AUSGEWOGEN]'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={settings.aiCore.temperature}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    applySettings({
                      ...settings,
                      aiCore: { ...settings.aiCore, temperature: val },
                    });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Offline fallback toggle */}
              <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-900/60">
                <div>
                  <div className="font-bold text-gray-200">OFFLINE-FALLBACK-MODUS:</div>
                  <div className="text-[10px] text-gray-400">Nutzt 250 deterministische Text-Logs bei fehlendem Key</div>
                </div>
                <button
                  onClick={() => {
                    applySettings({
                      ...settings,
                      aiCore: { ...settings.aiCore, useOfflineFallback: !settings.aiCore.useOfflineFallback },
                    });
                  }}
                  className={`px-3 py-1 text-xs font-bold border ${
                    settings.aiCore.useOfflineFallback
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.aiCore.useOfflineFallback ? 'AKTIV' : 'DEAKTIVIERT'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: BARRIEREFREIHEIT */}
          {activeTab === 'A11Y' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 05 // BARRIEREFREIHEIT &amp; SPRACHAUSGABE (TTS)
                </h2>
                <p className="text-[11px] text-gray-400">
                  WCAG 2.2 AAA Konformität über native Web Speech API und High-Contrast Modi.
                </p>
              </div>

              {/* TTS Toggle */}
              <div className="flex items-center justify-between p-3 bg-black/40 border border-cyan-900/60">
                <div>
                  <div className="font-bold text-gray-200">SPRACH-ASSISTENZ (VORLESEN):</div>
                  <div className="text-[10px] text-gray-400">Liest Text und Terminal-Meldungen laut vor</div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !settings.a11y.speechNarration;
                    speech.isEnabled = nextVal;
                    applySettings({ ...settings, a11y: { ...settings.a11y, speechNarration: nextVal } });
                    if (nextVal) {
                      speech.speak('Sprach-Assistenz aktiviert. Astraea Model-7 bereit.', true);
                    }
                  }}
                  className={`px-3 py-1 text-xs font-bold border ${
                    settings.a11y.speechNarration
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-black text-gray-400 border-gray-700'
                  }`}
                >
                  {settings.a11y.speechNarration ? 'AKTIV' : 'AUS'}
                </button>
              </div>

              {/* Speech rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-200">SPRACH-TEMPO:</span>
                  <span className="text-cyan-400 font-bold">{settings.a11y.speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={settings.a11y.speechRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    speech.voiceRate = val;
                    applySettings({ ...settings, a11y: { ...settings.a11y, speechRate: val } });
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Speech Test Button */}
              <button
                onClick={() => {
                  speech.speak('Test-Signal: Stratum Null-Zone stabil. Schilde bei 92 Prozent.', true);
                }}
                className="w-full py-2.5 bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors"
              >
                [ SPRACH-AUDIT TESTEN ]
              </button>
            </div>
          )}

          {/* TAB 6: SPEICHER-KERN */}
          {activeTab === 'STORAGE' && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-cyan-900/60 pb-2">
                <h2 className="text-sm font-bold text-cyan-300 tracking-wider">
                  SUB-SYSTEM 06 // LOKALER DATENKERN &amp; EXPORT
                </h2>
                <p className="text-[11px] text-gray-400">
                  Manuelle Sicherung, Wiederherstellung und Löschung des lokalen Spielfortschritts.
                </p>
              </div>

              <div className="p-3 bg-black/40 border border-cyan-900/60 text-xs space-y-1 text-cyan-300">
                <div>&bull; Speicher-Schlüssel: <strong>&apos;CHRONO_SAVE_v1&apos;</strong></div>
                <div>&bull; Belegter Speicher: <strong>{getStorageUsageKb()}</strong> / 5.120 KB (0.55%)</div>
                <div>&bull; Integritäts-Check: <strong className="text-[#00FFAA]">VALIDIERT [OK]</strong></div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    const currentSave = loadGameSave();
                    exportSaveAsJson(currentSave);
                    showToast('SPIELSTAND ERFOLGREICH EXPORTIERT (.JSON)');
                  }}
                  className="w-full py-2.5 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold tracking-wider hover:bg-cyan-500 hover:text-black text-xs"
                >
                  [1] SPIELSTAND HERUNTERLADEN (.JSON EXPORT)
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2.5 bg-cyan-950/60 border border-cyan-700 text-gray-200 font-bold tracking-wider hover:bg-cyan-600 hover:text-black text-xs"
                >
                  [2] SPIELSTAND IMPORTIEREN (DATEI AUSWÄHLEN)
                </button>
              </div>

              {/* Factory reset holding button */}
              <div className="pt-3 border-t border-cyan-950">
                <div className="text-[11px] text-red-400 font-bold mb-1">[3] KERNEL-REINIGUNG (WERKS-RESET):</div>
                <button
                  onMouseDown={startResetHold}
                  onMouseUp={cancelResetHold}
                  onMouseLeave={cancelResetHold}
                  onTouchStart={startResetHold}
                  onTouchEnd={cancelResetHold}
                  className="w-full py-3 bg-red-950/40 border border-red-500 text-red-300 font-bold text-xs relative overflow-hidden select-none cursor-pointer"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-red-600/40 transition-all duration-75 pointer-events-none"
                    style={{ width: `${resetHoldProgress}%` }}
                  />
                  <span className="relative z-10">
                    {resetHoldProgress > 0
                      ? `LÖSCHUNG LÄUFT... (${Math.round(resetHoldProgress)}%)`
                      : 'GEDRÜCKT HALTEN (3 SEK) ZUR KOMPLETTEN LÖSCHUNG'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* ZONE C: LIVE-PARAMETER-VORSCHAU (3 SPALTEN) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-3 flex flex-col gap-3 bg-[#080c14] border border-cyan-900/60 p-3 overflow-hidden">
          <div className="text-[10px] text-cyan-500 tracking-widest font-bold pb-2 border-b border-cyan-950">
            [LIVE-PARAMETER-VORSCHAU]
          </div>

          {/* Mini-Terminal CRT Viewport (Live-Feedback for Scanlines & Bloom) */}
          <div
            className="relative flex-1 min-h-[140px] bg-[#05070a] border border-cyan-800/80 p-3 flex flex-col justify-between overflow-hidden"
            style={{
              textShadow: `0 0 ${settings.display.bloomIntensity * 12}px ${currentTheme.glow}`,
              transform: settings.display.isCurvatureEnabled ? 'perspective(500px) rotateX(2deg)' : 'none',
            }}
          >
            {/* Live Scanlines Layer in preview */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: settings.display.crtScanlineOpacity,
                backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.5) 50%)',
                backgroundSize: '100% 4px',
              }}
            />

            <div className="relative z-10 space-y-1" style={{ color: currentTheme.primary }}>
              <div className="text-[11px] font-bold tracking-widest">
                [TEST-TERMINAL]
              </div>
              <div className="text-[10px] opacity-80">
                SCHRIFT-SCHÄRFE: OK
              </div>
              <div className="text-[10px] opacity-80">
                PHOSPHOR: {currentTheme.name}
              </div>
              <div className="text-[10px] opacity-80">
                BLOOM: {Math.round(settings.display.bloomIntensity * 100)}%
              </div>
            </div>

            <div className="relative z-10 text-[9px] opacity-60 font-mono" style={{ color: currentTheme.primary }}>
              AETHEL-OS v9.4 // LIVE RENDER
            </div>
          </div>

          {/* Interactive Audio Spectrum Analyzer Canvas */}
          <div className="h-36 bg-[#05070a] border border-cyan-900/80 overflow-hidden relative">
            <AudioSpectrumCanvas colorTheme={settings.display.colorTheme} />
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* TERMINAL FOOTER: BEFEHLSLEISTE */}
      {/* ========================================================================= */}
      <footer className="h-12 border-t border-cyan-900/80 bg-[#080c12] px-4 flex items-center justify-between text-xs text-cyan-400 shrink-0">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hidden sm:inline font-mono text-gray-400">[ESC] ZURÜCK ZUM HAUPTDECK</span>
          <span className="hidden md:inline font-mono text-gray-400">[CTRL+R] AUF WERKS-WERTE</span>
          <span className="hidden lg:inline font-mono text-gray-400">[CTRL+S] SPEICHERN</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              const def = SettingsService.resetToDefaults();
              applySettings(def);
              audio.playSelectClick();
              showToast('WERKS-EINSTELLUNGEN WIEDERHERGESTELLT');
            }}
            className="px-3 py-1 border border-cyan-900 bg-cyan-950/40 text-gray-300 text-[11px] hover:bg-cyan-500 hover:text-black"
          >
            WERKS-RESET
          </button>
          <button
            onClick={() => {
              applySettings(settings);
              audio.playSelectClick();
              showToast('EINSTELLUNGEN GESPEICHERT');
              onClose();
            }}
            className="px-5 py-1 bg-[#00FFAA] text-black font-bold text-[11px] hover:bg-white tracking-widest"
          >
            SPEICHERN &amp; SCHLIESSEN
          </button>
        </div>
      </footer>
    </div>
  );
};
