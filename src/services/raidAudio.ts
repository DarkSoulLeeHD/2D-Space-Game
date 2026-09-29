// services/raidAudio.ts - Prozedurale Web Audio Raid- & Bifurkations-Synthese (SYS-ENDG-14)

import { ProceduralAudioEngine } from './audioEngine';

export class RaidAudioEngine {
  private static instance: RaidAudioEngine | null = null;
  private ctx: AudioContext | null = null;

  public static getInstance(): RaidAudioEngine {
    if (!RaidAudioEngine.instance) {
      RaidAudioEngine.instance = new RaidAudioEngine();
    }
    return RaidAudioEngine.instance;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.ctx || this.ctx.state === 'closed') {
      const engine = ProceduralAudioEngine.getInstance();
      if (!engine.ctx) {
        engine.initAudio();
      }
      this.ctx = engine.ctx;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. Enrage-Sirene: Doppelter Sägezahn-Heulton (220 -> 880 -> 220 Hz)
  public playEnrageKlaxon(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.4);
      osc.frequency.linearRampToValueAtTime(220, now + 0.8);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } catch {
      // Audio fallback
    }
  }

  // 2. Kausalitäts-Bruch (Bifurkations-Whoosh zwischen den Grids)
  public playGridShiftWhoosh(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(4500, now + 0.18);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.35);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // Audio fallback
    }
  }

  // 3. Kausalitäts-Auslöser: Resonanter Quanten-Puls (Vergangenheit verändert Zukunft)
  public playCausalityTrigger(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [587.33, 880.0, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + delay + 0.25);

        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  // 4. Kern-Extraktion / Sieg: Majestätischer Null-Zonen-Akkord
  public playCoreExtractedChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880, 1108.73].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.8);
      });
    } catch {
      // Audio fallback
    }
  }
}
