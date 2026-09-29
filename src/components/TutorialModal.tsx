/**
 * CHRONO-STRATUM: PROTOCOL NULL
 * Operative Manual & Diegetisches Taktik-Tutorial (TutorialModal.tsx)
 * 
 * Umfassendes, interaktives Nachschlagewerk für alle Spielmechaniken,
 * Tastaturkürzel, Schadensberechnungen, Währungen, Biome und Features.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { InteractiveTutorialSimulator } from './InteractiveTutorialSimulator';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChapter?: number;
  initialMode?: 'MANUAL' | 'SIMULATOR';
}

interface ITutorialChapter {
  id: number;
  code: string;
  title: string;
  tag: string;
  summary: string;
  drillId: number;
  content: React.ReactNode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  initialChapter = 1,
  initialMode = 'MANUAL',
}) => {
  const [currentChapter, setCurrentChapter] = useState<number>(initialChapter);
  const [viewMode, setViewMode] = useState<'MANUAL' | 'SIMULATOR'>(initialMode);
  const [simulatorDrill, setSimulatorDrill] = useState<number>(1);
  const audio = ProceduralAudioEngine.getInstance();

  useEffect(() => {
    if (isOpen) {
      setCurrentChapter(initialChapter);
      setViewMode(initialMode);
    }
  }, [isOpen, initialChapter, initialMode]);

  const handleNextChapter = useCallback(() => {
    audio.playSelectClick();
    setCurrentChapter((prev) => Math.min(9, prev + 1));
  }, [audio]);

  const handlePrevChapter = useCallback(() => {
    audio.playSelectClick();
    setCurrentChapter((prev) => Math.max(1, prev - 1));
  }, [audio]);

  const handleSelectChapter = useCallback((chapterNum: number) => {
    audio.playUiClick();
    setCurrentChapter(chapterNum);
  }, [audio]);

  const handleLaunchDrill = useCallback((drillId: number) => {
    audio.playSelectClick();
    setSimulatorDrill(drillId);
    setViewMode('SIMULATOR');
  }, [audio]);

  // Keyboard navigation: ArrowLeft/A (prev), ArrowRight/D (next), Escape (close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // In MANUAL mode, allow left/right arrows or A/D to cycle chapters, and Escape to close
      if (viewMode === 'MANUAL') {
        if (e.key === 'Escape') {
          e.preventDefault();
          audio.playUiClick();
          onClose();
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          handleNextChapter();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          handlePrevChapter();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, viewMode, handleNextChapter, handlePrevChapter, audio]);

  if (!isOpen) return null;

  const chapters: ITutorialChapter[] = [
    // -------------------------------------------------------------------------
    // KAPITEL 1: KOMMANDO-DECK & STATIONS-RADAR
    // -------------------------------------------------------------------------
    {
      id: 1,
      code: 'MAN-01 // DECK',
      title: 'KOMMANDO-DECK & STATIONS-RADAR',
      tag: 'GRUNDLAGEN',
      summary: 'Stations-Topologie Stratum-09, Drei-Währungs-Ökonomie und Deck-Navigation.',
      drillId: 1,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Willkommen im Astraea Model-7 Terminal, Operative. Die Raumstation <strong className="text-cyan-300">Stratum-09</strong> treibt in einem anomalen Orbit um das Chrono-Phänomen. Ihre Aufgabe ist es, Sektoren zu infiltrieren, Kausalitätsbrüche zu stabilisieren und die Kriecher-Invasion abzuwehren.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              1.1 DREI-SÄULEN-WÄHRUNGSSYSTEM
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-black/60 border border-cyan-900/80 space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-100">
                  <span>CREDITS (AC)</span>
                  <span className="text-cyan-400">BASIS</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Standard-Stationswährung der Astraea-Direktion. Dient zum Kauf von Munition, Med-Stims und Handelswaren an der Börse.
                </p>
              </div>

              <div className="p-3 bg-black/60 border border-cyan-900/80 space-y-1">
                <div className="flex justify-between text-xs font-bold text-[#00FFAA]">
                  <span>TITAN-NANITEN (TN)</span>
                  <span className="text-[#00FFAA]">SCHMIEDE</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Mikro-Konstruktoren zur Modifikation von Waffen-Komponenten, Erhöhung des Overclock-Levels und Drohnen-Panzerung.
                </p>
              </div>

              <div className="p-3 bg-black/60 border border-cyan-900/80 space-y-1">
                <div className="flex justify-between text-xs font-bold text-amber-300">
                  <span>CHRONO-KRISTALLE (CK)</span>
                  <span className="text-amber-400">ENDGAME</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Hochenergetische Quanten-Relikte aus der Null-Zone. Werden für permanente Gen-Forschung und Klon-Resonanz benötigt.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              1.2 RIG-INTEGRITÄT & STATUS
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Die <strong className="text-cyan-200">Rig-Integrität (0% - 100%)</strong> spiegelt den physischen Zustand Ihres Exoskeletts wider. Bei 0% kollabiert die Klon-Hülle und das Kausalitäts-Protokoll initiiert eine Notfall-Rekonstruktion.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              1.3 HAUPTMENÜ-TASTENBELEGUNG (GLOBAL)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Einsatz starten:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 1 ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Intel & Funk-Logs:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 2 ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Operative & Arsenal:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 3 ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">System-Parameter:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 4 ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Savegame Reset:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 5 ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Astraea-Börse:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 6 / B ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Null-Zone Apex-Raid:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">[ 7 / N ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Handbuch / Tutorial:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-amber-300 border border-amber-600 font-bold">[ T ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Audio Mute Toggle:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold">[ M ]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Engine-Telemetrie:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold">[Shift+D]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Menü-Navigation:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-cyan-200 border border-cyan-700 font-bold">[▲ / ▼ / ENTER]</kbd>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900 flex justify-between items-center">
                <span className="text-slate-300">Fenster Schließen:</span>
                <kbd className="px-2 py-0.5 bg-cyan-950 text-red-400 border border-red-700 font-bold">[ ESC ]</kbd>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 2: ARSENAL & MODULARE SCHMIEDE
    // -------------------------------------------------------------------------
    {
      id: 2,
      code: 'MAN-02 // WEAPON',
      title: 'ARSENAL & MODULARE SCHMIEDE',
      tag: 'SCHMIEDE',
      summary: '5 Modul-Sockel, CAD-Vektor-Vorschau, Naniten-Overclocking & Drohnen-Setup.',
      drillId: 2,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            In der Waffen-Werkstatt (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[3]</kbd>) passen Sie Ihre Primärwaffe über fünf modulare Sockel an. Jedes Modul verändert physikalische Attribute wie Mündungsgeschwindigkeit, Magazinkapazität, Nachlade-AP und Streuung.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              2.1 DIE FÜNF WAFFEN-SOCKEL
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#00FFAA] font-bold">[LAUF / BARREL]:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Modifiziert Kinetik-Reichweite und Streuungs-Kegel. Ein gezogener Lauf erhöht die Trefferchance auf Distanz (+18%), erfordert jedoch präzise Sichtlinie.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-1 border border-cyan-800 shrink-0 font-medium">SOCKEL 1</span>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#00FFAA] font-bold">[MAGAZIN / AMMO-DRUM]:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Bestimmt die Patronen-Kapazität (Standard 36 Schuss, 6 Schuss pro Salve). Erweiterte Trommeln senken die Nachlade-Frequenz im Gefecht.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-1 border border-cyan-800 shrink-0 font-medium">SOCKEL 2</span>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#00FFAA] font-bold">[VISIER / OPTICS]:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Holo-Visier vs. Kausal-Linse. Gewährt kritische Trefferchance (+15% Crit) und durchdringt Rauch sowie thermische Verzerrungen.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-1 border border-cyan-800 shrink-0 font-medium">SOCKEL 3</span>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#00FFAA] font-bold">[SCHAFT / STOCK]:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Rückstoß-Kompensation. Essentiell bei Einsätzen in 0.0G Vakuum-Außenhüllen, um Rückstoß-Drift nach Salven zu verhindern.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-1 border border-cyan-800 shrink-0 font-medium">SOCKEL 4</span>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[#00FFAA] font-bold">[RESONATOR]:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Verleiht Projektilen Quanten-Effekte: Phasen-Verschiebung durch halbe Deckung oder Bonus-Schaden gegen synthetische Praetor-Schilde.
                  </p>
                </div>
                <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-1 border border-cyan-800 shrink-0 font-medium">SOCKEL 5</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              2.2 NANITEN-OVERCLOCKING & DROHNEN-LINK
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Investieren Sie gesammelte <strong className="text-[#00FFAA]">Titan-Naniten (TN)</strong>, um die Waffe über ihr Werkslimit hinaus zu übertakten. Jeder Overclock-Rang steigert den Grundschaden um +8% und erhöht die Nachladegeschwindigkeit. Ihre Begleitdrohne <strong className="text-cyan-300">SCARAB-IV</strong> kann im Gefecht für 1 AP eingesetzt werden, um Ihren Kinetik-Schild um +25 MJ aufzuladen.
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 3: EINSATZ-ZENTRALE & SEKTOR-TOPOLOGIE
    // -------------------------------------------------------------------------
    {
      id: 3,
      code: 'MAN-03 // SECTOR',
      title: 'EINSATZ-ZENTRALE & SEKTOR-TOPOLOGIE',
      tag: 'STRATEGIE',
      summary: 'Verzweigter DAG-Knotengraph, Pfadwahl, Bedrohungsstufen I-V & Affixe.',
      drillId: 1,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Die Operations-Zentrale (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[1]</kbd>) visualisiert die Raumstation als gerichteten zyklenfreien Graphen (DAG). Jeder Vorstoß zwingt Sie zu strategischen Pfadentscheidungen zwischen Rohstoff-Sektoren und feindlichen Abfangzonen.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              3.1 BEDROHUNGSSTUFEN (THREAT LEVELS)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900 space-y-1">
                <div className="text-cyan-400 font-bold">STUFE I - II // SICHER & INSTABIL</div>
                <p className="text-[11px] text-slate-300">
                  Leichte Feindpräsenz (vorwiegend Chrono-Kriecher). Ideal zum Sammeln von Credits und Erproben neuer Waffenmodule.
                </p>
              </div>

              <div className="p-3 bg-black/50 border border-amber-900/60 space-y-1">
                <div className="text-amber-400 font-bold">STUFE III - IV // ALARM & KRITISCH</div>
                <p className="text-[11px] text-slate-300">
                  Gepanzerte Praetor-Mechs mit Fernkampf-Sperrfeuer. Hohe Beute an Titan-Naniten (+150%), aber erhöhtes Risiko für Schildbruch.
                </p>
              </div>

              <div className="p-3 bg-black/50 border border-red-900/60 sm:col-span-2 space-y-1">
                <div className="text-red-400 font-bold">STUFE V // PROTOKOLL NULL (APEX-HAZARD)</div>
                <p className="text-[11px] text-slate-300">
                  Präsenz von Boss-Wächtern wie <strong className="text-white">Apex-Wächter Nilus</strong>. Zeit-Bifurkationen, Bodenkollaps und tödliche Strahlungsmuster. Maximale Belohnungen an Chrono-Kristallen.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              3.2 SEKTOR-AFFIXE & GEMINI-BRIEFINGS
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jeder Sektor wird von dynamischen Umwelt-Affixen beeinflusst (z.B. <strong className="text-cyan-300">Kühlmittel-Leck</strong>, <strong className="text-amber-300">Gravitations-Umkehr</strong> oder <strong className="text-red-400">Strahlungs-Inversion</strong>). Das Terminal generiert vor jedem Sprung via Gemini Flash Live-Aufklärungsberichte, die Schwachstellen feindlicher Einheiten offenlegen.
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 4: GRID-KAMPF & AP-SYSTEM
    // -------------------------------------------------------------------------
    {
      id: 4,
      code: 'MAN-04 // TACTICS',
      title: 'GRID-KAMPF & AP-SYSTEM',
      tag: 'KAMPF',
      summary: '10x10 Kampffeld, 6 Aktionspunkte, Bewegung, Schuss & Deckungs-Dynamik.',
      drillId: 3,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Kämpfe finden auf einem <strong className="text-[#00FFAA]">10x10 Taktik-Raster</strong> statt. Operative Vance verfügt über ein Kontingent von <strong className="text-[#00FFAA]">6 Aktionspunkten (AP)</strong> pro Runde. Jede Aktion verbraucht AP und verändert die taktische Lage vor der Feind-Phase.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              4.1 DIE SECHS KAMPF-AKTIONEN
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[1] BEWEGUNG (MOVE)</span>
                  <span className="text-slate-300 text-[11px] block">Verlegt Vance bis zu 3 Kacheln weit. Manhattan-Distanz ohne Diagonalen.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">1 AP</span>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[2] ANGRIFF (ATTACK)</span>
                  <span className="text-slate-300 text-[11px] block">Feuert eine 6-Schuss Salve mit Primärwaffe. Berechnet Deckung und Distanz.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">2 AP</span>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[3] CHRONO-DASH (DASH)</span>
                  <span className="text-slate-300 text-[11px] block">2-Kachel Quanten-Teleportation über Hindernisse hinweg. Erhöht Entropie um +15%.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">1 AP</span>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[4] DROHNEN-SCHILD (DRONE)</span>
                  <span className="text-slate-300 text-[11px] block">Scarab-IV verbindet sich via Mikrowelle und stellt +25 MJ Kinetik-Schild wieder her.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">1 AP</span>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[R] TAKTIK-NACHLADEN (RELOAD)</span>
                  <span className="text-slate-300 text-[11px] block">Füllt das Magazin vollständig auf 36 Schuss Munition auf.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">1 AP</span>
              </div>

              <div className="p-2.5 bg-black/50 border border-cyan-900 flex justify-between items-center">
                <div>
                  <span className="text-[#00FFAA] font-bold">[H] MED-STIM INJEKTION</span>
                  <span className="text-slate-300 text-[11px] block">Heilt +35 HP und baut -10% Entropie ab. Maximal 3 Injektionen pro Einsatz.</span>
                </div>
                <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-1 border border-cyan-800">1 AP</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              4.2 DECKUNGSSYSTEM & SICHTLINIEN (LOS)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900 space-y-1">
                <span className="text-cyan-300 font-bold">HALBE DECKUNG (COVER_HALF):</span>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Gewährt Schutz hinter Kisten und Barrikaden. Senkt die gegnerische Trefferwahrscheinlichkeit um <strong className="text-white">-25%</strong> und absorbiert einen Teil des Salvenschadens.
                </p>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 space-y-1">
                <span className="text-[#00FFAA] font-bold">VOLLE DECKUNG (WALL_FULL):</span>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Massive Stations-Stahlwände. Blockieren Sichtlinien und ballistische Flugbahnen zu <strong className="text-white">100%</strong>. Weder Sie noch der Feind können durch massive Wände feuern.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 5: SCHADEN, RÜSTUNG & DIE CHRONO-PARADE
    // -------------------------------------------------------------------------
    {
      id: 5,
      code: 'MAN-05 // PARRY',
      title: 'SCHADEN, RÜSTUNG & DIE CHRONO-PARADE',
      tag: 'QTE-SYSTEM',
      summary: 'Schild-Schadensabsorption, Rüstungsabzug & das 160ms QTE-Reaktionsfenster.',
      drillId: 5,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Das Schadensmodell von Chrono-Stratum basiert auf drei Schutzschichten: <strong className="text-[#00FFAA]">Kinetischer Schild</strong>, <strong className="text-cyan-300">Exoskelett-Rüstung</strong> und physische <strong className="text-white">Hitpoints (HP)</strong>. Bei direkten Feindangriffen entscheidet die <strong className="text-amber-300">Chrono-Parade</strong> über Leben und Tod.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              5.1 SCHADENS-KASKADE
            </h4>
            <div className="p-3 bg-black/60 border border-cyan-900/80 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] font-bold border border-cyan-700">1. SCHICHT</span>
                <span className="text-slate-200"><strong>Kinetik-Schild:</strong> Fängt 100% des Schadens ab, bis seine MJ-Kapazität erschöpft ist.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 font-bold border border-cyan-700">2. SCHICHT</span>
                <span className="text-slate-200"><strong>Rüstung (Armor):</strong> Zieht einen festen Wert vom durchdringenden Schaden ab.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-950 text-red-400 font-bold border border-red-700">3. SCHICHT</span>
                <span className="text-slate-200"><strong>HP-Pool:</strong> Verbleibender Schaden reduziert die Gesundheit. Bei 0 HP ist der Run verloren.</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-amber-300 uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              5.2 DIE CHRONO-PARADE (160ms SWEET-SPOT)
            </h4>
            <div className="p-4 bg-amber-950/20 border border-amber-500/60 rounded-xs space-y-3 text-xs">
              <p className="text-slate-200 leading-relaxed">
                Sobald ein Feind (z.B. Kriecher oder Boss) in der Feind-Phase einen direkten Angriff auf Vance ausführt, friert die Engine in <strong className="text-amber-300">Chrono-Stasis</strong> ein. Ein 1,2 Sekunden langes Quick-Time-Event (QTE) startet:
              </p>
              
              <div className="p-3 bg-black/70 border border-cyan-800 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-300">TASTE:</span>
                  <span className="text-[#00FFAA]">[LEERTASTE] / [ENTER] / MAUSKLICK</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-300">SWEET-SPOT BEREICH:</span>
                  <span className="text-amber-300">60% BIS 76% DER TIMING-LEISTE (160ms)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/60 text-slate-200">
                  <span className="text-emerald-400 font-bold block mb-1">&gt;&gt; PERFEKTE PARADE:</span>
                  0 HP Schaden erlitten, Angreifer geblendet, und Sie erhalten <strong className="text-[#00FFAA]">+1 Bonus-AP (insgesamt 7 AP)</strong> für Ihre nächste Runde!
                </div>
                <div className="p-2.5 bg-red-950/40 border border-red-600/60 text-slate-200">
                  <span className="text-red-400 font-bold block mb-1">&gt;&gt; PARADE VERFEHLT:</span>
                  Der volle Salvenschaden schlägt in Schilde und Rüstung ein. Bei zu frühem oder zu spätem Auslösen verfällt das Parade-Fenster.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 6: FEIND-KI & TELEGRAFIERTE INTENTS
    // -------------------------------------------------------------------------
    {
      id: 6,
      code: 'MAN-06 // ENEMIES',
      title: 'FEIND-KI & TELEGRAFIERTE INTENTS',
      tag: 'TAKTIK',
      summary: 'Rote Absichts-Vektoren, A*-Flankierung & Feind-Archetypen.',
      drillId: 4,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Das Gefechts-Leitsystem AICR berechnet die Absichten aller feindlichen Einheiten im Voraus. Nutzen Sie die <strong className="text-red-400">telegrafierten roten Vektoren</strong>, um sich vor dem Rundenabschluss (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[LEERTASTE]</kbd>) in sichere Deckung zu bringen.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              6.1 DIE FEINDLICHEN ARCHETYPEN
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-black/50 border border-cyan-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-amber-400 font-bold">CHRONO-KRIECHER (CREEPER)</span>
                  <span className="text-[10px] bg-amber-950 px-2 py-0.5 border border-amber-700 text-amber-300">NAHKAMPF</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Biomorph-mutierte Stationsinsassen. Bewegen sich bis zu 3 Kacheln und greifen mit Kinetik-Klauen (24 DMG) an. Haben keine Schilde, sind aber extrem agil und versuchen Sie aus der Deckung zu treiben.
                </p>
              </div>

              <div className="p-3 bg-black/50 border border-cyan-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sky-400 font-bold">PRAETOR-MECH (PRAETOR)</span>
                  <span className="text-[10px] bg-sky-950 px-2 py-0.5 border border-sky-700 text-sky-300">FERNKAMPF</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Schwere autonome Wachdrohnen mit Kinetik-Schilden (30-50 MJ) und Panzerung (4 Rüstung). Schießen über Distanzen von bis zu 6 Kacheln mit Impuls-Sperrfeuer (18 DMG). Halbe Deckung ist Pflicht!
                </p>
              </div>

              <div className="p-3 bg-black/50 border border-red-900 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-red-400 font-bold">APEX-WÄCHTER NILUS (BOSS)</span>
                  <span className="text-[10px] bg-red-950 px-2 py-0.5 border border-red-700 text-red-300">MEHRPHASIG</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Kybernetischer Zenturio der Null-Zone. Besitzt 3 Kampfphasen: Spawnt in Phase 2 Zeit-Echos (<strong className="text-purple-400">Nilus-Klone</strong>) und reißt in Phase 3 Bodenkacheln in das Vakuum (<strong className="text-red-400">Gravitations-Kollaps</strong>).
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              6.2 INTENT-VORHERSAGE LESEN
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Feinde zeigen über ihren Einheiten Symbole für <strong className="text-red-400">ANGRIFF</strong> (Schadens-Vorschau) oder <strong className="text-cyan-300">FLANKIERUNG</strong>. Ein roter Zielvektor zeigt direkt auf die Kachel, die am Ende der Runde beschossen wird. Nutzen Sie Ihren <strong className="text-[#00FFAA]">Chrono-Dash ([3])</strong>, um dem Vektor zu entkommen!
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 7: BIOME, GEFAHREN & KAUSALITÄTS-REWIND
    // -------------------------------------------------------------------------
    {
      id: 7,
      code: 'MAN-07 // HAZARDS',
      title: 'BIOME, GEFAHREN & KAUSALITÄTS-REWIND',
      tag: 'UMWELT',
      summary: 'Strahlung, Vakuum-Brüche, 0.0G vs. 1.0G Physik & Entropie-Balken.',
      drillId: 3,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Nicht nur Feinde sind tödlich – die Raumstation selbst bricht auseinander. Strahlungslecks kontaminieren das Kampfraster, während Mikrometeoriten Löcher in die Außenhülle reißen.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              7.1 KACHEL-GEFAHREN AUF DEM GRID
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-red-950/20 border border-red-800/60 space-y-1">
                <span className="text-red-400 font-bold">STRAHLUNG (HAZARD_RADIATION):</span>
                <p className="text-[11px] text-slate-300">
                  Grün-leuchtende Kontaminations-Kacheln. Das Betreten verursacht sofort <strong className="text-red-400">-10 HP</strong> Strahlungsschaden und umgeht Schilde!
                </p>
              </div>

              <div className="p-3 bg-purple-950/20 border border-purple-800/60 space-y-1">
                <span className="text-purple-300 font-bold">VAKUUM-BRUCH (HAZARD_VOID):</span>
                <p className="text-[11px] text-slate-300">
                  Kacheln, die durch Boss-Attacken oder Dekompression ins All gerissen wurden. Vollständig unpassierbar für Vance und Mechs.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              7.2 ENTROPIE-PEEGEL & NOTFALL-STIMS
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jeder Quantensprung (<strong className="text-[#00FFAA]">Chrono-Dash</strong>) erhöht Ihre lokale Zeit-Entropie um <strong className="text-amber-400">+15%</strong>. Steigt die Entropie zu hoch, drohen Kausalitäts-Verzerrungen und erhöhte Feindspawns. Verwenden Sie Med-Stims (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[H]</kbd>), um die Entropie um <strong className="text-emerald-400">-10%</strong> zu senken und 35 HP zu heilen.
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 8: BÖRSE, ARTEFAKT-FORSCHUNG & DUAL-GRID
    // -------------------------------------------------------------------------
    {
      id: 8,
      code: 'MAN-08 // ECONOMY',
      title: 'BÖRSE, ARTEFAKT-FORSCHUNG & DUAL-GRID',
      tag: 'PROGRESSION',
      summary: '4 Händler, Mystery-Kisten mit Pity-System, 12-Knoten Forschungsbaum & Dual-Grid.',
      drillId: 6,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Das Endgame von Chrono-Stratum kombiniert post-kapitalistischen Schwarzmarkt-Handel (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[6 / B]</kbd>) mit permanenter Gen-Forschung und synchronen Dual-Grid Raids in der Null-Zone (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[7 / N]</kbd>).
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              8.1 DIE VIER HÄNDLER & PITY-KISTEN
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-black/50 border border-cyan-900">
                <span className="text-cyan-300 font-bold block">1. AETHEL-TECH AG:</span>
                <span className="text-[11px] text-slate-300">Offizielle Waffenmodule, Munitionskisten und Rüstungsplatten.</span>
              </div>
              <div className="p-2.5 bg-black/50 border border-cyan-900">
                <span className="text-amber-300 font-bold block">2. SCHROTTHÄNDLER TENG:</span>
                <span className="text-[11px] text-slate-300">Günstige Alt-Module und Rohstoff-Tausch gegen Titan-Naniten.</span>
              </div>
              <div className="p-2.5 bg-black/50 border border-cyan-900">
                <span className="text-purple-300 font-bold block">3. SCHWARZMARKT-KORRIDOR:</span>
                <span className="text-[11px] text-slate-300">Verbotene Prototypen mit extremen Stat-Boosts und hohem Entropie-Risiko.</span>
              </div>
              <div className="p-2.5 bg-black/50 border border-cyan-900">
                <span className="text-red-400 font-bold block">4. VOID-SYNDIKAT:</span>
                <span className="text-[11px] text-slate-300">Handelt ausschließlich gegen Chrono-Kristalle für seltene Kosmetika.</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 pt-1">
              <strong>Pity-System:</strong> Mystery-Kisten garantieren nach spätestens 10 Ziehungen ein Episches oder Legendäres Modul.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              8.2 PERMANENTER 12-KNOTEN-FORSCHUNGSBAUM
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Im interaktiven Vektor-Forschungsbaum schalten Sie permanente Boni frei (z.B. <strong className="text-[#00FFAA]">+20% Schildkapazität</strong>, <strong className="text-cyan-300">+1 Bewegungstempo</strong> oder <strong className="text-amber-300">Bonus-Credits</strong>). Diese Upgrades bleiben auch nach einem Klon-Reset dauerhaft erhalten.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              8.3 SYNCHRONER DUAL-GRID APEX-RAID
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              In der Null-Zone kontrollieren Sie zwei Zeitebenen parallel: <strong className="text-[#00FFAA]">Vergangenheit (Vance)</strong> und <strong className="text-purple-400">Zukunft (Scarab-Drohne)</strong>. Aktionen in der Vergangenheit schalten Schotts und Terminals in der Zukunft frei!
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 9: GEMINI-KI, SETTINGS & SUPABASE CLOUD-SYNC
    // -------------------------------------------------------------------------
    {
      id: 9,
      code: 'MAN-09 // SYSTEM',
      title: 'GEMINI-KI, SETTINGS & SUPABASE CLOUD-SYNC',
      tag: 'SYSTEM',
      summary: 'Gemini Live-Dialoge, Audio-Synthese, In-Browser Telemetrie & Cloud-Speicherung.',
      drillId: 7,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/80 rounded-xs text-xs leading-relaxed text-slate-200">
            Chrono-Stratum nutzt modernste Browser-Technologien: Einen prozeduralen Web Audio FM/AM-Synthesizer, Gemini 2.0 Flash für diegetische Funksprüche und Supabase für cloud-synchronisierte Spielstände.
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              9.1 GEMINI FLASH AI INTEGRATION
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Im Kommunikations-Terminal (<kbd className="px-1.5 py-0.5 bg-black border border-cyan-700 text-[#00FFAA]">[2]</kbd>) verhören Sie Fraktions-Leader wie Direktorin <strong className="text-cyan-300">Vesper Chen</strong> oder Werkmeister <strong className="text-amber-300">Kaelen Voss</strong> in Echtzeit. Die KI reagiert dynamisch auf Ihre Sektor-Erfolge und Waffenwahl.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              9.2 IN-BROWSER ENGINE-TELEMETRIE (SHIFT + D)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Drücken Sie jederzeit <kbd className="px-2 py-0.5 bg-cyan-950 text-[#00FFAA] border border-cyan-700 font-bold">Shift + D</kbd> für die Live-Diagnose: Echtzeit-Oszilloskop des 48.000 Hz Web-Soundtracks, Frame-Renderzeiten, WebGL-Drawcalls und Audio-Stems.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-[#00FFAA] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
              9.3 SUPABASE CLOUD-SYNC & SICHERHEIT (CWE-312)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Verknüpfen Sie Ihren Spielstand über den Button <strong className="text-[#00FFAA]">[CLOUD-SYNC]</strong> im Header. Ihre Credits, Naniten, Kristalle und Ihr Gemini API-Key werden verschlüsselt in Supabase gespeichert (Row Level Security). Für Gäste bleibt das Spiel zu 100% offline im localStorage spielbar.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const activeChap = chapters.find((c) => c.id === currentChapter) || chapters[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-mono select-none">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#070b10] border-2 border-[#00FFAA] shadow-[0_0_40px_rgba(0,255,170,0.35)] flex flex-col overflow-hidden text-cyan-300">
        {/* Phosphor CRT Scanline overlay for modal */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-35"
        />

        {/* ------------------------------------------------------------------- */}
        {/* MODAL HEADER */}
        {/* ------------------------------------------------------------------- */}
        <header className="relative z-30 min-h-14 px-3 sm:px-6 py-2 border-b border-cyan-900 bg-black/85 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#00FFAA] shadow-[0_0_8px_#00FFAA] animate-pulse" />
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white tracking-widest flex items-center gap-2">
                <span>OPERATIVE MANUAL // TAKTIK-HANDBUCH</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-cyan-950 border border-cyan-600 text-[#00FFAA]">
                  v9.4.2
                </span>
              </div>
              <div className="text-[10px] text-cyan-300 font-medium tracking-wider">
                {viewMode === 'MANUAL'
                  ? 'THEORIE- & DOKUMENTATIONS-PROTOKOLL'
                  : 'INTERAKTIVE GEFECHTS- & SYSTEM-SIMULATION'}
              </div>
            </div>
          </div>

          {/* VIEW MODE TOGGLE SWITCHER */}
          <div className="flex items-center bg-black/90 border border-cyan-800 p-0.5 rounded-xs shadow-inner">
            <button
              onClick={() => {
                audio.playSelectClick();
                setViewMode('MANUAL');
              }}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'MANUAL'
                  ? 'bg-[#00FFAA] text-black shadow-[0_0_12px_rgba(0,255,170,0.5)]'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/60'
              }`}
            >
              <span>📖 DOKUMENTATION & THEORIE</span>
            </button>
            <button
              onClick={() => {
                audio.playSelectClick();
                setSimulatorDrill(activeChap?.drillId || 1);
                setViewMode('SIMULATOR');
              }}
              className={`px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'SIMULATOR'
                  ? 'bg-[#00FFAA] text-black shadow-[0_0_12px_rgba(0,255,170,0.5)]'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>🎮 INTERAKTIVES TRAINING</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'MANUAL' && (
              <span className="hidden lg:inline text-xs text-amber-300 font-bold bg-amber-950/60 border border-amber-600/60 px-2.5 py-1">
                KAPITEL {currentChapter} / 9
              </span>
            )}
            <button
              onClick={() => {
                audio.playUiClick();
                onClose();
              }}
              className="px-3 py-1.5 bg-red-950/60 border border-red-600 text-red-300 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold cursor-pointer"
              title="Handbuch schließen [ESC]"
            >
              [ESC] SCHLIESSEN
            </button>
          </div>
        </header>

        {/* ------------------------------------------------------------------- */}
        {/* MODAL BODY (SWITCHER BETWEEN MANUAL AND SIMULATOR) */}
        {/* ------------------------------------------------------------------- */}
        {viewMode === 'SIMULATOR' ? (
          <div className="relative z-20 flex-1 flex flex-col overflow-hidden">
            <InteractiveTutorialSimulator
              initialDrill={simulatorDrill}
              onExitToManual={() => {
                audio.playSelectClick();
                setViewMode('MANUAL');
              }}
              onCloseModal={() => {
                audio.playUiClick();
                onClose();
              }}
            />
          </div>
        ) : (
          <div className="relative z-20 flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* LEFT: CHAPTER DIRECTORY */}
            <nav className="w-full md:w-72 border-b md:border-b-0 md:border-r border-cyan-900/70 bg-[#05080c] flex flex-col shrink-0 overflow-y-auto">
              <div className="p-2.5 border-b border-cyan-950 text-[10px] text-cyan-300 font-bold tracking-widest uppercase bg-black/40 flex justify-between">
                <span>INHALTSVERZEICHNIS</span>
                <span>9 KAPITEL</span>
              </div>
              <div className="p-2 space-y-1.5">
                {chapters.map((chap) => {
                  const isCurrent = chap.id === currentChapter;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => handleSelectChapter(chap.id)}
                      className={`w-full text-left p-2.5 border transition-all text-xs cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-[#00FFAA] bg-cyan-950/90 text-white shadow-[0_0_12px_rgba(0,255,170,0.3)] font-bold'
                          : 'border-cyan-900/60 bg-black/30 text-slate-300 hover:border-cyan-600 hover:text-white font-medium'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-[10px] text-cyan-300 font-bold">
                          {chap.code}
                        </div>
                        <div className="truncate text-[11px] mt-0.5">
                          {chap.title}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border font-bold shrink-0 ${
                          isCurrent
                            ? 'border-[#00FFAA] text-[#00FFAA] bg-black'
                            : 'border-cyan-800 text-cyan-300 bg-cyan-950/40'
                        }`}
                      >
                        {chap.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* RIGHT: CHAPTER CONTENT */}
            <main className="flex-1 p-4 sm:p-6 bg-black/60 overflow-y-auto flex flex-col justify-between space-y-6">
              <div>
                {/* Chapter Header */}
                <div className="border-b border-cyan-800/80 pb-3 mb-4">
                  <div className="flex items-center justify-between text-xs text-[#00FFAA] font-bold mb-1">
                    <span>{activeChap.code}</span>
                    <span className="text-amber-300 font-semibold">[KAPITEL {activeChap.id} VON 9]</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    {activeChap.title}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-1">
                    {activeChap.summary}
                  </p>
                </div>

                {/* Interactive Practice Quick-Launch Banner */}
                <div className="mb-6 p-3 bg-gradient-to-r from-cyan-950/90 via-[#00FFAA]/10 to-black border border-[#00FFAA]/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_15px_rgba(0,255,170,0.12)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xs bg-[#00FFAA]/20 border border-[#00FFAA] flex items-center justify-center text-[#00FFAA] font-bold text-sm shrink-0">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>INTERAKTIVES TRAINING BEREIT</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-[#00FFAA]/20 text-[#00FFAA] border border-[#00FFAA]/40 font-mono">
                          DRILL 0{activeChap.drillId}
                        </span>
                      </div>
                      <p className="text-[11px] text-cyan-200">
                        Diese Spielmechanik kann jetzt direkt im interaktiven Simulator erlernt und getestet werden.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLaunchDrill(activeChap.drillId)}
                    className="w-full sm:w-auto px-4 py-2 bg-[#00FFAA] text-black font-extrabold text-xs tracking-wider uppercase hover:bg-white transition-all shadow-[0_0_12px_#00FFAA] cursor-pointer shrink-0"
                  >
                    ⚡ JETZT IM SIMULATOR TESTEN &gt;
                  </button>
                </div>

                {/* Chapter Dynamic Content */}
                {activeChap.content}
              </div>

              {/* Chapter Footer Navigation */}
              <div className="pt-4 border-t border-cyan-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="text-[11px] text-cyan-300 font-medium">
                  Tastatur: <kbd className="px-1 bg-black border border-cyan-700 text-[#00FFAA] font-bold">[◀]</kbd> Vorheriges // <kbd className="px-1 bg-black border border-cyan-700 text-[#00FFAA] font-bold">[▶]</kbd> Nächstes // <kbd className="px-1 bg-black border border-red-700 text-red-300 font-bold">[ESC]</kbd> Schließen
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePrevChapter}
                    disabled={currentChapter === 1}
                    className={`flex-1 sm:flex-initial px-4 py-2 border text-xs font-bold transition-all cursor-pointer ${
                      currentChapter === 1
                        ? 'border-gray-800 text-gray-600 cursor-not-allowed bg-black/40'
                        : 'border-cyan-700 bg-cyan-950/60 text-cyan-200 hover:bg-cyan-500 hover:text-black'
                    }`}
                  >
                    &lt; [ZURÜCK]
                  </button>

                  {currentChapter < 9 ? (
                    <button
                      onClick={handleNextChapter}
                      className="flex-1 sm:flex-initial px-5 py-2 border border-[#00FFAA] bg-[#00FFAA]/15 text-[#00FFAA] hover:bg-[#00FFAA] hover:text-black text-xs font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(0,255,170,0.3)] cursor-pointer"
                    >
                      [WEITER &gt;]
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        audio.playUiClick();
                        onClose();
                      }}
                      className="flex-1 sm:flex-initial px-5 py-2 border border-[#00FFAA] bg-[#00FFAA] text-black hover:bg-white text-xs font-bold tracking-wider transition-all shadow-[0_0_20px_#00FFAA] cursor-pointer"
                    >
                      [EINSATZ BEREIT // SCHLIESSEN]
                    </button>
                  )}
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};
