/**
 * CHRONO-STRATUM: PROTOCOL NULL
 * Main Application Container with Live Phosphor Shader Matrix
 */

import { useState, useEffect } from 'react';
import { BootSequence } from './components/BootSequence';
import { HomeScreen } from './components/HomeScreen';
import { SettingsModal } from './components/SettingsModal';
import { ArsenalWorkshop } from './components/ArsenalWorkshop';
import { OperationsHub } from './components/OperationsHub';
import { CombatHUD } from './components/CombatHUD';
import { NarrativeTerminal } from './components/NarrativeTerminal';
import { EconomyExchange } from './components/EconomyExchange';
import { EndgameTerminal } from './components/EndgameTerminal';
import { EngineTelemetryOverlay } from './components/EngineTelemetryOverlay';
import { QaAuditModal } from './components/QaAuditModal';
import { ProceduralAudioEngine } from './services/audioEngine';
import { SettingsService } from './services/settingsService';
import { ITerminalSettings, THEME_COLORS } from './types/settings';
import { SECTOR_NODES } from './components/RadarViewport';
import { useWebSoundtrack } from './hooks/useWebSoundtrack';
import { MusicState } from './services/proceduralMusicEngine';

export type AppView =
  | 'BOOT'
  | 'HOME'
  | 'SETTINGS'
  | 'ARSENAL'
  | 'OPERATIONS'
  | 'COMBAT'
  | 'NARRATIVE'
  | 'ECONOMY'
  | 'ENDGAME';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('BOOT');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [selectedSectorId, setSelectedSectorId] = useState<number>(4);
  const [terminalSettings, setTerminalSettings] = useState<ITerminalSettings>(() =>
    SettingsService.loadSettings()
  );

  // Prozeduraler Web-Soundtrack (Multi-Stem Lookahead Sequencer)
  const musicState: MusicState =
    currentView === 'COMBAT' ? 'COMBAT' : 'EXPLORATION';

  useWebSoundtrack(
    musicState,
    terminalSettings.audio.isMuted || currentView === 'BOOT'
  );

  // Global keyboard shortcut listener (ESC, Shift+D for Telemetry, F12 for QA)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + D toggles In-Browser Engine Telemetry Overlay
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsTelemetryOpen((prev) => !prev);
        return;
      }

      // ESC closes open modals
      if (e.key === 'Escape') {
        if (isQaModalOpen) {
          setIsQaModalOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isTelemetryOpen) {
          setIsTelemetryOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isQaModalOpen, isTelemetryOpen]);

  const activeTheme = THEME_COLORS[terminalSettings.display.colorTheme] || THEME_COLORS.CYAN;

  return (
    <div
      className="relative w-screen h-screen bg-[#070a0e] text-[#d8e2dc] font-mono overflow-hidden transition-all duration-300"
      style={{
        transform: terminalSettings.display.isCurvatureEnabled
          ? 'perspective(1200px) rotateX(1deg)'
          : 'none',
        filter: terminalSettings.display.highContrast ? 'contrast(1.25)' : 'none',
      }}
    >
      {/* Global Phosphor Glow filter container */}
      <style>{`
        :root {
          --phosphor-primary: ${activeTheme.primary};
          --phosphor-glow: ${activeTheme.glow};
        }
        .phosphor-glow {
          text-shadow: 0 0 ${terminalSettings.display.bloomIntensity * 10}px ${activeTheme.glow};
        }
      `}</style>

      {/* Global CRT Scanline Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 transition-opacity duration-200"
        style={{
          opacity: terminalSettings.display.crtScanlineOpacity,
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* View Router */}
      {currentView === 'BOOT' && (
        <BootSequence
          onBootComplete={() => {
            setCurrentView('HOME');
          }}
        />
      )}

      {currentView === 'HOME' && (
        <HomeScreen
          onOpenSettings={() => {
            setIsSettingsOpen(true);
          }}
          onOpenArsenal={() => {
            setCurrentView('ARSENAL');
          }}
          onOpenComms={() => {
            setCurrentView('NARRATIVE');
          }}
          onOpenEconomy={() => {
            setCurrentView('ECONOMY');
          }}
          onOpenEndgame={() => {
            setCurrentView('ENDGAME');
          }}
          onOpenQaModal={() => {
            setIsQaModalOpen(true);
          }}
          onStartDeployment={(sectorId) => {
            setSelectedSectorId(sectorId);
            setCurrentView('OPERATIONS');
          }}
        />
      )}

      {currentView === 'OPERATIONS' && (
        <OperationsHub
          sectorId={selectedSectorId}
          sectorName={
            SECTOR_NODES.find((s) => s.id === selectedSectorId)?.name || 'SEKTOR 04: REAKTOR-BRUCH'
          }
          onBackToDeck={() => {
            setCurrentView('HOME');
          }}
          onLaunchMission={(params) => {
            console.log('Mission launched:', params);
            setCurrentView('COMBAT');
          }}
        />
      )}

      {currentView === 'COMBAT' && (
        <CombatHUD
          sectorName={
            SECTOR_NODES.find((s) => s.id === selectedSectorId)?.name || 'SEKTOR 04: REAKTOR-BRUCH'
          }
          threatLevel={2}
          onExitCombat={() => {
            setCurrentView('NARRATIVE');
          }}
        />
      )}

      {currentView === 'NARRATIVE' && (
        <NarrativeTerminal
          sectorName={
            SECTOR_NODES.find((s) => s.id === selectedSectorId)?.name || 'SEKTOR 04: REAKTOR-BRUCH'
          }
          onCloseComms={() => {
            setCurrentView('HOME');
          }}
        />
      )}

      {currentView === 'ARSENAL' && (
        <ArsenalWorkshop
          onBackToDeck={() => {
            setCurrentView('HOME');
          }}
        />
      )}

      {currentView === 'ECONOMY' && (
        <EconomyExchange
          sectorThreatLevel={2}
          onBackToDeck={() => {
            setCurrentView('HOME');
          }}
        />
      )}

      {currentView === 'ENDGAME' && (
        <EndgameTerminal
          playerLevel={20}
          onBackToDeck={() => {
            setCurrentView('HOME');
          }}
        />
      )}

      {/* Settings Modal (Overlay over Home Screen or accessible anytime) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsChanged={(newSettings) => {
          setTerminalSettings(newSettings);
        }}
      />

      {/* In-Browser Engine Telemetry Overlay (Shift + D) */}
      <EngineTelemetryOverlay
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        audioCtx={ProceduralAudioEngine.getInstance().ctx}
      />

      {/* QA Diagnostic Kernel & Launch Checklist Modal */}
      <QaAuditModal
        isOpen={isQaModalOpen}
        onClose={() => setIsQaModalOpen(false)}
      />
    </div>
  );
}
