import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IMapNode,
  IMissionDossier,
  ThreatLevel,
  THREAT_CONFIGS,
  AFFIX_POOL,
} from '../types/mission';
import { fetchMissionBriefing } from '../services/geminiIntelService';
import { ProceduralAudioEngine } from '../services/audioEngine';
import { SettingsService } from '../services/settingsService';
import { SectorMapCanvas } from './SectorMapCanvas';

interface OperationsHubProps {
  sectorId: number;
  sectorName: string;
  onBackToDeck: () => void;
  onLaunchMission: (missionParams: {
    sectorId: number;
    sectorName: string;
    node: IMapNode;
    threatLevel: ThreatLevel;
    activeAffixes: string[];
    dossier: IMissionDossier;
  }) => void;
}

// 7 Prozedurale DAG-Knoten für die Infiltration
const DEFAULT_DAG_NODES: IMapNode[] = [
  {
    id: 'node-0',
    type: 'SALVAGE',
    label: 'SCHLEUSE 05',
    title: 'Einstiegsschleuse 05',
    depth: 0,
    x: 0.12,
    y: 0.45,
    connections: ['node-1', 'node-2'],
    completed: true,
    active: true,
  },
  {
    id: 'node-1',
    type: 'COMBAT',
    label: 'DEPOT ALPHA',
    title: 'Munitionslager Alpha',
    depth: 1,
    x: 0.36,
    y: 0.28,
    connections: ['node-3', 'node-4'],
    completed: false,
    active: true,
  },
  {
    id: 'node-2',
    type: 'HAZARD',
    label: 'GIFTLABOR',
    title: 'Kryo-Biolabor',
    depth: 1,
    x: 0.36,
    y: 0.68,
    connections: ['node-4', 'node-5'],
    completed: false,
    active: true,
  },
  {
    id: 'node-3',
    type: 'COMBAT',
    label: 'REAKTOR-SÜD',
    title: 'Kühlkreis Süd',
    depth: 2,
    x: 0.64,
    y: 0.24,
    connections: ['node-6'],
    completed: false,
    active: false,
  },
  {
    id: 'node-4',
    type: 'EVENT',
    label: 'DATEN-KNOTEN',
    title: 'Terminal-Archiv',
    depth: 2,
    x: 0.64,
    y: 0.48,
    connections: ['node-6'],
    completed: false,
    active: false,
  },
  {
    id: 'node-5',
    type: 'HAZARD',
    label: 'WARTUNGSGANG',
    title: 'Rohrschacht 4B',
    depth: 2,
    x: 0.64,
    y: 0.74,
    connections: ['node-6'],
    completed: false,
    active: false,
  },
  {
    id: 'node-6',
    type: 'BOSS',
    label: 'APEX-KERN',
    title: 'Wächter Nilus Reaktor',
    depth: 3,
    x: 0.88,
    y: 0.48,
    connections: [],
    completed: false,
    active: false,
  },
];

