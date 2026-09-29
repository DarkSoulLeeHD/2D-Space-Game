import React, { useState, useEffect, useCallback } from 'react';
import { ISectorNode } from '../types/game';
import { useGameStorage, getStorageUsageKb } from '../services/storageService';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { RadarViewport, SECTOR_NODES } from './RadarViewport';
import { supabase, CloudPersistenceService, ICloudProfile } from '../services/supabaseClient';
import { NeuralLoginModal } from './NeuralLoginModal';

interface HomeScreenProps {
  onOpenSettings: () => void;
  onOpenArsenal?: () => void;
  onOpenComms?: () => void;
  onOpenEconomy?: () => void;
  onOpenEndgame?: () => void;
  onOpenQaModal?: () => void;
  onOpenTelemetry?: () => void;
  onStartDeployment?: (sectorId: number) => void;
}

type ActiveModal = 'NONE' | 'DEPLOYMENT' | 'INTEL' | 'ARSENAL' | 'RESET_CONFIRM';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenSettings,
  onOpenArsenal,
  onOpenComms,
  onOpenEconomy,
  onOpenEndgame,
  onOpenQaModal,
  onOpenTelemetry,
  onStartDeployment,
}) => {
  const { player, updatePlayer, loadCloudProfile, resetSave, exportSave } = useGameStorage();
  const [selectedSector, setSelectedSector] = useState<ISectorNode>(() => {
    return SECTOR_NODES.find((s) => s.id === 4) || SECTOR_NODES[0];
  });
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cloudUserEmail, setCloudUserEmail] = useState<string | null>(null);
  const [cloudCallsign, setCloudCallsign] = useState<string>('');
  const [isTransitioningSettings, setIsTransitioningSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const audio = ProceduralAudioEngine.getInstance();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Check Supabase session & cloud profile on mount and subscribe to changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCloudUserEmail(data.session.user.email || 'USER');
        CloudPersistenceService.setCurrentUser(data.session.user);
        CloudPersistenceService.fetchProfile(data.session.user.id).then((profile) => {
          if (profile) {
            setCloudCallsign(profile.callsign || 'Vance');
            loadCloudProfile(profile);
          }
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCloudUserEmail(session.user.email || 'USER');
        CloudPersistenceService.setCurrentUser(session.user);
        CloudPersistenceService.fetchProfile(session.user.id).then((profile) => {
          if (profile) {
            setCloudCallsign(profile.callsign || 'Vance');
            loadCloudProfile(profile);
          }
        });
      } else {
        setCloudUserEmail(null);
        setCloudCallsign('');
        CloudPersistenceService.setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Handle Command selection
  const handleExecuteCommand = useCallback(
    (commandId: number) => {
      audio.playSelectClick();

      switch (commandId) {
        case 1: // Deployment
          setActiveModal('DEPLOYMENT');
          break;
        case 2: // Intel / Gemini Feed
          setActiveModal('INTEL');
          break;
        case 3: // Arsenal / Status
          setActiveModal('ARSENAL');
          break;
        case 4: // Settings (Teil 3 Transition)
          setIsTransitioningSettings(true);
          setTimeout(() => {
            onOpenSettings();
          }, 220);
          break;
        case 5: // Reset Save
          setActiveModal('RESET_CONFIRM');
          break;
        case 6: // Economy Exchange (Börse & Forschung)
          if (onOpenEconomy) {
            onOpenEconomy();
          } else {
            showToast('ASTRAEA-BÖRSE INITIALISIERT');
          }
          break;
        case 7: // Endgame (Null-Zone & Apex-Raids)
          if (onOpenEndgame) {
            onOpenEndgame();
          } else {
            showToast('NULL-ZONEN-TERMINAL INITIALISIERT');
          }
          break;
        default:
          break;
      }
    },
    [audio, onOpenSettings, onOpenEconomy, onOpenEndgame]
  );

  // Keyboard Navigation: [1-7], [B], [N], Arrow Up/Down, Enter/Space, M
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal is active, let Escape close it
      if (isAuthModalOpen) {
        if (e.key === 'Escape') {
          setIsAuthModalOpen(false);
          audio.playUiClick();
        }
        return;
      }

      if (activeModal !== 'NONE') {
        if (e.key === 'Escape') {
          setActiveModal('NONE');
          audio.playUiClick();
        }
        return;
      }

      if (e.key === '1') handleExecuteCommand(1);
      else if (e.key === '2') handleExecuteCommand(2);
      else if (e.key === '3') handleExecuteCommand(3);
      else if (e.key === '4') handleExecuteCommand(4);
      else if (e.key === '5') handleExecuteCommand(5);
      else if (e.key === '6' || e.key.toLowerCase() === 'b') handleExecuteCommand(6);
      else if (e.key === '7' || e.key.toLowerCase() === 'n') handleExecuteCommand(7);
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev - 1 + 7) % 7;
          audio.playHoverPing();
          return next;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = (prev + 1) % 7;
          audio.playHoverPing();
          return next;
        });
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleExecuteCommand(focusedIndex + 1);
      } else if (e.key.toLowerCase() === 'm') {
        const muted = audio.toggleMute();
        setIsMuted(muted);
        showToast(muted ? 'AUDIO STUMMGESCHALTET' : 'AUDIO AKTIV');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, focusedIndex, handleExecuteCommand, audio]);

  const menuItems = [
    {
      id: 1,
      num: '[01]',
      title: 'EINSATZ STARTEN // DEPLOYMENT',
      subtitle: `Ziel: ${selectedSector.name} // Bedrohung: ${selectedSector.threatLevel}/5`,
      badge: 'BEREIT',
      badgeColor: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/50',
    },
    {
      id: 2,
      num: '[02]',
      title: 'TERMINAL-LOGS & INTEL (GEMINI-FEED)',
      subtitle: '3 unverschlüsselte Funksprüche aus Sektor 04 empfangen',
      badge: '3 NEU',
      badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    },
    {
      id: 3,
      num: '[03]',
      title: 'OPERATIVE-STATUS & ARSENAL',
      subtitle: `Rig-Integrität: ${player.rigIntegrity}% // Waffe: ${player.equippedWeapon.name}`,
      badge: `${player.nanites} TN`,
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-700/60',
    },
    {
      id: 4,
      num: '[04]',
      title: 'SYSTEM-PARAMETER & SCHNITTSTELLEN',
      subtitle: 'Audio-Synthesizer, CRT-Filter, Gemini-Key, Barrierefreiheit',
      badge: 'CONFIG',
      badgeColor: 'bg-slate-900 text-gray-300 border-slate-700/60',
    },
    {
      id: 5,
      num: '[05]',
      title: 'DATENBANK INITIALISIEREN (RESET)',
      subtitle: 'Lokalen Spielstand exportieren oder Kaltstart durchführen',
      badge: getStorageUsageKb(),
      badgeColor: 'bg-red-950/30 text-red-400 border-red-800/40',
    },
    {
      id: 6,
      num: '[06]',
      title: 'ASTRAEA-BÖRSE // HÄNDLER & FORSCHUNG',
      subtitle: 'Post-kapitalistischer Tauschhandel, Schwarzmarkt & permanente Klon-Matrix',
      badge: 'BÖRSE',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-700/60',
    },
    {
      id: 7,
      num: '[07]',
      title: 'NULL-ZONE // APEX-RAID & LIVE-OPS',
      subtitle: 'Dual-Grid Bifurkation (Vergangenheit & Zukunft), Mulberry32 PRNG & Kausalität',
      badge: 'ENDGAME',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-700/60',
    },
  ];

  return (
    <div className="relative w-screen h-screen bg-[#070a0e] text-[#d8e2dc] font-mono overflow-hidden select-none flex flex-col justify-between">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 right-6 z-50 bg-cyan-950/90 border border-cyan-400 px-4 py-2 text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,255,170,0.4)] animate-in fade-in slide-in-from-top-2">
          &gt; {notification}
        </div>
      )}

      {/* CRT Scanline Shader */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-35"
      />

      {/* ========================================================================= */}
      {/* TAKTISCHER HEADER: TELEMETRIE & SYSTEM-ZEIT */}
      {/* ========================================================================= */}
      <header className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/60 bg-[#070a0e]/95 text-xs text-cyan-300">
        <div className="flex items-center gap-3 sm:gap-6 truncate">
          <div
            onClick={(e) => {
              if (e.detail >= 3 && onOpenTelemetry) {
                onOpenTelemetry();
              }
            }}
            title="Dreifachklick oder Shift+D für Engine-Telemetrie"
            className="flex items-center gap-2 font-bold tracking-widest text-cyan-200 cursor-pointer hover:text-white transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] shadow-[0_0_8px_#00FFAA]" />
            ASTRAEA MODEL-7 TERMINAL
          </div>
          <span className="hidden md:inline text-cyan-400 font-semibold">KERNEL v9.4.2</span>
          <span className="hidden lg:inline text-cyan-300 font-medium">
            ZEIT: 2026-10-24 14:02 UTC
          </span>
        </div>

        {/* Player Currencies & Rig Telemetry */}
        <div className="flex items-center gap-2 sm:gap-5 text-[11px] sm:text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">CREDITS:</span>
            <span className="font-bold text-gray-100">{player.credits} AC</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">NANITEN:</span>
            <span className="font-bold text-[#00FFAA]">{player.nanites} TN</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">RIG:</span>
            <span className="font-bold text-cyan-200">{player.rigIntegrity}%</span>
          </div>

          {/* Cloud Sync / Neural Login Status Button */}
          <button
            onClick={() => {
              audio.playSelectClick();
              setIsAuthModalOpen(true);
            }}
            className={`px-2.5 py-1 border font-bold text-[10px] tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
              cloudUserEmail
                ? 'bg-cyan-950/70 border-cyan-400 text-[#00FFAA] shadow-[0_0_10px_rgba(0,255,170,0.3)]'
                : 'bg-black/60 border-cyan-700 text-cyan-300 hover:text-white hover:border-cyan-400'
            }`}
            title={cloudUserEmail ? `Neural-Link aktiv: ${cloudUserEmail}` : 'Neural-Login & Cloud-Sync'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                cloudUserEmail ? 'bg-[#00FFAA] shadow-[0_0_6px_#00FFAA]' : 'bg-cyan-500'
              }`}
            />
            <span>{cloudUserEmail ? `[CLOUD: ${(cloudCallsign || 'VANCE').toUpperCase()}]` : '[CLOUD-SYNC]'}</span>
          </button>

          {onOpenEconomy && (
            <button
              onClick={onOpenEconomy}
              className="px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 font-bold hover:bg-emerald-900 transition-colors cursor-pointer text-[10px] tracking-wider flex items-center gap-1"
            >
              <span>[B] BÖRSE &gt;</span>
            </button>
          )}

          {onOpenEndgame && (
            <button
              onClick={onOpenEndgame}
              className="px-2.5 py-1 bg-amber-950/70 border border-amber-500/70 text-amber-300 font-bold hover:bg-amber-900 transition-colors cursor-pointer text-[10px] tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
            >
              <span>[N] NULL-ZONE &gt;</span>
            </button>
          )}

          {onOpenQaModal && (
            <button
              onClick={onOpenQaModal}
              title="Astraea Model-7 POST-Audit & Day-Zero Checkliste (Shift+D für Telemetrie)"
              className="px-2.5 py-1 bg-cyan-950/70 border border-[#00FFAA]/70 text-[#00FFAA] font-bold hover:bg-cyan-900 transition-colors cursor-pointer text-[10px] tracking-wider flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,170,0.25)]"
            >
              <span>[QA-AUDIT]</span>
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HAUPT-DECK: SPLIT-LAYOUT (ZONE A: RADAR // ZONE B: BEFEHLS-DECK) */}
      {/* ========================================================================= */}
      <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* ZONE A: SEKTOR-RADAR VIEWPORT & DIAGNOSE (LINKS // 7 SPALTEN) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-7 relative flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-900/60 bg-[#06090d]/90 overflow-hidden">
          {/* Radar Canvas Viewport */}
          <div className="relative flex-1 w-full min-h-[300px]">
            <RadarViewport
              selectedSectorId={selectedSector.id}
              onSelectSector={(sector) => {
                setSelectedSector(sector);
                showToast(`SEKTOR GEWÄHLT: ${sector.name}`);
              }}
              dimmed={isTransitioningSettings}
            />
          </div>

          {/* Sektor-Diagnose Dock */}
          <div className="h-32 sm:h-36 p-4 border-t border-cyan-900/60 bg-[#090d13] flex flex-col justify-between text-xs">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold tracking-widest text-[11px]">
                [SEKTOR-DIAGNOSE // {selectedSector.code}]
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold border ${
                  selectedSector.status === 'STABLE'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50'
                    : selectedSector.status === 'ALERT'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-red-950 text-red-300 border-red-500/50'
                }`}
              >
                STATUS: {selectedSector.status}
              </span>
            </div>

            <p className="text-slate-200 text-[11px] sm:text-xs leading-relaxed line-clamp-2">
              {selectedSector.description}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-950 text-[10px] text-cyan-300">
              <div>
                TEMP: <span className="text-gray-100 font-bold">{selectedSector.temperature}</span>
              </div>
              <div>
                GRAVITATION: <span className="text-gray-100 font-bold">{selectedSector.gravity}</span>
              </div>
              <div className="truncate">
                GEFAHR: <span className="text-amber-300 font-bold">STUFE {selectedSector.threatLevel}/5</span>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* ZONE B: BEFEHLS-DECK (HAUPTMENÜ // 5 SPALTEN) */}
        {/* ----------------------------------------------------------------------- */}
        <section
          className={`lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between bg-[#080c12]/95 overflow-y-auto transition-transform duration-200 ease-in-out ${
            isTransitioningSettings ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-900/60">
              <span className="text-xs text-cyan-300 tracking-[0.25em] font-bold">
                HAUPT-BEFEHLS-DECK
              </span>
              <span className="text-[10px] text-cyan-300 font-mono font-medium">
                TASTEN [1-5] ODER PFEILE
              </span>
            </div>

            {/* Menu Tiles */}
            <div className="space-y-3">
              {menuItems.map((item, idx) => {
                const isFocused = focusedIndex === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleExecuteCommand(item.id)}
                    onMouseEnter={() => {
                      setFocusedIndex(idx);
                      audio.playHoverPing();
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 bg-[#0d131a] border transition-all duration-150 group flex items-center justify-between font-mono relative overflow-hidden cursor-pointer ${
                      isFocused
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(0,255,170,0.2)]'
                        : 'border-cyan-800/60 hover:border-cyan-400 hover:bg-cyan-950/30'
                    }`}
                  >
                    {/* Cyanfarbener Indikator-Balken links bei Fokus/Hover */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 transition-opacity ${
                        isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    />

                    <div className="pr-2 truncate">
                      <div className="text-[10px] sm:text-xs text-cyan-300 tracking-widest font-bold">
                        BEFEHL {item.num}
                      </div>
                      <div
                        className={`text-sm sm:text-base font-bold tracking-wider truncate ${
                          isFocused ? 'text-cyan-200' : 'text-gray-100 group-hover:text-cyan-200'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">
                        {item.subtitle}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 border shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sektor-Status Info-Banner */}
          <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-900/60 text-[11px] text-cyan-400/80 flex items-center justify-between">
            <span>AKTIVER KNOTEN: <strong className="text-gray-200">{selectedSector.name}</strong></span>
            <button
              onClick={() => handleExecuteCommand(1)}
              className="px-2.5 py-1 bg-cyan-500 text-black font-bold text-[10px] hover:bg-white transition-colors"
            >
              INFILTRIEREN &gt;
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* MODAL OVERLAYS (DEPLOYMENT / INTEL / ARSENAL / RESET) */}
      {/* ========================================================================= */}
      {activeModal === 'DEPLOYMENT' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1017] border border-cyan-400 max-w-lg w-full p-6 shadow-[0_0_35px_rgba(0,255,170,0.3)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
              <span className="text-xs text-cyan-500 tracking-widest">[BEFEHL 01 // EINSATZ STARTEN]</span>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-gray-400 hover:text-white text-xs px-2 py-0.5 border border-cyan-800"
              >
                [ESC] SCHLIESSEN
              </button>
            </div>
            <h3 className="text-lg font-bold text-[#00FFAA]">{selectedSector.name}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{selectedSector.description}</p>
            <div className="p-3 bg-black/50 border border-cyan-900/80 text-xs space-y-1.5 text-cyan-300">
              <div>&bull; Ausgerüstete Waffe: <strong>{player.equippedWeapon.name} ({player.equippedWeapon.damage} DMG)</strong></div>
              <div>&bull; Munitions-Vorrat: <strong>{player.equippedWeapon.ammoCurrent} / {player.equippedWeapon.ammoMax}</strong></div>
              <div>&bull; Bedrohungs-Klasse: <strong className="text-amber-400">{selectedSector.threatLevel} von 5</strong></div>
              <div>&bull; Überlebenschance geschätzt: <strong className="text-[#00FFAA]">74.8%</strong></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  audio.playSelectClick();
                  setActiveModal('NONE');
                  if (onStartDeployment) onStartDeployment(selectedSector.id);
                  else showToast('EINSATZ INITIALISIERT (VORBEREITUNG FÜR TEIL 05/06)');
                }}
                className="flex-1 py-3 bg-[#00FFAA] text-black font-bold tracking-widest hover:bg-white transition-colors text-xs text-center"
              >
                [ &gt; ] DROP-POD STARTEN (DEPLOY)
              </button>
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-3 border border-cyan-800 text-gray-300 hover:text-white text-xs"
              >
                ABBRECHEN
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'INTEL' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1017] border border-cyan-400 max-w-xl w-full p-6 shadow-[0_0_35px_rgba(0,255,170,0.3)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
              <span className="text-xs text-amber-400 tracking-widest font-bold">
                [BEFEHL 02 // GEMINI-INTEL &amp; FUNK-LOGS]
              </span>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-gray-400 hover:text-white text-xs px-2 py-0.5 border border-cyan-800"
              >
                [ESC]
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900/60 space-y-1">
                <div className="flex justify-between text-[10px] text-cyan-500 font-bold">
                  <span>LOG-094 // AETHEL DIREKTIVE</span>
                  <span>VOR 18 MINUTEN</span>
                </div>
                <p className="text-gray-200">
                  &gt; &quot;Reaktor-Kern 04 meldet unregelmäßige Gravitationspulse. Alle Einheiten ohne Chrono-Dämpfer werden evakuiert.&quot;
                </p>
              </div>
              <div className="p-3 bg-black/50 border border-cyan-900/60 space-y-1">
                <div className="flex justify-between text-[10px] text-amber-400 font-bold">
                  <span>FUNKSPRUCH // WERKMEISTER TENG</span>
                  <span>UNVERSCHLÜSSELT</span>
                </div>
                <p className="text-gray-200">
                  &gt; &quot;Die Kriecher haben die Lüftungskanäle in Sektor 06 infiltriert. Schickt Verstärkung oder schottet das Deck ab!&quot;
                </p>
              </div>
              <div className="p-3 bg-black/50 border border-cyan-900/60 space-y-1">
                <div className="flex justify-between text-[10px] text-cyan-400 font-bold">
                  <span>SYSTEM-BERICHT // ASTRAEA KERNEL</span>
                  <span>DIAGNOSE</span>
                </div>
                <p className="text-gray-200">
                  &gt; &quot;Naniten-Schmiede auf Hangar 05 betriebsbereit. Modul-Synthesen autorisiert.&quot;
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {onOpenComms && (
                <button
                  onClick={() => {
                    setActiveModal('NONE');
                    onOpenComms();
                  }}
                  className="flex-1 py-2.5 bg-[#00FFAA] text-black hover:bg-white font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,170,0.3)] cursor-pointer"
                >
                  [KOMM-TERMINAL ÖFFNEN // LIVE-VERHÖR &gt;]
                </button>
              )}
              <button
                onClick={() => setActiveModal('NONE')}
                className="py-2.5 px-4 bg-cyan-950/60 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 font-bold text-xs cursor-pointer"
              >
                SCHLIESSEN [ESC]
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'ARSENAL' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1017] border border-cyan-400 max-w-lg w-full p-6 shadow-[0_0_35px_rgba(0,255,170,0.3)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-cyan-800 pb-2">
              <span className="text-xs text-cyan-400 tracking-widest font-bold">
                [BEFEHL 03 // OPERATIVE-STATUS &amp; ARSENAL]
              </span>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-gray-400 hover:text-white text-xs px-2 py-0.5 border border-cyan-800"
              >
                [ESC]
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900/60">
                <div className="text-cyan-500 text-[10px]">OPERATIVE</div>
                <div className="text-base font-bold text-gray-100">{player.callsign}</div>
                <div className="text-cyan-400 text-[11px]">STUFE {player.level} // VANGUARD</div>
              </div>
              <div className="p-3 bg-black/50 border border-cyan-900/60">
                <div className="text-cyan-500 text-[10px]">RIG-INTEGRITÄT</div>
                <div className="text-base font-bold text-[#00FFAA]">{player.rigIntegrity}%</div>
                <div className="text-gray-400 text-[11px]">KINETIK-SCHILD AKTIV</div>
              </div>
            </div>
            <div className="p-3 bg-black/50 border border-cyan-900/60 text-xs space-y-2">
              <div className="text-[10px] text-cyan-400 font-bold border-b border-cyan-950 pb-1">
                PRIMÄR-WAFFE: {player.equippedWeapon.name}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-300">
                <div>Kinetik-DPS: <strong className="text-white">{player.equippedWeapon.damage}</strong></div>
                <div>Magazin: <strong className="text-white">{player.equippedWeapon.ammoCurrent}/{player.equippedWeapon.ammoMax}</strong></div>
                <div>Feuerrate: <strong className="text-white">650 S/m</strong></div>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 bg-cyan-950/30 border border-cyan-800/40">
              <span className="text-cyan-400 font-bold">TITAN-NANITEN: {player.nanites} TN</span>
              <span className="text-amber-400 font-bold">CHRONO-KRISTALLE: {player.chronoCrystals} CK</span>
            </div>
            <button
              onClick={() => {
                setActiveModal('NONE');
                if (onOpenArsenal) {
                  onOpenArsenal();
                } else {
                  showToast('ARSENAL-WERKSTATT BEREIT (TEIL 04)');
                }
              }}
              className="w-full py-2.5 bg-[#00FFAA] text-black font-bold tracking-widest text-xs hover:bg-white transition-colors"
            >
              ZUR SCHMIEDE / MODIFIKATION (MODUL 04)
            </button>
          </div>
        </div>
      )}

      {activeModal === 'RESET_CONFIRM' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#120a0d] border border-red-500/80 max-w-md w-full p-6 shadow-[0_0_35px_rgba(224,122,95,0.3)] space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-red-900/60 pb-2">
              <span className="text-xs text-red-400 tracking-widest font-bold">
                [!] DATENKERN-VERWALTUNG
              </span>
              <button
                onClick={() => setActiveModal('NONE')}
                className="text-gray-400 hover:text-white text-xs px-2 py-0.5 border border-red-800"
              >
                [ESC]
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Möchtest du den aktuellen Spielstand sichern oder den lokalen Speicher komplett auf Werkseinstellungen zurücksetzen?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  exportSave();
                  showToast('SPIELSTAND ERFOLGREICH EXPORTIERT (.JSON)');
                }}
                className="w-full py-2.5 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold text-xs hover:bg-cyan-500 hover:text-black transition-colors"
              >
                [ 1 ] SPIELSTAND EXPORTIEREN (.JSON HERUNTERLADEN)
              </button>
              <button
                onClick={() => {
                  resetSave();
                  showToast('LOKALER SPEICHER BEREINIGT // KALTSTART INITIALISIERT');
                  setActiveModal('NONE');
                }}
                className="w-full py-2.5 bg-red-950/60 border border-red-500 text-red-300 font-bold text-xs hover:bg-red-600 hover:text-white transition-colors"
              >
                [ 2 ] WERKS-RESET DURCHFÜHREN (ALLES LÖSCHEN)
              </button>
            </div>
            <button
              onClick={() => setActiveModal('NONE')}
              className="w-full py-2 text-center text-xs text-gray-400 hover:text-white"
            >
              ABBRECHEN
            </button>
          </div>
        </div>
      )}

      {/* Neural Login & Cloud Sync Modal */}
      <NeuralLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        player={player}
        onProfileLoaded={(profile) => {
          loadCloudProfile(profile);
          setCloudCallsign(profile.callsign || 'Vance');
          showToast(`CLOUD-PROFIL AKTIV // ${profile.callsign.toUpperCase()}`);
        }}
      />

      {/* ========================================================================= */}
      {/* BOTTOM-DOCK: HARDWARE-STATUS & PROFIL-VALIDIERUNG */}
      {/* ========================================================================= */}
      <footer className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-t border-cyan-900/60 bg-[#070a0e]/95 text-[10px] sm:text-xs text-cyan-300">
        <div className="flex items-center gap-2 sm:gap-4 truncate">
          <span className="font-bold text-gray-100">STATUS: ONLINE</span>
          <span className="hidden sm:inline text-cyan-400">//</span>
          <span className="hidden md:inline text-cyan-200 font-medium">
            VERBINDUNG ZUM KERNEL HERGESTELLT
          </span>
          <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-700/60 text-[9px] font-bold">
            STORAGE: {getStorageUsageKb()}
          </span>
        </div>

        <div className="flex items-center gap-3 text-cyan-200 font-medium">
          <span className="hidden sm:inline font-mono">INPUT: [1-5] / TASTATUR / MAUS</span>
          <button
            onClick={() => {
              const muted = audio.toggleMute();
              setIsMuted(muted);
              showToast(muted ? 'AUDIO STUMM' : 'AUDIO AKTIV');
            }}
            className="px-2 py-0.5 border border-cyan-700 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-500 hover:text-black transition-colors font-bold"
          >
            {isMuted ? '[M: STUMM]' : '[M: AUDIO AN]'}
          </button>
        </div>
      </footer>
    </div>
  );
};
