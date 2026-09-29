// components/NarrativeTerminal.tsx - Die Narrative Kampagne, Terminal-Dialoge & Kausalitäts-Protokolle

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IFactionReputation,
  INarrativeLogEntry,
  ISpeakerProfile,
  IDialogueChoice,
  FactionId,
} from '../types/narrative';
import { SpeakerPortraitCanvas } from './SpeakerPortraitCanvas';
import { CodexModal } from './CodexModal';
import { DialogueAudioEngine } from '../services/dialogueAudio';
import { fetchDynamicDialogue } from '../services/geminiDialogueService';

interface NarrativeTerminalProps {
  initialFaction?: FactionId;
  sectorName?: string;
  onCloseComms: () => void;
}

const DEFAULT_SPEAKERS: Record<FactionId, ISpeakerProfile> = {
  ASTRAEA: {
    id: 'vesper-chen',
    name: 'DIREKTORIN VESPER CHEN',
    title: 'OBERKOMMANDO // ASTRAEA-DIREKTION',
    faction: 'ASTRAEA',
    themeColor: '#00FFAA',
    glitchLevel: 0.12,
    bio: 'Oberste strategische Leiterin von Stratum-09. Befehlt Operative Vance und wacht über die Reinheit der Chrono-Datenkerne.',
  },
  GUILD: {
    id: 'kaelen-voss',
    name: 'CHEF-INGENIEUR KAELEN VOSS',
    title: 'WERKMEISTER // REAKTOR-GILDE',
    faction: 'GUILD',
    themeColor: '#f59e0b',
    glitchLevel: 0.28,
    bio: 'Vertreter der zivilen Überlebenden und Techniker. Kämpft um den Erhalt der lebenserhaltenden Systeme auf den Unterdecks.',
  },
  HERETICS: {
    id: 'prophetin-mara',
    name: 'PROPHETIN MARA',
    title: 'STIMME DER LEERE // RESONANZ-KETZER',
    faction: 'HERETICS',
    themeColor: '#E07A5F',
    glitchLevel: 0.45,
    bio: 'Ehemalige Astrophysikerin, die durch die Null-Zone transzendiert ist. Sieht in der Entropie keinen Verfall, sondern Erlösung.',
  },
};

const NARRATIVE_STORAGE_KEY = 'CHRONO_NARRATIVE_v1';