export const OperationsHub: React.FC<OperationsHubProps> = ({
  sectorId,
  sectorName,
  onBackToDeck,
  onLaunchMission,
}) => {
  const [nodes, setNodes] = useState<IMapNode[]>(DEFAULT_DAG_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-1');
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>(2);
  const [dossier, setDossier] = useState<IMissionDossier | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(true);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);
  const [countdownTimer, setCountdownTimer] = useState<number>(1122); // 18:42 in sec
  const [notification, setNotification] = useState<string | null>(null);

  const audio = ProceduralAudioEngine.getInstance();
  const settings = SettingsService.loadSettings();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[1];
  }, [nodes, selectedNodeId]);

  // Dynamic Affixes based on Threat level
  const activeAffixes = useMemo(() => {
    const count = THREAT_CONFIGS[threatLevel].affixCount;
    return AFFIX_POOL.slice(0, count);
  }, [threatLevel]);

  // Estimated loot reward
  const lootEstimate = useMemo(() => {
    const mult = THREAT_CONFIGS[threatLevel].lootMult;
    return {
      nanites: Math.round(850 * mult),
      crystals: Math.round(2 * mult),
    };
  }, [threatLevel]);

  // Load Mission Briefing via Gemini Flash or Fallback
  const loadBriefing = useCallback(async (node: IMapNode, threat: ThreatLevel) => {
    setIsLoadingAi(true);
    try {
      const apiKey = settings.aiCore.apiKey;
      const data = await fetchMissionBriefing(apiKey, node.type, sectorName, threat);
      setDossier(data);
    } catch {
      showToast('OFFLINE-BRIEFING GENERIERT');
    } finally {
      setIsLoadingAi(false);
    }
  }, [settings.aiCore.apiKey, sectorName]);

  // Refetch when selected node or threat level changes
  useEffect(() => {
    loadBriefing(selectedNode, threatLevel);
  }, [selectedNode, threatLevel, loadBriefing]);

  // Countdown timer for anomaly window
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTimer((prev) => (prev > 0 ? prev - 1 : 1200));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Launch Deployment Transition
  const handleLaunch = () => {
    if (isLaunching) return;

    audio.playLaunchKlaxon();
    setIsLaunching(true);

    setTimeout(() => {
      onLaunchMission({
        sectorId,
        sectorName,
        node: selectedNode,
        threatLevel,
        activeAffixes: activeAffixes.map((a) => a.name),
        dossier: dossier || {
          codename: `OPERATION INFILTRATION-${selectedNode.label}`,
          objective: `Säuberung von ${sectorName}`,
          environmentalHazards: ['Vakuum-Leck'],
          enemyThreats: ['Chrono-Kriecher'],
          tacticalAdvice: 'Positionen halten und Munition sparen.',
        },
      });
    }, 850);
  };

  // Keyboard Navigation: [1-3] Threat, Space: Radar sweep, Enter: Launch, Esc: Back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToDeck();
      } else if (e.key === ' ') {
        e.preventDefault();
        audio.playRadarSweep();
        showToast('RADAR-SWEEP INITIALISIERT // 1.200km REICHWEITE');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleLaunch();
      } else if (e.key === '1') {
        setThreatLevel(1);
        audio.playHoverPing();
      } else if (e.key === '2') {
        setThreatLevel(2);
        audio.playHoverPing();
      } else if (e.key === '3') {
        setThreatLevel(3);
        audio.playHoverPing();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch, onBackToDeck, audio]);

  return (
    <div className="relative w-screen h-screen bg-[#06080d] text-[#d8e2dc] font-mono overflow-hidden select-none flex flex-col justify-between">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 right-8 z-50 bg-cyan-950/95 border border-cyan-400 px-4 py-2 text-xs text-cyan-300 shadow-[0_0_20px_rgba(0,255,170,0.5)]">
          &gt; {notification}
        </div>
      )}

      {/* Launch Flash Overlay */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 bg-cyan-300/20 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-100">
          <div className="p-8 border-2 border-cyan-400 bg-black/90 shadow-[0_0_50px_rgba(0,255,170,0.8)] max-w-xl space-y-4">
            <div className="text-xl sm:text-2xl font-black text-[#00FFAA] tracking-widest animate-pulse">
              &gt;&gt; DROP-POD DEPLOYMENT INITIALISIERT &lt;&lt;
            </div>
            <div className="text-xs text-cyan-300 font-bold tracking-widest">
              AIRLOCK VAKUUM-FREIGABE ERFOLGT // KERN-SYNC BEI 100%
            </div>
            <div className="w-full h-2 bg-slate-900 border border-cyan-700 overflow-hidden">
              <div className="h-full bg-cyan-400 animate-[pulse_0.4s_infinite]" />
            </div>
          </div>
        </div>
      )}

      {/* CRT Scanline Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] opacity-35"
      />

      {/* ========================================================================= */}
      {/* SEKTOR-HEADER: STATUS & WELT-ENTROPIE */}
      {/* ========================================================================= */}
      <header className="relative z-30 h-14 px-4 sm:px-6 flex items-center justify-between border-b border-cyan-900/60 bg-[#070b10] text-xs text-cyan-300 font-medium shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 truncate">
          <div className="flex items-center gap-2 font-bold tracking-widest text-[#00FFAA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] animate-pulse" />
            ASTRAEA ORBITAL RECON // SEKTOR-ANALYSE TERMINAL v5.1
          </div>
          <span className="hidden md:inline text-cyan-400 font-semibold">// SICHERHEITS-STUFE: OPERATIVE</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-5 text-[11px] sm:text-xs">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">LOKATION:</span>{' '}
            <strong className="text-gray-100 font-bold">{sectorName}</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">ENTROPIE-DRIFT:</span>{' '}
            <strong className="text-amber-400 font-bold">68.4%</strong>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/40 border border-cyan-800/60">
            <span className="text-cyan-300 font-semibold">ANOMALIE-FENSTER:</span>{' '}
            <strong className="text-cyan-200 font-bold">{formatTimer(countdownTimer)} MIN</strong>
          </div>
          <button
            onClick={onBackToDeck}
            className="px-3 py-1 bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold hover:bg-cyan-500 hover:text-black transition-colors"
          >
            [ESC / DECK]
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2-SPALTEN-MASTER-GRID (SPALTE 1: DAG-KARTE 60% // SPALTE 2: DOSSIER 40%) */}
      {/* ========================================================================= */}
      <main className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* ----------------------------------------------------------------------- */}
        {/* SPALTE 1: VERZWEIGTE KNOTEN-KARTE (7 SPALTEN // ~60% BREITE) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-7 relative border-b lg:border-b-0 lg:border-r border-cyan-900/60 bg-[#06080d] flex flex-col overflow-hidden">
          {/* Top Bar with Map Legend */}
          <div className="h-10 px-3 bg-[#080c12] border-b border-cyan-900/60 flex items-center justify-between text-[10px] text-cyan-400">
            <span className="font-bold tracking-wider">KNOTEN-TYPEN:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#E07A5F]">
                <span className="w-2 h-2 rounded-full bg-[#E07A5F]" /> Gefecht
              </span>
              <span className="flex items-center gap-1 text-[#00FFAA]">
                <span className="w-2 h-2 rounded-full bg-[#00FFAA]" /> Bergung
              </span>
              <span className="flex items-center gap-1 text-[#FFB703]">
                <span className="w-2 h-2 rounded-full bg-[#FFB703]" /> Gefahr
              </span>
              <span className="flex items-center gap-1 text-[#8D99AE]">
                <span className="w-2 h-2 rounded-full bg-[#8D99AE]" /> Event
              </span>
              <span className="flex items-center gap-1 text-[#E63946] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#E63946]" /> Apex-Boss
              </span>
            </div>
          </div>

          {/* Procedural DAG Canvas */}
          <div className="relative flex-1 w-full min-h-[360px]">
            <SectorMapCanvas
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              onSelectNode={(node) => {
                setSelectedNodeId(node.id);
                showToast(`KNOTEN GEWÄHLT: ${node.label}`);
              }}
              isLaunching={isLaunching}
            />
          </div>

          {/* Quick Radar sweep trigger banner */}
          <div className="h-12 px-4 bg-[#090d14] border-t border-cyan-900/60 flex items-center justify-between text-xs">
            <div className="text-[11px] text-gray-400">
              FOKUSSIERTER SPRUNG-KNOTEN:{' '}
              <strong className="text-white">{selectedNode.label} ({selectedNode.title})</strong>
            </div>
            <button
              onClick={() => {
                audio.playRadarSweep();
                showToast('RADAR-SWEEP AKTIV');
              }}
              className="px-3 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-bold hover:bg-cyan-500 hover:text-black transition-colors"
            >
              [LEERTASTE] RADAR-SCAN
            </button>
          </div>
        </section>

        {/* ----------------------------------------------------------------------- */}
        {/* SPALTE 2: TAKTISCHES EINSATZ-DOSSIER & GEMINI FEED (5 SPALTEN // ~40% BREITE) */}
        {/* ----------------------------------------------------------------------- */}
        <section className="lg:col-span-5 bg-[#070b10] p-4 sm:p-5 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Dossier Card Header */}
            <div className="border-b border-cyan-900/60 pb-3">
              <div className="flex items-center justify-between text-[10px] text-cyan-500 font-bold tracking-widest mb-1">
                <span>[GEMINI 2.5 FLASH TACTICAL FEED]</span>
                {isLoadingAi ? (
                  <span className="text-amber-400 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    DECHIFFRIERE...
                  </span>
                ) : (
                  <span className="text-[#00FFAA]">[SYNC: AKTIV]</span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-100 tracking-wider">
                {dossier?.codename || 'OPERATION PROTOKOLL-NULL'}
              </h2>
              <p className="text-xs text-cyan-300 mt-1 leading-relaxed">
                {dossier?.objective || 'Verbindung zum Taktik-Computer wird aufgebaut...'}
              </p>
            </div>

            {/* Feind-Intelligence & Gefahren */}
            <div className="space-y-3 text-xs">
              {/* Feind-Scans */}
              <div className="p-3 bg-black/50 border border-cyan-900/60 space-y-1.5">
                <div className="text-[10px] text-red-400 font-bold tracking-wider">
                  FEIND-INTELLIGENCE:
                </div>
                {dossier?.enemyThreats && dossier.enemyThreats.length > 0 ? (
                  dossier.enemyThreats.map((threat, idx) => (
                    <div key={idx} className="text-gray-200 text-[11px] flex items-start gap-1.5 font-medium">
                      <span className="text-red-400 font-bold">&bull;</span>
                      <span>{threat}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-cyan-300 text-[11px] font-medium">Scanne Sensor-Signaturen...</div>
                )}
              </div>

              {/* Umgebungs-Gefahren */}
              <div className="p-3 bg-black/50 border border-cyan-900/60 space-y-1.5">
                <div className="text-[10px] text-amber-300 font-bold tracking-wider">
                  UMGEBUNGS-AFFIXE (MODIFIKATOREN):
                </div>
                {activeAffixes.length > 0 ? (
                  activeAffixes.map((affix) => (
                    <div key={affix.id} className="text-gray-200 text-[11px] font-medium">
                      <span className={affix.type === 'BUFF' ? 'text-[#00FFAA] font-bold' : 'text-amber-300 font-bold'}>
                        [{affix.type === 'BUFF' ? '+' : '!'}] {affix.name}:
                      </span>{' '}
                      <span className="text-slate-200">{affix.desc}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-300 text-[11px] font-medium">
                    Keine Umwelt-Affixe auf Stufe Kadett aktiv.
                  </div>
                )}
              </div>

              {/* Taktischer Ratschlag */}
              {dossier?.tacticalAdvice && (
                <div className="p-2.5 bg-cyan-950/30 border border-cyan-700/60 text-[11px] text-cyan-200 italic font-medium">
                  &gt; Astraea Rat: &quot;{dossier.tacticalAdvice}&quot;
                </div>
              )}
            </div>

            {/* Difficulty Modifier Selector */}
            <div className="space-y-2 pt-2 border-t border-cyan-950">
              <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold">
                <span>SCHWIERIGKEITS-MODIFIKATOR [1-3]:</span>
                <span className="text-cyan-200 font-mono font-bold">
                  RISK: x{THREAT_CONFIGS[threatLevel].lootMult} BEUTE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as ThreatLevel[]).map((lvl) => {
                  const cfg = THREAT_CONFIGS[lvl];
                  const isSelected = threatLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => {
                        setThreatLevel(lvl);
                        audio.playHoverPing();
                      }}
                      className={`p-2 border text-center text-xs font-mono font-bold cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(0,255,170,0.3)]'
                          : 'border-cyan-800 bg-black/50 text-slate-200 hover:border-cyan-500'
                      }`}
                    >
                      <div>[{lvl}] {cfg.label}</div>
                      <div className="text-[9px] text-cyan-200 font-medium mt-0.5">
                        +{Math.round((cfg.lootMult - 1) * 100)}% Loot
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loot Yield Estimate */}
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 text-xs flex items-center justify-between">
              <span className="text-gray-200 font-bold">PROGNOSTIZIERTER BEUTE-ERTRAG:</span>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="text-[#00FFAA]">~{lootEstimate.nanites} TN</span>
                <span className="text-amber-300">~{lootEstimate.crystals} CK</span>
              </div>
            </div>
          </div>

          {/* Launch Action Gate */}
          <div className="pt-4 border-t border-cyan-950 mt-4">
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              className="w-full py-4 bg-[#00FFAA] text-black font-extrabold tracking-[0.2em] text-sm hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_35px_rgba(0,255,170,0.6)] cursor-pointer"
            >
              [ &gt; ] DROP-POD STARTEN (ENTER)
            </button>
            <div className="text-[10px] text-center text-cyan-200 font-medium mt-2">
              DRÜCKE [ENTER] ODER KLICKE ZUM BEGINN DER INFILTRATION
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* SEKTOR-FOOTER: LAUNCH-GATE BEFEHLSLEISTE */}
      {/* ========================================================================= */}
      <footer className="relative z-30 h-12 px-4 sm:px-6 flex items-center justify-between border-t border-cyan-900/60 bg-[#070b10] text-[10px] sm:text-xs text-cyan-300 font-medium shrink-0">
        <div className="flex items-center gap-4 text-slate-200">
          <span>[LEERTASTE] RADAR-SCAN</span>
          <span className="hidden sm:inline">[1-3] BEDROHUNG</span>
          <span className="hidden md:inline">[KNOTEN-KLICK] AUSWAHL</span>
          <span>[ENTER] STARTEN</span>
          <span>[ESC] HAUPTDECK</span>
        </div>

        <div className="text-cyan-200 font-medium">
          STATUS: <strong className="text-[#00FFAA]">SPRUNG BEREIT</strong> // GEMINI-FLASH v2.5
        </div>
      </footer>
    </div>
  );
};
