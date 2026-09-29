// components/CodexModal.tsx - Sektor-Archiv & Kodex-Datenbank für das Terminal

import React, { useState, useEffect } from 'react';
import { ICodexEntry } from '../types/narrative';
import { ProceduralAudioEngine } from '../services/audioEngine';

interface CodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CODEX_ENTRIES: ICodexEntry[] = [
  {
    id: 'chronos-01',
    code: 'LOG-CHR-001',
    title: 'PROJEKT CHRONOS: DIE NULL-PUNKT-KAMMER',
    category: 'CHRONOS',
    author: 'DR. ARIS THORNE // CHEF-PHYSICIST',
    clearanceLevel: 5,
    date: '2184-04-12',
    unlocked: true,
    content:
      'Tag 412 nach Zündung des Chrono-Kerns. Die Kausalitäts-Brüche sind keine Messfehler mehr. Wenn wir den Reaktor auf 104% überlasten, registrieren die Sensoren Signale, die erst in vier Sekunden gesendet werden. Das Terminal nennt es Protocol Null. Gott stehe uns bei, wenn die Direktion erfährt, was wir hier geöffnet haben.',
  },
  {
    id: 'factions-01',
    code: 'DOS-FAC-010',
    title: 'DIE ASTRAEA-DIREKTION // PROTOKOLL-AUTORITÄT',
    category: 'FACTIONS',
    author: 'BUREAU OF STRATEGIC INTEGRITY',
    clearanceLevel: 4,
    date: '2183-11-09',
    unlocked: true,
    content:
      'Die Direktion hält das Monopol auf die Naniten-Schmieden und die Model-7 Terminals. Für Direktorin Vesper Chen ist die Raumstation Stratum-09 kein Heim, sondern ein Laboratorium. Operative Vance untersteht direkt ihren Befehlen – jegliche Abweichung zur Unterstützung von Aufständischen wird mit Klon-Reset geahndet.',
  },
  {
    id: 'factions-02',
    code: 'DOS-FAC-022',
    title: 'DIE REAKTOR-GILDE // DER VERGESSENE SCHWUNG',
    category: 'FACTIONS',
    author: 'KAELEN VOSS // WERKMEISTER',
    clearanceLevel: 2,
    date: '2185-02-18',
    unlocked: true,
    content:
      'Über 1.200 Techniker halten die Kühlmittel-Kreisläufe manuell aufrecht, während die Direktion im oberen Habitat Champagner trinkt. Die Strahlung hat unsere Lungen verbrannt, aber ohne uns kollabiert die Gravitation in zehn Minuten. Wenn die Kriecher durch Schott 04 brechen, opfern wir die Station.',
  },
  {
    id: 'factions-03',
    code: 'DOS-FAC-033',
    title: 'DIE RESONANZ-KETZER // APOSTEL DER NULL-ZONE',
    category: 'FACTIONS',
    author: 'PROPHETIN MARA',
    clearanceLevel: 1,
    date: 'UNBESTIMMT // ENTROPIE-ZEIT',
    unlocked: true,
    content:
      'Ihr kämpft gegen die Entropie, Vance. Doch die Zeit ist kein Fluss, der gebändigt werden will; sie ist ein Ozean, der uns ertränkt. Die Kriecher sind keine Monster, sondern die nächste Form des Menschen nach dem Zusammenbruch der linearen Kausalität. Schließt die Augen und hört den Gesang der Station.',
  },
  {
    id: 'incidents-01',
    code: 'INC-NULL-004',
    title: 'DER BRUCH VON DECK 09 (DIE ENTROPIE-WELLE)',
    category: 'INCIDENTS',
    author: 'AUTOMATISCHER SCHADENSBERICHT AICR-7',
    clearanceLevel: 3,
    date: '2185-06-01',
    unlocked: true,
    content:
      'Gravitations-Umkehr auf 4.000 Quadratmetern. 38 Besatzungsmitglieder wurden in die Vakuum-Brüche gesogen. Die Überlebenden berichten von Echos ihrer selbst, die versuchten, die Sicherheitstore von außen einzuschlagen. Raumstation Stratum-09 treibt seitdem im instabilen Orbit um das Chrono-Phänomen.',
  },
  {
    id: 'entropy-01',
    code: 'THE-ENT-008',
    title: 'CHRONO-KRISTALLE & TRANS-ZEITLICHE NANITEN',
    category: 'ENTROPY',
    author: 'FORSCHUNGSLABOR DECK 03',
    clearanceLevel: 4,
    date: '2185-05-14',
    unlocked: false,
    content:
      '[VERSCHLÜSSELT // ERFORDERT KLARSTUFE 5 ODER HISTORISCHEN FUND IN SEKTOR 06].',
  },
];

const CODEX_STORAGE_KEY = 'CHRONO_CODEX_v1';

