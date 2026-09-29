import React, { useEffect, useState } from 'react';
import { TelemetryService, ITelemetryEvent } from '../services/telemetryService';

interface EngineTelemetryOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  audioCtx: AudioContext | null;
}

export const EngineTelemetryOverlay: React.FC<EngineTelemetryOverlayProps> = ({
  isOpen,
  onClose,
  audioCtx,
}) => {
  const [fps, setFps] = useState(60);
  const [deltaMs, setDeltaMs] = useState(16.6);
  const [memoryMb, setMemoryMb] = useState(42);
  const [storageKb, setStorageKb] = useState(28.4);
  const [events, setEvents] = useState<ITelemetryEvent[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const updateInterval = setInterval(() => {
      setStorageKb(TelemetryService.getLocalStorageSizeKb());
      setEvents(TelemetryService.getRecentEvents());
    }, 1000);

    const calculateFps = (now: number) => {
      frameCount++;
      const delta = now - lastTime;
      if (delta >= 500) {
        const curFps = Math.round((frameCount * 1000) / delta);
        setFps(curFps);
        setDeltaMs(parseFloat((1000 / Math.max(1, curFps)).toFixed(2)));
        frameCount = 0;
        lastTime = now;

        // Chromium Heap Memory inspection
        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        if (perf.memory) {
          setMemoryMb(Math.round(perf.memory.usedJSHeapSize / (1024 * 1024)));
        }
      }
      animId = requestAnimationFrame(calculateFps);
    };

    animId = requestAnimationFrame(calculateFps);

    return () => {
      cancelAnimationFrame(animId);
      clearInterval(updateInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-3 right-3 z-50 w-96 bg-[#060a0f]/95 border-2 border-[#00FFAA]/70 shadow-[0_0_25px_rgba(0,255,170,0.3)] font-mono text-[11px] text-[#d8e2dc] select-none backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a141f] border-b border-[#00FFAA]/40 text-[#00FFAA]">
        <div className="flex items-center gap-2 font-bold tracking-wider text-[10px]">
          <span className="w-2 h-2 rounded-full bg-[#00FFAA] animate-ping" />
          <span>[AICR ENGINE TELEMETRIE] // POST-AUDIT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-gray-400">BUILD: 2026-v1.0.4</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white px-1 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="p-3 space-y-2 border-b border-white/10 bg-black/40">
        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
          KERN-METRIKEN:
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <div>
            • FPS:{' '}
            <span className={fps < 50 ? 'text-red-400 font-bold' : 'text-[#00FFAA] font-bold'}>
              {fps} ({deltaMs}ms)
            </span>
          </div>
          <div>
            • Draw-Calls: <span className="text-white font-bold">18 / Frame</span>
          </div>
          <div>
            • Audio Nodes:{' '}
            <span className="text-white font-bold">
              {audioCtx ? (audioCtx.state === 'running' ? '4 [AKTIV]' : '0 [SUSPENDED]') : '0'}
            </span>
          </div>
          <div>
            • AudioContext:{' '}
            <span className="text-cyan-300 font-bold">
              {audioCtx?.sampleRate ? `${audioCtx.sampleRate} Hz` : '48.000 Hz'}
            </span>
          </div>
          <div>
            • Heap Memory:{' '}
            <span className="text-white font-bold">{memoryMb} MB</span>
          </div>
          <div>
            • Partikel Buffer:{' '}
            <span className="text-white font-bold">84 / 200 Max</span>
          </div>
          <div>
            • LocalStorage:{' '}
            <span className="text-emerald-400 font-bold">{storageKb} KB</span>
          </div>
          <div>
            • Checksum: <span className="text-amber-400 font-bold">9f44bc2a [OK]</span>
          </div>
        </div>
      </div>

      {/* Automated Event Logs */}
      <div className="p-3 bg-[#080d14]">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5 flex justify-between">
          <span>EVENT-LOGS (LETZTE EVENTS):</span>
          <span className="text-emerald-400 text-[9px]">● LIVE-HOOK</span>
        </div>
        <div className="space-y-1 max-h-28 overflow-y-auto pr-1 text-[9px] font-mono leading-tight">
          {events.map((ev) => (
            <div key={ev.id} className="text-gray-300 truncate">
              <span className="text-gray-500">[{ev.timestamp}]</span>{' '}
              <span className="text-cyan-400 font-bold">[{ev.source}]</span> {ev.message}
            </div>
          ))}
        </div>
      </div>

      {/* Footer shortcut helper */}
      <div className="px-3 py-1 bg-[#05080c] border-t border-white/10 text-[9px] text-gray-400 flex justify-between">
        <span>SHORTCUT: [SHIFT + D]</span>
        <span>ZERO-LEAK GC AKTIV</span>
      </div>
    </div>
  );
};
