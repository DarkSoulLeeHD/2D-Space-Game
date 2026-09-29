// services/dialogueAudio.ts - Prozedurale Teletype- & Fraktions-Audio-Synthese via Web Audio API

import { ProceduralAudioEngine } from './audioEngine';
import { FactionId } from '../types/narrative';

export class DialogueAudioEngine {
  private static instance: DialogueAudioEngine | null = null;

  public static getInstance(): DialogueAudioEngine {
    if (!DialogueAudioEngine.instance) {
      DialogueAudioEngine.instance = new DialogueAudioEngine();
    }
    return DialogueAudioEngine.instance;
  }

  private getCtx(): AudioContext | null {
    return ProceduralAudioEngine.getInstance().ctx;
  }

  // 1. Schreibmaschinen-Klick (Teletype Chitter)
  public playTypewriterClick(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Hoher, stochastisch variierender Klick-Ton (800 bis 1400 Hz)
      const randomFreq = 800 + Math.random() * 600;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(randomFreq, now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.018);
    } catch {
      // Audio fallback
    }
  }

  // 2. Fraktions-Fanfare / Signatur-Ton
  public playFactionStinger(faction: FactionId): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (faction === 'ASTRAEA') {
        // Kalter, perfekter Quint-Akkord
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.08);
      } else if (faction === 'HERETICS') {
        // Dissonanter Sägezahn-Abfall
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
      } else {
        // Dumpfer, industrieller Impuls (GUILD)
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.2);
      }

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // 3. Chrono-Dilemma Countdown-Tick
  public playDilemmaTick(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.03);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio fallback
    }
  }

  // 4. Terminal-Kollaps beim Schließen (Phosphor-Linie)
  public playTerminalCollapse(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }
}
