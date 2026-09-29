// services/economyAudio.ts - Prozedurale Web Audio Handels- und Börsen-Synthese (SYS-ECON-13)

import { ProceduralAudioEngine } from './audioEngine';

export class EconomyAudioEngine {
  private static instance: EconomyAudioEngine | null = null;
  private ctx: AudioContext | null = null;

  public static getInstance(): EconomyAudioEngine {
    if (!EconomyAudioEngine.instance) {
      EconomyAudioEngine.instance = new EconomyAudioEngine();
    }
    return EconomyAudioEngine.instance;
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

  // 1. Kauf-Erfolg: Doppelter hoher Kristall-Ping
  public playPurchaseSuccess(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [1760, 2640].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
    } catch {
      // Audio fallback
    }
  }

  // 2. Verkauf / Scrap: Mechanisches Zischen & Kassenschlag
  public playItemSold(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio fallback
    }
  }

  // 3. Transaktion Abgelehnt (Zu wenig Credits / Naniten / Embargo)
  public playTransactionDenied(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [130, 110].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = idx * 0.08;

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.linearRampToValueAtTime(0.001, now + delay + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    } catch {
      // Audio fallback
    }
  }

  // 4. Meta-Forschung freigeschaltet (Majestätischer C-Dur Akkord: C5, E5, G5, C6)
  public playResearchUnlockChord(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.65);
      });
    } catch {
      // Audio fallback
    }
  }

  // 5. Mystery Crate Unboxing Schwingung
  public playCrateOpening(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Rising sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);

      // Climax chime
      setTimeout(() => {
        this.playPurchaseSuccess();
      }, 380);
    } catch {
      // Audio fallback
    }
  }

  // 6. Subtiler Terminal-Tab / Merchant Wechsel
  public playMerchantSwitch(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio fallback
    }
  }
}
