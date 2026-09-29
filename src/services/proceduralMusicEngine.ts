// services/proceduralMusicEngine.ts - Prozeduraler Web Audio Multi-Stem Sequencer mit Lookahead-Scheduling

export type MusicState = 'EXPLORATION' | 'COMBAT' | 'CHRONO_STASIS' | 'VICTORY' | 'DEFEAT';

export class ProceduralMusicEngine {
  private ctx: AudioContext;
  private isRunning: boolean = false;
  private currentBpm: number = 75;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private timerId: number | null = null;

  // Audio-Busse & Nodes
  public musicBusGain: GainNode;
  private masterCompressor: DynamicsCompressorNode;
  private droneGain: GainNode;
  private beatGain: GainNode;
  private arpGain: GainNode;
  private filterNode: BiquadFilterNode;

  // Drone Layer Oscillators
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  // Aktiver Musik-Status
  public state: MusicState = 'EXPLORATION';

  constructor(ctx: AudioContext, destinationNode?: AudioNode) {
    this.ctx = ctx;

    // Master-Dynamikkompressor (Verhindert Übersteuern & summiert die Stems harmonisch)
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = -16;
    this.masterCompressor.knee.value = 8;
    this.masterCompressor.ratio.value = 4;
    this.masterCompressor.attack.value = 0.005;
    this.masterCompressor.release.value = 0.15;

    // Busse & Filter initialisieren
    this.musicBusGain = this.ctx.createGain();
    this.droneGain = this.ctx.createGain();
    this.beatGain = this.ctx.createGain();
    this.arpGain = this.ctx.createGain();

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 3500;

    // Signal-Kette verbinden
    this.droneGain.connect(this.musicBusGain);
    this.beatGain.connect(this.musicBusGain);
    this.arpGain.connect(this.musicBusGain);

    this.musicBusGain.connect(this.filterNode);
    this.filterNode.connect(this.masterCompressor);

    if (destinationNode) {
      this.masterCompressor.connect(destinationNode);
    } else {
      this.masterCompressor.connect(this.ctx.destination);
    }

    this.setMusicState('EXPLORATION');
  }