export const CodexModal: React.FC<CodexModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<ICodexEntry[]>(() => {
    try {
      const saved = localStorage.getItem(CODEX_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignored
    }
    return DEFAULT_CODEX_ENTRIES;
  });

  const [selectedEntryId, setSelectedEntryId] = useState<string>(DEFAULT_CODEX_ENTRIES[0].id);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const audio = ProceduralAudioEngine.getInstance();

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || entries[0];
  const unlockedCount = entries.filter((e) => e.unlocked).length;
  const completionPercentage = Math.round((unlockedCount / entries.length) * 100);

  const filteredEntries =
    activeCategory === 'ALL'
      ? entries
      : entries.filter((e) => e.category === activeCategory);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#070b10] border-2 border-cyan-800 shadow-[0_0_35px_rgba(0,255,170,0.25)] flex flex-col font-mono text-cyan-400 select-none overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-cyan-900 bg-black/60 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#00FFAA] rounded-full animate-ping" />
            <h2 className="font-bold text-white tracking-widest text-sm">
              ASTRAEA KODEX-ARCHIV // SEKTOR-HISTORIE & KAUSALITÄT
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#00FFAA] bg-cyan-950 px-3 py-1 border border-cyan-800">
              VOLLSTÄNDIGKEIT: {completionPercentage}% ({unlockedCount}/{entries.length} PROTOKOLLE)
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white px-2 py-1 border border-cyan-900 text-xs"
            >
              SCHLIESSEN [ESC]
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Category & Entries Sidebar */}
          <div className="w-full md:w-80 border-r border-cyan-900/60 bg-[#05080c] flex flex-col shrink-0">
            {/* Category Filter Tabs */}
            <div className="p-2 border-b border-cyan-950 flex flex-wrap gap-1 text-[10px]">
              {['ALL', 'CHRONOS', 'FACTIONS', 'INCIDENTS', 'ENTROPY'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    audio.playHoverPing();
                  }}
                  className={`px-2 py-1 border transition-colors ${
                    activeCategory === cat
                      ? 'border-[#00FFAA] bg-cyan-950 text-[#00FFAA]'
                      : 'border-cyan-950 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Entry List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredEntries.map((entry) => {
                const isSelected = entry.id === selectedEntryId;
                return (
                  <button
                    key={entry.id}
                    onClick={() => {
                      setSelectedEntryId(entry.id);
                      audio.playSelectClick();
                    }}
                    className={`w-full text-left p-2.5 border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'border-[#00FFAA] bg-cyan-950/80 text-white shadow-[0_0_10px_rgba(0,255,170,0.2)]'
                        : 'border-cyan-950 bg-black/40 text-gray-400 hover:border-cyan-800 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] text-cyan-600 mb-0.5">
                      <span>{entry.code}</span>
                      <span>{entry.unlocked ? 'KLARSTUFE ' + entry.clearanceLevel : '[GESPERRT]'}</span>
                    </div>
                    <div className="font-bold truncate text-[11px]">
                      {entry.unlocked ? entry.title : '••••••••••••••••••••••••••••'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reader Area */}
          <div className="flex-1 p-6 bg-black/50 overflow-y-auto flex flex-col justify-between space-y-6">
            {selectedEntry.unlocked ? (
              <div className="space-y-4">
                <div className="border-b border-cyan-900 pb-3">
                  <div className="flex justify-between text-xs text-cyan-500 mb-1">
                    <span>REGISTRIER-CODE: {selectedEntry.code}</span>
                    <span>DATUM: {selectedEntry.date}</span>
                  </div>
                  <h1 className="text-lg font-bold text-white tracking-wide">
                    {selectedEntry.title}
                  </h1>
                  <div className="text-xs text-gray-400 mt-1">
                    AUTOR: <strong className="text-cyan-300">{selectedEntry.author}</strong> //
                    SICHERHEITS-FREIGABE: STUFE {selectedEntry.clearanceLevel}
                  </div>
                </div>

                <div className="p-4 bg-black/70 border border-cyan-950 text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-mono">
                  {selectedEntry.content}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-8 border border-dashed border-red-900/60 bg-red-950/10">
                <div className="text-red-500 font-bold text-sm tracking-widest">
                  [DATENKERN VERSCHLÜSSELT]
                </div>
                <p className="text-xs text-gray-400 max-w-md">
                  Dieses Protokoll erfordert höhere Kausalitäts-Freigabe oder das Bergen von
                  Daten-Relikten in den tieferen Sektoren von Stratum-09.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-cyan-950 flex justify-between text-[11px] text-gray-500">
              <span>ASTRAEA NEURAL-LINK ARCHIV // 2185 PROTOCOL NULL</span>
              <span>TASTATUR: [ESC] ZURÜCK ZUM TERMINAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
