// src/components/TutorialModal.tsx - Umfassendes Operatives Handbuch & Diegetisches Tutorial
import React, { useState, useEffect } from 'react';
import { AudioEngine } from '../services/audioEngine';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  audio?: AudioEngine;
}

interface ITutorialChapter {
  id: number;
  title: string;
  badge: string;
  subtitle: string;
  content: React.ReactNode;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, audio }) => {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Keyboard navigation: ArrowLeft/ArrowRight for pages, Escape for close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (audio) audio.playUiClick();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveChapterIndex((prev) => {
          const next = Math.min(CHAPTERS.length - 1, prev + 1);
          if (audio && next !== prev) audio.playSelectClick();
          return next;
        });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveChapterIndex((prev) => {
          const next = Math.max(0, prev - 1);
          if (audio && next !== prev) audio.playSelectClick();
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, audio]);

  if (!isOpen) return null;

  const CHAPTERS: ITutorialChapter[] = [
    // -------------------------------------------------------------------------
    // KAPITEL 1: KOMMANDO-DECK & STATIONS-RADAR
    // -------------------------------------------------------------------------
    {
      id: 1,
      title: '01. KOMMANDO-DECK & STATIONS-RADAR',
      badge: 'STATIONS-ÜBERSICHT',
      subtitle: 'Sektoren 01–09, Währungen, Rig-Integrität & Globale Steuerungs-Matrix',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Willkommen an Bord der verlassenen Tiefenraum-Station <strong className="text-white">STRATUM-09</strong>. 
            Als Klon-Operative Vance unterstehst du der orbitalen KI <strong className="text-cyan-300">ASTRAEA MODEL-7</strong>.
            Das Haupt-Befehlsdeck ist deine taktische Operations-Zentrale vor und nach jedem Einsatz.
          </p>

          {/* 3 Haupt-Währungen */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2">
            <h4 className="text-xs font-bold text-[#00FFAA] tracking-wider uppercase">
              // DIE 3 WIRTSCHAFTS-STRÖME (CURRENCIES):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2 bg-cyan-950/40 border border-cyan-700/60">
                <span className="font-bold text-gray-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-300" />
                  ASTRAEA CREDITS (AC)
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-1">
                  Standard-Währung für Waffenkäufe, Munitionskisten und Konsumgüter an der Handelsbörse.
                </p>
              </div>
              <div className="p-2 bg-cyan-950/40 border border-[#00FFAA]/50">
                <span className="font-bold text-[#00FFAA] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00FFAA]" />
                  TITAN-NANITEN (TN)
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-1">
                  Mikroskopische Nanomaschinen aus Gefechtsbeute. Unverzichtbar für Waffen-Upgrades & Schmiede-Overclocking.
                </p>
              </div>
              <div className="p-2 bg-cyan-950/40 border border-amber-500/50">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  CHRONO-KRISTALLE (CK)
                </span>
                <p className="text-[11px] text-slate-300 font-medium mt-1">
                  Extrem seltene Kausalitäts-Kondensate für permanente Klon-Perks im Forschungsbaum und Apex-Raids.
                </p>
              </div>
            </div>
          </div>

          {/* Rig-Integrität & Klon-Status */}
          <div className="p-3 bg-black/50 border border-cyan-900/60 rounded text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-cyan-300">RIG-INTEGRITÄT (EXOHARNISCH):</span>
              <span className="text-[#00FFAA] font-bold">100% MAXIMUM</span>
            </div>
            <p className="text-slate-300 font-medium leading-relaxed">
              Deine Rig-Integrität schützt deinen Körper vor orbitaler Dekompression und toxischer Strahlung. 
              Fällt die Rig-Integrität auf 0%, wird der Klon instabil. Reparaturen erfolgen automatisch nach Sektor-Abschluss.
            </p>
          </div>

          {/* Sektoren 01 bis 09 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              // STATIONSTOPOLOGIE (SEKTOREN 01 BIS 09):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 01: Solar-Array</strong>
                <p className="text-slate-300 mt-0.5">Alpha-Einspeisung. Hohe Hitze (+140°C), Blend-Effekte.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 02: Hydrokultur</strong>
                <p className="text-slate-300 mt-0.5">Biomorphe Pilzsporen, eingeschränkte Sichtlinie.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 03: Hangar-Bucht</strong>
                <p className="text-slate-300 mt-0.5">0.0G Mikrogravitation: Jeder Schuss erzeugt Rückstoß-Drift!</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 04: Reaktor-Kern</strong>
                <p className="text-slate-300 mt-0.5">Gravitationsspule, 2.5G Hypergravitation (+1 AP für Schritte).</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 05: Naniten-Schmiede</strong>
                <p className="text-slate-300 mt-0.5">Waffenlabore, reiche Titan-Ablagerungen & Beute.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 06: Lüftungskanal</strong>
                <p className="text-slate-300 mt-0.5">Enge Röhren, Kriecher-Infiltration & Hinterhalte.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 07: Kausalitäts-Brücke</strong>
                <p className="text-slate-300 mt-0.5">Chrono-Risse: Entropie steigt alle 2 Runden um 10%.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 08: Apex-Kommando</strong>
                <p className="text-slate-300 mt-0.5">Boss-Raum des Wächters Nilus mit Dual-Grid Resonanz.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-200">Sektor 09: Orbitalspitze</strong>
                <p className="text-slate-300 mt-0.5">Die Antennen-Nadel: Sendestation für Kausal-Signale.</p>
              </div>
            </div>
          </div>

          {/* Globale Tasten-Referenz */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-800/80 rounded space-y-1.5 text-xs">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider">
              // GLOBALE TASTATUR-SCHNELLTASTEN (DECK-NAVIGATION):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-200 font-mono">
              <div><strong className="text-[#00FFAA]">[1]</strong> Einsatz / Drop-Pod</div>
              <div><strong className="text-[#00FFAA]">[2]</strong> Funk-Logs / Intel</div>
              <div><strong className="text-[#00FFAA]">[3]</strong> Arsenal-Schmiede</div>
              <div><strong className="text-[#00FFAA]">[4]</strong> Astraea BIOS / Config</div>
              <div><strong className="text-[#00FFAA]">[5]</strong> Speicher-Reset</div>
              <div><strong className="text-[#00FFAA]">[B]</strong> Handelsbörse</div>
              <div><strong className="text-[#00FFAA]">[N]</strong> Apex-Raid Null-Zone</div>
              <div><strong className="text-[#00FFAA]">[T]</strong> Operatives Handbuch</div>
              <div><strong className="text-[#00FFAA]">[M]</strong> Audio Stumm/An</div>
              <div><strong className="text-[#00FFAA]">[ESC]</strong> Zurück / Hauptdeck</div>
              <div><strong className="text-[#00FFAA]">[Shift+D]</strong> Live-Telemetrie</div>
              <div><strong className="text-[#00FFAA]">[K]</strong> Kodex-Archiv</div>
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
      title: '02. ARSENAL & MODULARE SCHMIEDE',
      badge: 'CAD-SCHMIEDE',
      subtitle: '6 Waffen-Sockel, CAD-Bauplan, Naniten-Overclocking & Drohnen-Protokolle',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            In der Arsenal-Werkstatt modifizierst du deine Primärwaffe <strong className="text-white">ARC-70 IMPULS</strong> 
            und deine Sekundärwaffe über einen echten 2D-CAD-Vektor-Bauplan. Jede Waffe verfügt über 6 modulare Sockel.
          </p>

          {/* Die 6 Waffensockel */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              // DIE 6 SOCKEL-KATEGORIEN (SOCKET MATRIX):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[1] LAUF (BARREL)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Modifiziert Waffenreichweite, Schuss-Streuung und kinetischen Durchschlag.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[2] VISIER (OPTIC)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Erhöht kritische Trefferchance (+8% bis +20%) und gewährt Zielzoom.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[3] GEHÄUSE (BODY)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Basis-Schadensanker der Waffe. Bestimmt interne Kühlzeit und Haltbarkeit.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[4] MAGAZIN (MAGAZINE)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Bestimmt Schusskapazität (12 bis 36 Schuss) und Nachlade-AP-Kosten.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[5] SCHAFT (STOCK)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Kompensiert Rückstoß in 0.0G-Umgebungen und stabilisiert die Feuerrate.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <span className="font-bold text-[#00FFAA]">[6] KATALYSATOR (CATALYST)</span>
                <p className="text-[11px] text-slate-300 mt-0.5">Injiziert Entropie- oder Plasma-Ladung (+25% Schaden gegen Schilde oder Rüstungsbypass).</p>
              </div>
            </div>
          </div>

          {/* Schmiede-Aktionen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-cyan-950/30 border border-cyan-700/80 rounded space-y-1.5">
              <h5 className="font-bold text-cyan-200 uppercase">[1] MODUL VEREDELN (OVERCLOCKING)</h5>
              <p className="text-slate-300 font-medium">
                Investiere <strong className="text-[#00FFAA]">120 Titan-Naniten</strong> und <strong className="text-amber-300">1 Chrono-Kristall</strong>, 
                um die Werte eines installierten Moduls um +25% zu übertakten. Die Erfolgschance liegt bei 80%.
              </p>
            </div>
            <div className="p-3 bg-red-950/20 border border-red-700/60 rounded space-y-1.5">
              <h5 className="font-bold text-red-300 uppercase">[2] SCHROTT DEMONTIEREN (SCRAP)</h5>
              <p className="text-slate-300 font-medium">
                Zerlege ungenutzte oder minderwertige Module direkt im Inventar. Du erhältst je nach Seltenheit 
                zwischen <strong className="text-[#00FFAA]">45 und 280 Titan-Naniten</strong> zurück.
              </p>
            </div>
          </div>

          {/* Taktische Drohne Scarab-IV */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-cyan-950 pb-1">
              <span className="font-bold text-white">TAKTIK-DROHNE SCARAB-IV (VERBUNDEN)</span>
              <span className="text-[#00FFAA] font-bold">3 AUTONOMIE-MODI</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-300">• SCHILD-LINK:</strong>
                <p className="text-slate-300 mt-0.5">Regeneriert +25 MJ Schild-Integrität pro Runde bei Koppelung.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-300">• ABWEHR-TURM:</strong>
                <p className="text-slate-300 mt-0.5">Legt automatisches Sperrfeuer auf Feinde, die sich im 3-Felder-Radius bewegen.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-cyan-300">• EMP-MINE:</strong>
                <p className="text-slate-300 mt-0.5">Platziert Schockladung, die Feinde für 2 Runden in Stasis (Bewegungsunfähig) versetzt.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 3: EINSATZ-ZENTRALE & SEKTOR-TOPOLOGIE
    // -------------------------------------------------------------------------
    {
      id: 3,
      title: '03. EINSATZ-ZENTRALE & SEKTOR-TOPOLOGIE',
      badge: 'TOPOLOGIE & BRIEFS',
      subtitle: 'DAG-Knotengraph, Pfad-Auswahl, 3 Bedrohungsstufen & Gemini-Briefings',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            In der Einsatz-Zentrale (Operations Hub) wählst du deine Infiltrations-Route durch den Sektor.
            Die Knotenstruktur folgt einem gerichteten azyklischen Graphen (DAG). Jeder Schritt sperrt alternative Pfade ab.
          </p>

          {/* Knotentypen */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              // KNOTEN-TYPEN AUF DEM MISSION-GRID:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-red-950/30 border border-red-700/60">
                <strong className="text-red-300">[!] COMBAT (GEFECHT)</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">Taktischer Feuerkampf gegen Praetoren oder Kriecher-Schwärme.</p>
              </div>
              <div className="p-2 bg-emerald-950/30 border border-emerald-700/60">
                <strong className="text-emerald-300">[+] SALVAGE (BERGUNG)</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">Kisten & Wracks mit garantierten Titan-Naniten und seltenen Modulen.</p>
              </div>
              <div className="p-2 bg-amber-950/30 border border-amber-700/60">
                <strong className="text-amber-300">[~] HAZARD (ANOMALIE)</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">Schwere Strahlung oder Gravitations-Vakuum. Hohes Risiko, hohe Belohnung.</p>
              </div>
              <div className="p-2 bg-cyan-950/30 border border-cyan-700/60">
                <strong className="text-cyan-300">[?] EVENT (LORE-FUNK)</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">Unverschlüsselte Funksprüche und Kausalitäts-Dilemmata mit Fraktions-Einfluss.</p>
              </div>
              <div className="p-2 bg-purple-950/30 border border-purple-700/60 sm:col-span-2">
                <strong className="text-purple-300">[★] APEX-BOSS (WÄCHTER NILUS)</strong>
                <p className="text-[11px] text-slate-300 mt-0.5">Mehrphasiger Sektor-Wächter. Erfordert Beherrschung aller Kampfsysteme.</p>
              </div>
            </div>
          </div>

          {/* Bedrohungs-Modifikatoren */}
          <div className="p-3 bg-black/50 border border-cyan-900/60 rounded space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider">
              // SCHWIERIGKEITS-MODIFIKATOREN [1–3]:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-black/40 border border-cyan-800">
                <div className="font-bold text-cyan-300">[1] KADETT</div>
                <div className="text-[11px] text-slate-300 mt-1">1.0x Feind-HP, 1.0x Schaden, Basis-Beute, 0 Affixe.</div>
              </div>
              <div className="p-2.5 bg-black/40 border border-amber-500">
                <div className="font-bold text-amber-300">[2] OPERATIVE</div>
                <div className="text-[11px] text-slate-300 mt-1">1.4x Feind-HP, 1.25x Schaden, +50% Beute, 1 Zufalls-Affix.</div>
              </div>
              <div className="p-2.5 bg-black/40 border border-red-500">
                <div className="font-bold text-red-400">[3] KOLLAPS</div>
                <div className="text-[11px] text-slate-300 mt-1">2.0x Feind-HP, 1.6x Schaden, +120% Beute, 2 tödliche Affixe.</div>
              </div>
            </div>
          </div>

          {/* Gemini-Missionsbriefing */}
          <div className="p-3 bg-cyan-950/20 border border-cyan-700/60 rounded text-xs space-y-1 font-mono">
            <span className="font-bold text-[#00FFAA]">ASTRAEA LIVE-INTEL (GEMINI FLASH 2.5):</span>
            <p className="text-slate-200 font-medium italic">
              "Vor dem Start des Drop-Pods analysiert die KI die Sensor-Signaturen des Ziel-Sektors 
              und liefert taktische Empfehlungen zur Waffenauswahl und Umgebungswarnungen."
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
      title: '04. GRID-KAMPF & AP-SYSTEM',
      badge: '10x10 ARENA',
      subtitle: '4 Aktionspunkte, Deckung (Halb vs. Voll), Sichtlinien & Taktische Aktionen',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Kämpfe finden auf einem taktischen 10x10 Gitter statt. Du agierst rundenbasiert mit einem Pool von 
            <strong className="text-[#00FFAA]"> 4 Aktionspunkten (AP)</strong> pro Runde (durch Forschung bis zu 6 AP).
          </p>

          {/* Die Taktischen Aktionen */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              // DEIN AKTIONEN-POOL IM GEFECHT:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[1] BEWEGEN</span>
                  <span className="text-cyan-300 font-mono">1 AP / FELD</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Schrittweise taktische Positionierung. Pfadfindung umgeht Wände und berechnet Deckungswerte.
                </p>
              </div>

              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[2] FEUERN</span>
                  <span className="text-cyan-300 font-mono">2 AP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Feuert deine ausgerüstete Waffe auf ein Ziel in Sichtlinie. Verbraucht 1 Munition aus dem Magazin.
                </p>
              </div>

              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[3] CHRONO-DASH</span>
                  <span className="text-cyan-300 font-mono">1 AP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Quanten-Sprung um exakt 2 Felder in jede Richtung. Ignoriert Feinde und Gefahren-Felder im Sprungpfad!
                </p>
              </div>

              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[4] DROHNEN-LINK</span>
                  <span className="text-cyan-300 font-mono">1 AP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Aktiviert die Spezialfähigkeit deiner Drohne (z.B. sofort +25 MJ Schild oder Sperrfeuer).
                </p>
              </div>

              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[R] NACHLADEN</span>
                  <span className="text-cyan-300 font-mono">0 AP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Füllt dein Waffenmagazin wieder vollständig auf. Immer nachladen, bevor du vorrückst!
                </p>
              </div>

              <div className="p-2 bg-black/40 border border-cyan-900">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#00FFAA]">[H] MED-STIM</span>
                  <span className="text-cyan-300 font-mono">1 AP</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">
                  Injiziert ein Notfall-Stimulans aus dem Depot: Stellt sofort <strong className="text-emerald-300">+35 HP</strong> wieder her.
                </p>
              </div>
            </div>
          </div>

          {/* Deckungs-System */}
          <div className="p-3 bg-black/50 border border-cyan-900/60 rounded space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider">
              // DECKUNG & SICHTLINIEN (LOS-SYSTEM):
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-200">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">• OFFENES FELD (FLOOR):</span>
                <span>0% Deckung. Angreifer treffen mit voller Grund-Präzision (Basis 85%).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">• HALBE DECKUNG (COVER_HALF):</span>
                <span>Barrikaden & Kisten dämpfen die gegnerische Trefferwahrscheinlichkeit um <strong className="text-amber-300">-30%</strong>!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 font-bold">• VOLLE WAND (WALL_FULL):</span>
                <span>Blockiert die Sichtlinie komplett. Angriffe sind unmöglich (0% Hit Chance).</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-cyan-950/40 border border-cyan-700/60 text-xs font-bold text-cyan-200 flex justify-between items-center">
            <span>RUNDE BEENDEN: DRÜCKE [LEERTASTE]</span>
            <span className="text-[10px] text-amber-300">ACHTUNG: FEIND-PHASE STARTET!</span>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 5: SCHADEN, RÜSTUNG & DIE CHRONO-PARADE
    // -------------------------------------------------------------------------
    {
      id: 5,
      title: '05. SCHADEN, RÜSTUNG & DIE CHRONO-PARADE',
      badge: 'KAMPF-MATHEMATIK',
      subtitle: 'Schild-Puffer, Rüstungs-Subtraktion & das 160ms QTE-Reaktionsfenster',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Chrono-Stratum berechnet Schaden nach einem dreistufigen physikalischen Modell: 
            <strong className="text-cyan-300"> Schild &gt; Rüstung &gt; Vital-HP</strong>. 
            Zusätzlich erlaubt dir die Kausalitäts-Engine, feindliche Angriffe in Echtzeit zu parieren.
          </p>

          {/* Formel-Kasten */}
          <div className="p-3 bg-black/70 border border-cyan-800 rounded space-y-2 text-xs font-mono">
            <h4 className="text-cyan-300 font-bold uppercase">// SCHADENS- & TREFFER-FORMEL:</h4>
            <div className="p-2 bg-black/60 border border-cyan-950 text-[11px] text-cyan-200 leading-relaxed">
              P(Hit) = Clamp(85% Basis + AccMod - DistanzMalus - DeckungBonus, 5%, 95%)<br />
              Effektiver Schaden = Max(1, (BasisSchaden × CritMultiplier) - ZielRüstung)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-300 pt-1">
              <div>• KINETISCH: Standard, zieht Rüstung ab</div>
              <div>• ENERGIE: +25% DMG gegen Schilde</div>
              <div>• ENTROPIE: Umgeht Rüstung zu 100%!</div>
            </div>
          </div>

          {/* Die Chrono-Parade (QTE) */}
          <div className="p-3 bg-cyan-950/30 border-2 border-cyan-400 rounded space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#00FFAA] text-xs uppercase tracking-wider">
                // DIE CHRONO-PARADE (ECHTZEIT-QTE):
              </span>
              <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                160ms SWEETSPOT
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              Wenn ein Feind dich im Nah- oder Fernkampf angreift, aktiviert sich die Kausalitäts-Verlangsamung. 
              Ein horizontaler Zeitbalken läuft über den Bildschirm (Dauer: ca. 1,2 Sekunden).
            </p>

            <div className="p-2.5 bg-black/80 border border-cyan-900 rounded space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[#00FFAA] font-bold">PERFEKTE PARADE (60% – 76% DES BALKENS):</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Drücke <strong className="text-white underline">[LEERTASTE]</strong> oder klicke mit der Maus exakt im cyanfarbenen Sweet-Spot. 
                Ergebnis: <strong className="text-[#00FFAA]">0 Schaden erlitten</strong>, der Feind wird <strong className="text-cyan-200">betäubt</strong> und du erhältst <strong className="text-[#00FFAA]">+1 Bonus-AP</strong> für deine nächste Runde!
              </p>
              <div className="pt-1 text-[11px] text-red-300">
                <strong>FEHL-TIMING:</strong> Drückst du zu früh oder zu spät, bricht der Angriff mit vollem Schaden durch deine Schilde.
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
      title: '06. FEIND-KI & TELEGRAFIERTE INTENTS',
      badge: 'A*-FLANKIERUNG',
      subtitle: 'Rote Absichts-Vektoren, Feind-Archetypen & Kausal-Antizipation',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Feinde in Chrono-Stratum agieren mit einer hochentwickelten A*-Wegfindungs- und Flankierungs-KI. 
            Um taktische Tiefe zu garantieren, sind alle feindlichen Züge <strong className="text-red-400">telegrafiert</strong>.
          </p>

          {/* Telegrafierte Intents */}
          <div className="p-3 bg-red-950/20 border border-red-500/60 rounded space-y-2 text-xs">
            <h4 className="font-bold text-red-300 uppercase tracking-wider">
              // TELEGRAFIERTE FEINDLICHE ABSICHTEN (INTENTS):
            </h4>
            <p className="text-slate-200 font-medium leading-relaxed">
              Jeder Feind zeigt während deines Zuges an, was er in der kommenden Feindphase tun wird:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-black/50 border border-red-900">
                <span className="text-red-400 font-bold">• SCHADENS-VORSCHAU:</span>
                <p className="text-slate-300 mt-0.5">Zeigt z.B. "18 DMG" über dem Kopf des Feindes an.</p>
              </div>
              <div className="p-2 bg-black/50 border border-red-900">
                <span className="text-red-400 font-bold">• 3x3 FLÄCHENSCHLAG:</span>
                <p className="text-slate-300 mt-0.5">Bosse kündigen AoE-Hammerschläge an. Rote Bodenmarkierungen warnen dich!</p>
              </div>
              <div className="p-2 bg-black/50 border border-red-900">
                <span className="text-cyan-400 font-bold">• SCHILD-AUFBAU:</span>
                <p className="text-slate-300 mt-0.5">Feind wird defensive Schilde regenerieren statt anzugreifen.</p>
              </div>
              <div className="p-2 bg-black/50 border border-red-900">
                <span className="text-amber-400 font-bold">• FLANKIERUNGS-SPRUNG:</span>
                <p className="text-slate-300 mt-0.5">Kriecher versuchen, hinter deine Deckung zu gelangen.</p>
              </div>
            </div>
          </div>

          {/* Feind-Archetypen */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider">
              // DIE BEDROHUNGS-ARCHETYPEN:
            </h4>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <strong className="text-red-400 shrink-0">• PRAETOR-WÄCHTER:</strong>
                <span className="text-slate-300 font-medium">Schwere Rüstung (6 PT), Kinetik-Gewehr. Greift bevorzugt auf 4 Felder Distanz an. Benötigt Entropie oder Crits zur schnellen Neutralisierung.</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-amber-400 shrink-0">• KRIECHER-HÖLLENBRUT:</strong>
                <span className="text-slate-300 font-medium">Extrem schnell (3 Felder / Runde), keine Rüstung, aber hoher Giftschaden im Nahkampf. Hält Abstand mit Chrono-Dash ein!</span>
              </div>
              <div className="flex items-start gap-2">
                <strong className="text-purple-400 shrink-0">• APEX-WÄCHTER NILUS:</strong>
                <span className="text-slate-300 font-medium">Boss mit mehreren Phasen. Spawnt Kausalitäts-Klone, errichtet 3x3 Sperrzonen und wechselt nach HP-Verlust seine Angriffs-Matrix.</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 7: BIOME, GEFAHREN & KAUSALITÄTS-REWIND
    // -------------------------------------------------------------------------
    {
      id: 7,
      title: '07. BIOME, GEFAHREN & KAUSALITÄTS-REWIND',
      badge: 'CHRONO-ZEITACHSE',
      subtitle: 'Umwelt-Affixe, 0.0G-Rückstoß, Strahlen-Zonen & 3-Runden-Zeitreise mit [R]',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Stratum-09 leidet unter Kausalitäts-Zersetzung. Gefahrenfelder und Gravitations-Anomalien zwingen dich, 
            das Terrain aktiv in deine Gefechts-Taktik einzubeziehen.
          </p>

          {/* Gefahren-Felder */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider">
              // UMGEBUNGS-TILES & GEFAHREN:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-amber-950/20 border border-amber-600/60">
                <strong className="text-amber-300">HAZARD_RADIATION (STRAHLUNG):</strong>
                <p className="text-slate-300 mt-0.5 font-medium">
                  Das Betreten erhöht dein Entropie-Niveau um +15%. Bei 100% Entropie erleidet Vance periodischen Reaktor-Schaden!
                </p>
              </div>
              <div className="p-2 bg-purple-950/20 border border-purple-600/60">
                <strong className="text-purple-300">HAZARD_VOID (VAKUUM-RISS):</strong>
                <p className="text-slate-300 mt-0.5 font-medium">
                  Risse in der Stationshülle. Ziehen Einheiten an und verursachen sofortigen Schild-Kollaps beim Überqueren.
                </p>
              </div>
            </div>
          </div>

          {/* 0.0G Rückstoß-Physik */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-500/80 rounded space-y-1.5 text-xs">
            <h4 className="font-bold text-cyan-200 uppercase">// 0.0G MIKROGRAVITATIONS-PHYSIK:</h4>
            <p className="text-slate-200 font-medium leading-relaxed">
              In Hangar-Sektoren ohne künstliche Gravitation erzeugt jeder Schuss mit kinetischen Waffen einen 
              <strong className="text-white"> physikalischen Gegenimpuls</strong>: Vance wird um 1 Feld entgegen der Schussrichtung zurückgestoßen! 
              Nutze dies, um dich kostenfrei aus Gefahrenzonen zu katapultieren.
            </p>
          </div>

          {/* Chrono-Rewind */}
          <div className="p-3 bg-purple-950/30 border-2 border-purple-400 rounded space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-300 uppercase tracking-wider">
                // KAUSALITÄTS-REWIND (ZEITRÜCKLAUF):
              </span>
              <span className="px-2 py-0.5 bg-purple-950 border border-purple-400 text-purple-200 font-mono text-[10px] font-bold">
                TASTE [R] IM COMBAT
              </span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              Dank deines Chrono-Dämpfers speichert das Terminal die Kausal-Zustände der letzten Runden. 
              Hast du einen fatalen Fehler begangen oder wurdest von einem Hinterhalt überrascht, kannst du mit 
              <strong className="text-white font-mono"> [R]</strong> bis zu <strong className="text-[#00FFAA]">3 Runden in der Zeit zurückspulen</strong>!
            </p>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 8: BÖRSE, ARTEFAKT-FORSCHUNG & DUAL-GRID APEX-RAID
    // -------------------------------------------------------------------------
    {
      id: 8,
      title: '08. BÖRSE, ARTEFAKT-FORSCHUNG & DUAL-GRID APEX-RAID',
      badge: 'ENDGAME & FORSCHUNG',
      subtitle: '4 Händler, Mystery-Crates mit Pity-System, 12-Knoten Perk-Tree & Dual-Grid',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Die Wirtschaft der Station operiert post-kapitalistisch. An der Astraea-Börse findest du vier spezialisierte Händler, 
            einen permanenten Klon-Forschungsbaum und den Zugang zur Kausalitäts-Nullzone.
          </p>

          {/* 4 Händler */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider">
              // DIE 4 HÄNDLER-KNOTEN AN DER BÖRSE:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-white">1. HANGAR-05 TITAN-DEPOT</strong>
                <p className="text-slate-300 mt-0.5">Schwere kinetische Waffen, Rüstungsplatten und Standard-Magazine gegen Credits.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-white">2. AETHEL TECH-SYNDIKAT</strong>
                <p className="text-slate-300 mt-0.5">Optische Zielsensoren, Drohnen-Kondensatoren und Energie-Waffen.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-white">3. SCHWARZMARKT (KRIECHER-KANAL)</strong>
                <p className="text-slate-300 mt-0.5">Illegale Entropie-Katalysatoren, unregulierte Rigs und Overclock-Kerne.</p>
              </div>
              <div className="p-2 bg-black/40 border border-cyan-900">
                <strong className="text-white">4. ASTRAEA FORSCHUNGS-KNOTEN</strong>
                <p className="text-slate-300 mt-0.5">Mystery-Crates mit Pity-Zähler: Nach 10 Kisten garantiert legendärer Apex-Drop!</p>
              </div>
            </div>
          </div>

          {/* 12-Knoten Forschungsbaum */}
          <div className="p-3 bg-black/50 border border-cyan-900/60 rounded space-y-1.5 text-xs">
            <h4 className="font-bold text-amber-300 uppercase tracking-wider">
              // DER 12-KNOTEN ROGUELITE FORSCHUNGSBAUM:
            </h4>
            <p className="text-slate-200 font-medium leading-relaxed">
              Investiere Chrono-Kristalle in die genetische Matrix deines Klon-Körpers. Alle Boni bleiben permanent über Tode hinweg aktiv:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-cyan-200">
              <div className="p-1.5 bg-black/40 border border-cyan-950">• Max HP (+25 bis +100)</div>
              <div className="p-1.5 bg-black/40 border border-cyan-950">• Max Schild (+20 bis +75 MJ)</div>
              <div className="p-1.5 bg-black/40 border border-cyan-950">• Start-AP (+1 bis +2 AP)</div>
              <div className="p-1.5 bg-black/40 border border-cyan-950">• Naniten-Bonus (+15% bis +45%)</div>
            </div>
          </div>

          {/* Dual-Grid Apex-Raid */}
          <div className="p-3 bg-amber-950/20 border-2 border-amber-500/80 rounded space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-amber-300 uppercase tracking-wider">
                // DUAL-GRID ENDGAME APEX-RAID:
              </span>
              <span className="px-2 py-0.5 bg-amber-950 border border-amber-400 text-amber-200 font-mono text-[10px] font-bold">
                TASTE [N] IM MENÜ
              </span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              In der Null-Zone spaltet sich das Raum-Zeit-Gefüge in zwei synchrone 8x8 Grids:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-black/60 border border-amber-800">
                <strong className="text-cyan-300">LINKER GRID (VERGANGENHEIT):</strong>
                <p className="text-slate-300 mt-0.5">Vance neutralisiert Primär-Kerne und schaltet Barrikaden ab.</p>
              </div>
              <div className="p-2 bg-black/60 border border-amber-800">
                <strong className="text-purple-300">RECHTER GRID (ZUKUNFT):</strong>
                <p className="text-slate-300 mt-0.5">Drohne Scarab-IV muss Kausalitäts-Relais überlasten, bevor der Enrage-Timer (15 Runden) abläuft.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // -------------------------------------------------------------------------
    // KAPITEL 9: GEMINI-KI, SETTINGS & SUPABASE CLOUD-SYNC
    // -------------------------------------------------------------------------
    {
      id: 9,
      title: '09. GEMINI-KI, SETTINGS & SUPABASE CLOUD-SYNC',
      badge: 'SYSTEM-INTEGRATION',
      subtitle: 'Gemini Live-Radio, Prozedurales Web Audio, BIOS & Sicherer Cloud-Sync',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            Chrono-Stratum verbindet modernste Web-Technologien mit kompromissloser Datensicherheit und Barrierefreiheit.
          </p>

          {/* Gemini-KI & Offline-Fallback */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <h4 className="font-bold text-cyan-300 uppercase tracking-wider">
              // GEMINI FLASH 2.5 SDK & OFFLINE-FALLBACK:
            </h4>
            <p className="text-slate-200 font-medium leading-relaxed">
              Trägst du deinen eigenen Gemini API-Schlüssel in den Einstellungen ein, generiert das Modell dynamische 
              Verhör-Dialoge mit Fraktionen, Boss-Spötteleien und taktische Aufklärungsberichte. 
              Ohne Key schaltet das Spiel nahtlos auf über <strong className="text-[#00FFAA]">250 handgeschriebene deterministische Lore-Logs</strong> um.
            </p>
          </div>

          {/* Prozedurales Web Audio */}
          <div className="p-3 bg-black/50 border border-cyan-900/60 rounded space-y-1.5 text-xs">
            <h4 className="font-bold text-emerald-300 uppercase tracking-wider">
              // 100% PROZEDURALE WEB AUDIO API:
            </h4>
            <p className="text-slate-300 font-medium leading-relaxed">
              Das Spiel lädt null Binär-Audiodateien (0 MP3/WAV). Alle Schüsse, Schilde, Laser, Explosionen, Klicks 
              und Synth-Musik werden in Echtzeit durch mathematische Oszillatoren, Rauschgeneratoren und Biquad-Filter generiert.
            </p>
          </div>

          {/* Supabase & CWE-312 Konformität */}
          <div className="p-3 bg-black/60 border border-cyan-800/80 rounded space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white uppercase tracking-wider">
                // SUPABASE AUTH & CLOUD-PERSISTENZ:
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold text-[10px]">
                CWE-312 KONFORM
              </span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              Über den <strong className="text-[#00FFAA]">[CLOUD-SYNC]</strong> Button im Header kannst du deinen Account anlegen. 
              Dein Fortschritt (Credits, Naniten, Kristalle, Highscore) wird über PostgreSQL mit Row Level Security (RLS) synchronisiert. 
              API-Schlüssel werden sicher übertragen und niemals im Klartext im lokalen Speicher hinterlegt.
            </p>
          </div>

          {/* Vollständige Schnellreferenz */}
          <div className="p-3 bg-cyan-950/30 border border-cyan-500 rounded text-xs space-y-1.5 font-mono">
            <span className="font-bold text-cyan-200 uppercase">// EINSATZ-CHECKLISTE FÜR NEUE OPERATIVES:</span>
            <div className="space-y-1 text-[11px] text-slate-200">
              <div>1. Wähle Sektor 01 auf dem Radar & starte den Drop-Pod mit <strong className="text-[#00FFAA]">[1]</strong>.</div>
              <div>2. Nutze halbe Deckung <strong className="text-amber-300">(COVER_HALF)</strong> gegen feindliche Praetoren.</div>
              <div>3. Pariere feindliche Angriffe im Sweetspot mit <strong className="text-[#00FFAA]">[SPACE]</strong> für 0 DMG & +1 AP.</div>
              <div>4. Schalte permanente Perks an der Börse mit <strong className="text-cyan-300">[B]</strong> frei!</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentChapter = CHAPTERS[activeChapterIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 font-mono select-none">
      {/* Modal Container */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#070b10] border-2 border-cyan-400 shadow-[0_0_35px_rgba(0,255,170,0.3)] flex flex-col overflow-hidden text-slate-200">
        
        {/* Subtle Scanlines Layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-35"
        />

        {/* ===================================================================== */}
        {/* HEADER: TITEL & SCHLIESSEN */}
        {/* ===================================================================== */}
        <header className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/60 bg-[#080d14] text-xs shrink-0">
          <div className="flex items-center gap-3 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] shadow-[0_0_8px_#00FFAA]" />
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-widest text-xs sm:text-sm">
                ASTRAEA OPERATIVE MANUAL // TAKTISCHES DOKUMENTATIONS-TERMINAL
              </span>
              <span className="text-[10px] text-cyan-300 font-medium hidden sm:inline">
                REVISION 2026.10 // VOLLSTÄNDIGER LEITFADEN FÜR KLON-EINHEITEN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold text-[10px]">
              KAPITEL {activeChapterIndex + 1} / {CHAPTERS.length}
            </span>
            <button
              onClick={() => {
                if (audio) audio.playUiClick();
                onClose();
              }}
              className="px-3 py-1 bg-cyan-950/80 border border-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors font-bold text-cyan-200 text-xs cursor-pointer"
            >
              [ESC] SCHLIESSEN
            </button>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* CHAPTER TABS (TABLE OF CONTENTS) */}
        {/* ===================================================================== */}
        <div className="relative z-30 px-3 py-2 bg-[#05080c] border-b border-cyan-900/60 flex items-center gap-1.5 overflow-x-auto scrollbar-thin shrink-0">
          {CHAPTERS.map((ch, idx) => {
            const isSelected = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setActiveChapterIndex(idx);
                  if (audio) audio.playSelectClick();
                }}
                onMouseEnter={() => {
                  if (audio) audio.playHoverPing();
                }}
                className={`px-2.5 py-1 text-[10px] font-bold tracking-wider shrink-0 transition-all border cursor-pointer ${
                  isSelected
                    ? 'border-[#00FFAA] bg-cyan-950 text-[#00FFAA] shadow-[0_0_10px_rgba(0,255,170,0.3)]'
                    : 'border-cyan-950 bg-black/40 text-slate-300 hover:border-cyan-700 hover:text-white'
                }`}
              >
                [{ch.id}] {ch.badge}
              </button>
            );
          })}
        </div>

        {/* ===================================================================== */}
        {/* MAIN BODY: ACTIVE CHAPTER CONTENT */}
        {/* ===================================================================== */}
        <main className="relative z-30 flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#070b10] scrollbar-thin">
          <div className="border-b border-cyan-900/60 pb-3">
            <div className="flex justify-between items-center text-xs text-cyan-300 font-bold mb-1">
              <span>{currentChapter.badge}</span>
              <span className="text-[10px] text-slate-400">PFEILTASTEN [← / →] ZUM BLÄTTERN</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#00FFAA] tracking-wider">
              {currentChapter.title}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {currentChapter.subtitle}
            </p>
          </div>

          {currentChapter.content}
        </main>

        {/* ===================================================================== */}
        {/* FOOTER: NAVIGATION CONTROLS */}
        {/* ===================================================================== */}
        <footer className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-t border-cyan-900/60 bg-[#080d14] text-xs shrink-0">
          <button
            onClick={() => {
              if (activeChapterIndex > 0) {
                setActiveChapterIndex((prev) => prev - 1);
                if (audio) audio.playSelectClick();
              }
            }}
            disabled={activeChapterIndex === 0}
            className="px-3 py-1.5 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>[ &lt; ]</span>
            <span>VORHERIGES KAPITEL</span>
          </button>

          <div className="hidden sm:flex items-center gap-1">
            {CHAPTERS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeChapterIndex ? 'bg-[#00FFAA] scale-125' : 'bg-cyan-950 border border-cyan-800'
                }`}
              />
            ))}
          </div>

          {activeChapterIndex < CHAPTERS.length - 1 ? (
            <button
              onClick={() => {
                setActiveChapterIndex((prev) => prev + 1);
                if (audio) audio.playSelectClick();
              }}
              className="px-4 py-1.5 bg-[#00FFAA] text-black font-extrabold hover:bg-white transition-all shadow-[0_0_15px_rgba(0,255,170,0.3)] text-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>NÄCHSTES KAPITEL</span>
              <span>[ &gt; ]</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (audio) audio.playUiClick();
                onClose();
              }}
              className="px-4 py-1.5 bg-[#00FFAA] text-black font-extrabold hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,170,0.5)] text-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>[ ✓ ] EINSATZ BEREIT // SCHLIESSEN</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