  // 1. Scheduler-Herzschlag (Lookahead-Scheduling nach Chris Wilson)
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.startDroneLayer();
    this.scheduler();
  }

  private scheduler = (): void => {
    // Plane alle Noten für die nächsten 100ms auf der Audiouhr ein
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }
    if (this.isRunning) {
      this.timerId = window.setTimeout(this.scheduler, 25);
    }
  };

  private advanceNote(): void {
    const secondsPerBeat = 60.0 / this.currentBpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16tel-Note
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  // 2. Noten-Verteilung nach Rhythmus-Schablone & State
  private scheduleNote(noteIndex: number, time: number): void {
    if (this.state === 'COMBAT') {
      // Bass-Drum auf 0, 4, 8, 12 (Four-on-the-Floor Cyberpunk Pulse)
      if (noteIndex % 4 === 0) {
        this.triggerSynthKick(time);
      }
      // Hi-Hat auf ungeraden 16teln
      if (noteIndex % 2 === 1) {
        this.triggerSynthHat(time);
      }
      // Arpeggiator (Phrygisch Moll: A, Bb, C, D, E)
      const scale = [220, 233.08, 261.63, 293.66, 329.63, 293.66];
      const noteFreq = scale[noteIndex % scale.length];
      this.triggerArpNote(noteFreq, time, 0.12);
    } else if (this.state === 'EXPLORATION') {
      // Sanfter, atmosphärischer Arpeggiator auf Viertelnoten
      if (noteIndex % 4 === 0) {
        const slowScale = [110, 130.81, 146.83, 164.81];
        this.triggerArpNote(slowScale[(noteIndex / 4) % slowScale.length], time, 0.45);
      }
    } else if (this.state === 'VICTORY') {
      // Triumphale Dur-Harmonik
      if (noteIndex % 4 === 0) {
        const victoryScale = [261.63, 329.63, 392.0, 523.25];
        this.triggerArpNote(victoryScale[(noteIndex / 4) % victoryScale.length], time, 0.6);
      }
    }
  }

  // 3. Prozedurale Drum-Synthese (Kick & Hi-Hat)
  private triggerSynthKick(time: number): void {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

      gain.gain.setValueAtTime(0.4, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.08);

      osc.connect(gain);
      gain.connect(this.beatGain);
      osc.start(time);
      osc.stop(time + 0.08);
    } catch {
      // Audio fallback
    }
  }

  private triggerSynthHat(time: number): void {
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.linearRampToValueAtTime(0.001, time + 0.02);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.beatGain);
      noise.start(time);
    } catch {
      // Audio fallback
    }
  }

  private triggerArpNote(freq: number, time: number, decay: number = 0.12): void {
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

      osc.connect(gain);
      gain.connect(this.arpGain);
      osc.start(time);
      osc.stop(time + decay);
    } catch {
      // Audio fallback
    }
  }

  // 4. Permanenter Sub-Drone Layer (Astraea Reaktor-Fundament)
  private startDroneLayer(): void {
    if (this.droneOsc1 || this.droneOsc2) return;

    try {
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc2 = this.ctx.createOscillator();

      this.droneOsc1.type = 'sawtooth';
      this.droneOsc1.frequency.value = 55; // A1
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.value = 55.4; // 0.4 Hz Schwebung

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = 180;

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);

      this.droneOsc1.start();
      this.droneOsc2.start();
    } catch {
      // Audio fallback
    }
  }

  // 5. Zustands-Wechsel & Dynamische Filterung
  public setMusicState(newState: MusicState): void {
    this.state = newState;
    const now = this.ctx.currentTime;

    if (newState === 'EXPLORATION') {
      this.currentBpm = 75;
      this.droneGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
      this.beatGain.gain.linearRampToValueAtTime(0.0, now + 0.5);
      this.arpGain.gain.linearRampToValueAtTime(0.06, now + 0.5);
      this.filterNode.frequency.linearRampToValueAtTime(3500, now + 0.5);
    } else if (newState === 'COMBAT') {
      this.currentBpm = 128;
      this.droneGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      this.beatGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
      this.arpGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
      this.filterNode.frequency.linearRampToValueAtTime(20000, now + 0.3);
    } else if (newState === 'CHRONO_STASIS') {
      // Zeitlupe: Filter schließt drastisch ab; dumpfe Unterwasser-Akustik
      this.filterNode.frequency.linearRampToValueAtTime(220, now + 0.1);
      this.droneGain.gain.linearRampToValueAtTime(0.35, now + 0.1);
      this.beatGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    } else if (newState === 'VICTORY') {
      this.currentBpm = 90;
      this.droneGain.gain.linearRampToValueAtTime(0.15, now + 0.4);
      this.beatGain.gain.linearRampToValueAtTime(0.0, now + 0.4);
      this.arpGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
      this.filterNode.frequency.linearRampToValueAtTime(6000, now + 0.4);
    } else if (newState === 'DEFEAT') {
      this.filterNode.frequency.linearRampToValueAtTime(140, now + 0.5);
      this.droneGain.gain.linearRampToValueAtTime(0.25, now + 0.5);
      this.beatGain.gain.linearRampToValueAtTime(0.0, now + 0.5);
      this.arpGain.gain.linearRampToValueAtTime(0.0, now + 0.5);
    }
  }

  // 6. Sidechain Ducking bei Dialogen, Waffenschüssen oder Explosionen
  public triggerSidechainDuck(amountDb: number = -8, durationSec: number = 0.4): void {
    const now = this.ctx.currentTime;
    const targetGain = Math.pow(10, amountDb / 20); // Umrechnung dB zu Linear
    this.musicBusGain.gain.cancelScheduledValues(now);
    this.musicBusGain.gain.setValueAtTime(this.musicBusGain.gain.value, now);
    this.musicBusGain.gain.linearRampToValueAtTime(targetGain, now + 0.02);
    this.musicBusGain.gain.linearRampToValueAtTime(1.0, now + durationSec);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    try {
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
      this.droneOsc1?.disconnect();
      this.droneOsc2?.disconnect();
      this.droneOsc1 = null;
      this.droneOsc2 = null;
    } catch {
      // Ignored
    }
  }
}
