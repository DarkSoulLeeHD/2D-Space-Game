// services/enemyAudio.ts - Prozedurale Feind- & Boss-Audiosynthese via Web Audio API

import { ProceduralAudioEngine } from './audioEngine';

export class EnemyAudioEngine {
  private static instance: EnemyAudioEngine | null = null;

  public static getInstance(): EnemyAudioEngine {
    if (!EnemyAudioEngine.instance) {
      EnemyAudioEngine.instance = new EnemyAudioEngine();
    }
    return EnemyAudioEngine.instance;
  }

  private getCtx(): AudioContext | null {
    const parent = ProceduralAudioEngine.getInstance();
    return parent.ctx;
  }

  // 1. Praetor-Mech Bewegung: Mechanisches Servo-Surren
  public playMechServo(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(840, now + 0.08);
      osc.frequency.linearRampToValueAtTime(310, now + 0.16);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.16);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  // 2. Kriecher-Huschschritt: Gefiltertes Insekten-Rascheln
  public playCreeperSkitter(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const length = Math.floor(ctx.sampleRate * 0.07);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3500;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch {
      // Audio fallback
    }
  }

  // 3. Boss-Schlag Aufladung: Tiefer Infraschall-Impuls
  public playBossChargeHum(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(42, now);
      osc.frequency.exponentialRampToValueAtTime(85, now + 0.4);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio fallback
    }
  }

  // 4. Seismischer Einschlag: Wuchtige Tiefbass-Detonation
  public playSeismicImpact(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio fallback
    }
  }

  // 5. Sektor Gesichert Fanfare: Harmonische Phosphor-Akkordfolge
  public playVictoryFanfare(): void {
    const ctx = this.getCtx();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const freqs = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      const now = ctx.currentTime;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const start = now + idx * 0.08;
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // Audio fallback
    }
  }
}