export const NarrativeTerminal: React.FC<NarrativeTerminalProps> = ({
  initialFaction = 'ASTRAEA',
  sectorName = 'SEKTOR 04: REAKTOR-BRUCH',
  onCloseComms,
}) => {
  const [activeFaction, setActiveFaction] = useState<FactionId>(initialFaction);
  const [reputation, setReputation] = useState<IFactionReputation>(() => {
    try {
      const saved = localStorage.getItem(NARRATIVE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.reputation) return parsed.reputation;
      }
    } catch {
      // Ignored
    }
    return { astraea: 25, guild: 5, heretics: -30 };
  });

  const [dialogueLogs, setDialogueLogs] = useState<INarrativeLogEntry[]>([]);
  const [currentSpeakerText, setCurrentSpeakerText] = useState<string>('');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [choices, setChoices] = useState<IDialogueChoice[]>([]);
  const [atmosphereNote, setAtmosphereNote] = useState<string>('SICHERHEITS-STUFE 4 // QUANTUM LINK');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [dilemmaTimer, setDilemmaTimer] = useState<number>(6.0); // 6 Sekunden Chrono-Dilemma
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [isCodexOpen, setIsCodexOpen] = useState<boolean>(false);
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);

  const audio = DialogueAudioEngine.getInstance();
  const speaker = DEFAULT_SPEAKERS[activeFaction];
  const typeIndexRef = useRef(0);
  const fullTextRef = useRef('');

  // Save reputation to storage
  useEffect(() => {
    try {
      localStorage.setItem(
        NARRATIVE_STORAGE_KEY,
        JSON.stringify({ reputation, lastUpdated: new Date().toISOString() })
      );
    } catch {
      // Ignored
    }
  }, [reputation]);

  // Load new dialogue chunk
  const loadDialogueForFaction = useCallback(
    async (faction: FactionId, contextDescription: string = '') => {
      setIsTyping(true);
      setDisplayedText('');
      setChoices([]);
      setIsTimerActive(false);
      audio.playFactionStinger(faction);

      const targetSpeaker = DEFAULT_SPEAKERS[faction];
      const repValue = reputation[faction.toLowerCase() as keyof IFactionReputation] || 0;

      const response = await fetchDynamicDialogue(
        '',
        targetSpeaker.name,
        faction,
        contextDescription || `Operative Vance befindet sich in ${sectorName}.`,
        repValue
      );

      setCurrentSpeakerText(response.speakerText);
      fullTextRef.current = response.speakerText;
      typeIndexRef.current = 0;
      setChoices(response.choices);
      if (response.atmosphereNote) {
        setAtmosphereNote(response.atmosphereNote);
      }
    },
    [reputation, sectorName, audio]
  );

  // Initial load
  useEffect(() => {
    loadDialogueForFaction(activeFaction);
  }, []);

  // Teletype Typewriter Effect Loop
  useEffect(() => {
    if (!currentSpeakerText) return;

    typeIndexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      if (typeIndexRef.current < fullTextRef.current.length) {
        const nextChar = fullTextRef.current[typeIndexRef.current];
        typeIndexRef.current += 1;
        setDisplayedText(fullTextRef.current.slice(0, typeIndexRef.current));

        // Teletype audio click on spaces or random letters
        if (nextChar !== ' ' && Math.random() > 0.4) {
          audio.playTypewriterClick();
        }
      } else {
        clearInterval(interval);
        setIsTyping(false);
        // Start 6-second Chrono-Dilemma countdown
        setDilemmaTimer(6.0);
        setIsTimerActive(true);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [currentSpeakerText, audio]);

  // Chrono-Dilemma Timer Countdown
  useEffect(() => {
    if (!isTimerActive) return;

    const timer = setInterval(() => {
      setDilemmaTimer((prev) => {
        const next = Math.max(0, prev - 0.1);

        // Low time ticking audio
        if (next <= 3.0 && Math.round(next * 10) % 10 === 0) {
          audio.playDilemmaTick();
        }

        // Expired -> Trigger Option 4 (Eloquent Silence)
        if (next <= 0) {
          clearInterval(timer);
          setIsTimerActive(false);
          handleSelectChoice(4, true);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isTimerActive]);

  // Execute Choice
  const handleSelectChoice = (choiceId: number, isSilentTimeout: boolean = false) => {
    setIsTimerActive(false);

    let chosenText = '';
    let alignment: FactionId | 'NEUTRAL' = 'NEUTRAL';
    let delta = 0;

    if (isSilentTimeout || choiceId === 4) {
      chosenText = '[SCHWEIGEN BEWAHRT // ZEIT VERSTRICHEN]';
      alignment = 'NEUTRAL';
      delta = 0;
      audio.playDilemmaTick();
    } else {
      const selected = choices.find((c) => c.id === choiceId);
      if (!selected) return;
      chosenText = selected.text;
      alignment = selected.factionAlignment;
      delta = selected.reputationDelta;
      if (alignment !== 'NEUTRAL') {
        audio.playFactionStinger(alignment);
      }
    }

    // Apply reputation change
    if (alignment !== 'NEUTRAL') {
      setReputation((prev) => ({
        ...prev,
        [alignment.toLowerCase()]: Math.min(100, Math.max(-100, (prev[alignment.toLowerCase() as keyof IFactionReputation] || 0) + delta)),
      }));
    }

    // Log Entry
    const newLog: INarrativeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: speaker.name,
      faction: speaker.faction,
      text: displayedText,
      chosenOption: chosenText,
      reputationImpact: delta !== 0 ? `${delta > 0 ? '+' : ''}${delta} ${alignment}` : 'Neutral',
    };
    setDialogueLogs((prev) => [newLog, ...prev]);

    // Next Branch
    setTimeout(() => {
      // Rotate or continue story
      const nextFaction: FactionId =
        alignment !== 'NEUTRAL'
          ? alignment
          : activeFaction === 'ASTRAEA'
          ? 'GUILD'
          : activeFaction === 'GUILD'
          ? 'HERETICS'
          : 'ASTRAEA';

      setActiveFaction(nextFaction);
      loadDialogueForFaction(
        nextFaction,
        `Nach Vances Entscheidung: "${chosenText}". Kausalitäts-Index angepasst.`
      );
    }, 600);
  };

  // Skip / Accelerate typewriter
  const handleSkipTypewriter = () => {
    if (isTyping) {
      setDisplayedText(fullTextRef.current);
      setIsTyping(false);
      setDilemmaTimer(6.0);
      setIsTimerActive(true);
    }
  };

  // Close with collapse animation
  const handleClose = () => {
    setIsCollapsing(true);
    audio.playTerminalCollapse();
    setTimeout(() => {
      onCloseComms();
    }, 200);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCodexOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === ' ' && isTyping) {
        e.preventDefault();
        handleSkipTypewriter();
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCodexOpen(true);
      } else if (['1', '2', '3', '4'].includes(e.key) && !isTyping) {
        handleSelectChoice(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, isCodexOpen, choices]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#05070a] text-cyan-400 font-mono select-none overflow-hidden">
      {/* Codex Modal */}
      <CodexModal isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />

      {/* ========================================================================= */}
      {/* NARRATIV-HEADER: SPRECHER-IDENT & KAUSALITÄTS-EBENE */}
      {/* ========================================================================= */}
      <header className="relative z-20 h-14 border-b border-cyan-900/60 bg-[#070b10] px-4 sm:px-6 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FFAA] animate-ping" />
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-widest text-[11px] sm:text-xs">
              ASTRAEA NEURAL COMMS TERMINAL v10.1 // KAUSALITÄT
            </span>
            <span className="text-[10px] text-cyan-300 font-medium hidden sm:inline">
              LOKATION: {sectorName} // {atmosphereNote}
            </span>
          </div>
        </div>

        {/* Faction Switcher Tabs (For Manual Channel Tuning) */}
        <div className="flex items-center gap-2">
          {(['ASTRAEA', 'GUILD', 'HERETICS'] as FactionId[]).map((fac) => {
            const isCurrent = activeFaction === fac;
            const facTheme = DEFAULT_SPEAKERS[fac].themeColor;
            return (
              <button
                key={fac}
                onClick={() => {
                  setActiveFaction(fac);
                  loadDialogueForFaction(fac);
                }}
                className={`px-2.5 py-1 border text-[10px] font-bold transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-white text-black'
                    : 'border-cyan-900 text-slate-300 hover:border-cyan-600 font-medium'
                }`}
                style={{
                  backgroundColor: isCurrent ? facTheme : 'transparent',
                }}
              >
                {fac}
              </button>
            );
          })}

          <button
            onClick={() => setIsCodexOpen(true)}
            className="hidden sm:inline px-3 py-1 bg-cyan-950 border border-cyan-800 text-cyan-200 hover:bg-cyan-500 hover:text-black text-xs font-bold transition-colors cursor-pointer"
          >
            [K] KODEX-ARCHIV
          </button>

          <button
            onClick={handleClose}
            className="px-2.5 py-1 border border-cyan-900 hover:border-red-500 text-slate-300 hover:text-red-300 text-xs transition-colors cursor-pointer font-medium"
          >
            BEENDEN [ESC]
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MASTER-LAYOUT: GETEILTES TERMINAL (ZONE A & ZONE B/C) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ========================================================================= */}
        {/* ZONE A: PROZEDURALER ASCII/VEKTOR-PORTRAIT CANVAS (LINKS // 35%) */}
        {/* ========================================================================= */}
        <section className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-cyan-900/60 bg-[#06080d] p-4 flex flex-col justify-between shrink-0 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs pb-2 border-b border-cyan-950">
              <span className="font-bold text-white tracking-wider">NEURAL-PORTRAIT</span>
              <span className="text-[10px] font-bold" style={{ color: speaker.themeColor }}>
                {speaker.faction}
              </span>
            </div>

            {/* Canvas 2D Talking Head */}
            <div className="h-64 sm:h-72 w-full">
              <SpeakerPortraitCanvas
                isSpeaking={isTyping}
                glitchIntensity={speaker.glitchLevel}
                themeColor={speaker.themeColor}
                faction={speaker.faction}
                isCollapsing={isCollapsing}
              />
            </div>

            {/* Speaker Dossier */}
            <div className="p-3 bg-black/60 border border-cyan-950 space-y-1 text-xs">
              <div className="font-bold text-white text-[12px]">{speaker.name}</div>
              <div className="text-[10px] text-cyan-300 font-bold">{speaker.title}</div>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed pt-1">{speaker.bio}</p>
            </div>
          </div>

          {/* Faction Reputation Indicators */}
          <div className="p-3 bg-black/70 border border-cyan-950 space-y-2 text-xs">
            <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">
              FRAKTIONS-GUNST // KAUSAL-MATRIX
            </div>

            {/* Astraea */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-300">ASTRAEA-DIREKTION:</span>
                <span className="font-bold text-[#00FFAA]">{reputation.astraea > 0 ? '+' : ''}{reputation.astraea}</span>
              </div>
              <div className="w-full h-1.5 bg-black border border-cyan-950">
                <div
                  className="h-full bg-[#00FFAA] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (reputation.astraea + 100) / 2))}%` }}
                />
              </div>
            </div>

            {/* Guild */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-300">REAKTOR-GILDE:</span>
                <span className="font-bold text-amber-400">{reputation.guild > 0 ? '+' : ''}{reputation.guild}</span>
              </div>
              <div className="w-full h-1.5 bg-black border border-cyan-950">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (reputation.guild + 100) / 2))}%` }}
                />
              </div>
            </div>

            {/* Heretics */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-300">RESONANZ-KETZER:</span>
                <span className="font-bold text-red-400">{reputation.heretics > 0 ? '+' : ''}{reputation.heretics}</span>
              </div>
              <div className="w-full h-1.5 bg-black border border-cyan-950">
                <div
                  className="h-full bg-red-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (reputation.heretics + 100) / 2))}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ZONE B & C: DIALOG-VERLAUF, SCHREIBMASCHINE & ENTSCHEIDUNGEN (RECHTS) */}
        {/* ========================================================================= */}
        <section className="flex-1 flex flex-col justify-between p-4 sm:p-6 bg-[#05070a] overflow-hidden space-y-4">
          {/* ZONE B: DIALOG-VERLAUF (SCHREIBMASCHINEN-EFFEKT) */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {/* Archive / Previous Exchanges */}
            {dialogueLogs.map((log) => (
              <div key={log.id} className="p-3 bg-black/50 border border-cyan-900/80 space-y-1 text-xs">
                <div className="flex justify-between text-[10px] text-cyan-300 font-medium">
                  <span className="font-bold text-cyan-200">[{log.speaker}]</span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-slate-200 italic font-medium">{log.text}</p>
                {log.chosenOption && (
                  <div className="pt-1 text-[11px] text-[#00FFAA] border-t border-cyan-950 mt-1 flex justify-between font-medium">
                    <span>&gt; VANCE: "{log.chosenOption}"</span>
                    <span className="text-[10px] text-slate-300">({log.reputationImpact})</span>
                  </div>
                )}
              </div>
            ))}

            {/* Active Teletype Stream */}
            <div className="p-4 sm:p-6 bg-black/80 border border-cyan-700/80 relative space-y-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between text-xs text-cyan-300 font-medium pb-2 border-b border-cyan-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: speaker.themeColor }} />
                  <strong className="text-white">[{speaker.name}]</strong>
                </div>
                <span className="text-[10px] text-cyan-300 font-bold">LIVE-VOX STREAM</span>
              </div>

              {/* Typewriter Text */}
              <div className="text-sm sm:text-base text-gray-100 font-mono font-medium leading-relaxed min-h-[64px]">
                "{displayedText}"
                {isTyping && <span className="inline-block w-2.5 h-4 ml-1 bg-[#00FFAA] animate-pulse" />}
              </div>

              {isTyping && (
                <div className="text-[10px] text-slate-300 font-medium pt-2 flex justify-between">
                  <span>EMPFANGE QUANTEN-SIGNAL...</span>
                  <span className="text-cyan-300 font-bold">[LEERTASTE] TEXT BESCHLEUNIGEN</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ZONE C: 4-WEGE-ENTSCHEIDUNGS-MATRIX & CHRONO-DILEMMA-TIMER */}
          {/* ========================================================================= */}
          <div className="border-t border-cyan-900/60 pt-4 space-y-3 shrink-0">
            {/* Chrono-Dilemma Timer Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-cyan-300">CHRONO-DILEMMA: ZEITFENSTER</span>
                <span
                  className={`${
                    dilemmaTimer <= 2.0 ? 'text-red-400 animate-ping' : 'text-[#00FFAA]'
                  }`}
                >
                  [ {dilemmaTimer.toFixed(1)}s ]
                </span>
              </div>
              <div className="w-full h-2 bg-black border border-cyan-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-100 ${
                    dilemmaTimer <= 2.0 ? 'bg-red-500' : 'bg-[#00FFAA]'
                  }`}
                  style={{ width: `${(dilemmaTimer / 6.0) * 100}%` }}
                />
              </div>
            </div>

            {/* 4 Choices Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleSelectChoice(choice.id)}
                  disabled={isTyping}
                  className="p-3 text-left border border-cyan-900/80 bg-black/60 hover:bg-cyan-950 hover:border-[#00FFAA] hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group font-medium"
                >
                  <div className="flex justify-between text-[10px] text-cyan-300 group-hover:text-[#00FFAA] mb-1">
                    <span className="font-bold">[{choice.id}] {choice.factionAlignment}</span>
                    <span>{choice.consequenceHint}</span>
                  </div>
                  <div className="text-gray-100 text-xs sm:text-[13px] leading-snug">
                    "{choice.text}"
                  </div>
                </button>
              ))}

              {/* Option 4: Eloquent Silence / Inaction */}
              <button
                onClick={() => handleSelectChoice(4, true)}
                disabled={isTyping}
                className="p-3 text-left border border-dashed border-cyan-800 bg-black/40 hover:border-red-400 hover:text-white transition-all cursor-pointer disabled:opacity-40 group sm:col-span-2 md:col-span-1 font-medium"
              >
                <div className="flex justify-between text-[10px] text-slate-300 group-hover:text-red-400 mb-1">
                  <span className="font-bold">[4] SCHWEIGEN</span>
                  <span>Verstreichen lassen</span>
                </div>
                <div className="text-slate-300 italic text-xs">
                  [Nichts sagen. Den Timer ablaufen lassen.]
                </div>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* NARRATIV-FOOTER: TASTATUR-BEFEHLE */}
      {/* ========================================================================= */}
      <footer className="h-10 border-t border-cyan-900/60 bg-[#070b10] px-4 flex items-center justify-between text-[11px] text-gray-400 shrink-0">
        <div className="flex items-center gap-4">
          <span><strong className="text-cyan-300">[1-4]</strong> ANTWORT WÄHLEN</span>
          <span className="hidden sm:inline"><strong className="text-cyan-300">[LEERTASTE]</strong> TEXT BESCHLEUNIGEN</span>
          <span><strong className="text-cyan-300">[K]</strong> KODEX-ARCHIV</span>
        </div>
        <div>
          <span>AICR-7 TERMINAL // PROTOCOL NULL KAUSALITÄT</span>
        </div>
      </footer>
    </div>
  );
};
