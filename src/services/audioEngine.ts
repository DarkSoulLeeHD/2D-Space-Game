/**
 * Astraea Model-7 Procedural Web Audio Engine
 * Pure mathematical sound generation - Zero external binary audio assets
 */

export class ProceduralAudioEngine {
  private static instance: ProceduralAudioEngine | null = null;
  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public sfxGain: GainNode | null = null;
  public ambientGain: GainNode | null = null;
  public uiGain: GainNode | null = null;
  public analyser: AnalyserNode | null = null;

  // Drone nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private droneLfoGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private isDronePlaying = false;
  private isMuted = false;

  private constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public static getInstance(): ProceduralAudioEngine {
    if (!ProceduralAudioEngine.instance) {
      ProceduralAudioEngine.instance = new ProceduralAudioEngine();
    }
    return ProceduralAudioEngine.instance;
  }

  /**
   * Initializes or resumes AudioContext upon user gesture
   */
  public async initAudio(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx({ sampleRate: 48000 });
        (window as unknown as { terminalAudioCtx: AudioContext }).terminalAudioCtx = this.ctx;

        // Create AnalyserNode for spectrum visualization
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);

        // Sub-Gains for Mixer
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

        this.uiGain = this.ctx.createGain();
        this.uiGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

        // Route: sub-gains -> masterGain -> analyser -> destination
        this.sfxGain.connect(this.masterGain);
        this.ambientGain.connect(this.masterGain);
        this.uiGain.connect(this.masterGain);

        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      return this.ctx.state === 'running';
    } catch (err) {
      console.warn('AudioContext initialization failed or blocked:', err);
      return false;
    }
  }

  public get isUnlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  public setMasterVolume(value: number): void {
    if (!this.ctx || !this.masterGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime + 0.03);
  }

  public setSfxVolume(value: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.sfxGain.gain.setValueAtTime(this.sfxGain.gain.value, this.ctx.currentTime);
    this.sfxGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.03);
  }

  public setAmbientVolume(value: number): void {
    if (!this.ctx || !this.ambientGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.03);
  }

  public setUiVolume(value: number): void {
    if (!this.ctx || !this.uiGain) return;
    const clamped = Math.max(0, Math.min(1, value));
    this.uiGain.gain.setValueAtTime(this.uiGain.gain.value, this.ctx.currentTime);
    this.uiGain.gain.linearRampToValueAtTime(clamped, this.ctx.currentTime + 0.03);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : 0.75,
        this.ctx.currentTime + 0.05
      );
    }
    return this.isMuted;
  }

  /**
   * Audio-Test-Trigger für das Einstellungsmenü
   */
  public playTestTone(pitchHz: number = 1800): void {
    if (!this.ctx || !this.uiGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playTestTone(pitchHz));
      return;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const testGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitchHz, now);
    osc.frequency.exponentialRampToValueAtTime(pitchHz / 2, now + 0.12);

    testGain.gain.setValueAtTime(0.2, now);
    testGain.gain.linearRampToValueAtTime(0.001, now + 0.12);

    osc.connect(testGain);
    testGain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Modul einrasten (Schweres metallisches Schloss)
   * Triangle wave 320Hz exponential ramp to 80Hz + White noise bandpass 4200Hz
   */
  public playModuleSnap(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playModuleSnap());
      return;
    }
    try {
      const now = this.ctx.currentTime;

      // Metallischer Vorstoß (Triangle Wave)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      // Klick-Transiente (Weißes Rauschen)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 4200;

      osc.connect(gain);
      gain.connect(this.sfxGain);
      noise.connect(noiseFilter);
      noiseFilter.connect(this.sfxGain);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignored
    }
  }

  /**
   * Naniten-Schmelze (Zischendes Plasma)
   * Exponentially decaying white noise through sweeping Lowpass filter
   */
  public playForgeWeld(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playForgeWeld());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(6000, now);
      filter.frequency.linearRampToValueAtTime(300, now + 0.25);

      noise.connect(filter);
      filter.connect(this.sfxGain);
      noise.start(now);
    } catch {
      // Ignored
    }
  }

  /**
   * 1. Radar-Sweep: Resonanter Sinus-Puls (Sonar-Ortung)
   * Sine wave 880Hz exponential ramp to 440Hz over 0.4s
   */
  public playRadarSweep(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playRadarSweep());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignored
    }
  }

  /**
   * 2. Knoten-Auswahl: Taktiles Doppel-Klicken
   * Two-tone 1200Hz and 1800Hz triangle wave transient
   */
  public playNodeSelectPing(): void {
    if (!this.ctx || !this.uiGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playNodeSelectPing());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      [1200, 1800].forEach((freq, idx) => {
        if (!this.ctx || !this.uiGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.04;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.linearRampToValueAtTime(0.001, now + delay + 0.03);

        osc.connect(gain);
        gain.connect(this.uiGain);

        osc.start(now + delay);
        osc.stop(now + delay + 0.03);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * 3. Drop-Pod Start-Sirene: Ansteigender Alarm-Akkord
   * Sawtooth wave 140Hz linear ramp to 560Hz over 0.6s
   */
  public playLaunchKlaxon(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playLaunchKlaxon());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.6);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Ignored
    }
  }

  /**
   * 1. AP-Verbrauch: Knackiger kurzer Transienten-Impuls
   * Sine wave 1400Hz exponential ramp to 700Hz over 0.05s
   */
  public playApSpend(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playApSpend());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignored
    }
  }

  /**
   * 2. Schild-Treffer: Elektrostatische Entladung
   * Sawtooth wave 450Hz linear ramp to 150Hz over 0.12s
   */
  public playShieldDeflect(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playShieldDeflect());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignored
    }
  }

  public playShieldBreak(): void {
    this.playShieldDeflect();
  }

  public playGunshotBurst(): void {
    this.playGunfireTransient();
  }

  /**
   * 3. Phasen-Wechsel: Tiefer Sub-Sweep beim Rundenende
   * Triangle wave: 220Hz -> 440Hz for player turn, 330Hz -> 110Hz for enemy turn
   */
  public playPhaseShift(isPlayerTurn: boolean): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playPhaseShift(isPlayerTurn));
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      if (isPlayerTurn) {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);
      } else {
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      }

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + (isPlayerTurn ? 0.18 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + (isPlayerTurn ? 0.18 : 0.25));
    } catch {
      // Ignored
    }
  }

  /**
   * 4. Chrono-Dash Teleport Whoosh
   */
  public playDashWhoosh(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playDashWhoosh());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(3600, now + 0.12);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(now);
    } catch {
      // Ignored
    }
  }

  /**
   * ARC-70 Mündungsfeuer (Kinetischer Schuss)
   * Square wave 180Hz -> 35Hz + Lowpass filtered noise blast
   */
  public playGunfireTransient(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playGunfireTransient());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.09);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.09);

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
      const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) d[i] = Math.random() * 2 - 1;

      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      osc.connect(gain);
      gain.connect(this.sfxGain);
      noise.connect(filter);
      filter.connect(this.sfxGain);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignored
    }
  }

  /**
   * Kritischer Treffer (Crystalline Harmonic Ping)
   * Multi-frequency harmonic crystal chime: 1760Hz, 2640Hz, 3520Hz
   */
  public playCriticalHit(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playCriticalHit());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      [1760, 2640, 3520].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.02);

        gain.gain.setValueAtTime(0.12, now + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.02 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now + i * 0.02);
        osc.stop(now + i * 0.02 + 0.25);
      });
    } catch {
      // Ignored
    }
  }

  /**
   * Chrono-Parade Erfolgs-Donner (Sub-Drop + Warp-Sweep)
   * 320Hz -> 38Hz massive bass drop
   */
  public playParrySuccessBoom(): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.playParrySuccessBoom());
      return;
    }
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.35);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignored
    }
  }

  /**
   * 1. The CRT Power-On Transient (Power-On Pulse):
   * Sawtooth wave 45Hz exponential ramp to 880Hz over 120ms
   * Lowpass filter 1200Hz, Q 4.5
   * Envelope: Attack 5ms, Decay 180ms
   */
  public playCrtPowerOn(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4.5, now);

    // ADSR: Attack 5ms, Decay 180ms, Sustain 0
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.185);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * 2. The Mechanical Relay Switch (White Noise Relay Click):
   * 20ms white noise buffer, Bandpass filter at 3400Hz, Q 8.0
   */
  public playRelayClick(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.02); // 20ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.Q.setValueAtTime(8.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
  }

  /**
   * 3. Attract Background Drone (Sub-Space Resonator):
   * 2 detuned Sine oscillators (55.0Hz & 55.8Hz => 0.8Hz beat)
   * Modulated Lowpass Filter (LFO 0.15Hz sweeping 90Hz to 240Hz)
   */
  public startAttractDrone(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running' || this.isDronePlaying) return;

    try {
      const now = this.ctx.currentTime;

      // Drone Gain
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.linearRampToValueAtTime(0.18, now + 1.2);

      // Lowpass Filter for Drone
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(165, now); // Center frequency
      this.droneFilter.Q.setValueAtTime(2.5, now);

      // LFO for filter modulation: 0.15Hz sweeping between 90Hz and 240Hz
      this.droneLfo = this.ctx.createOscillator();
      this.droneLfo.type = 'sine';
      this.droneLfo.frequency.setValueAtTime(0.15, now);

      this.droneLfoGain = this.ctx.createGain();
      this.droneLfoGain.gain.setValueAtTime(75, now); // +/- 75Hz around 165Hz (90Hz - 240Hz)

      this.droneLfo.connect(this.droneLfoGain);
      this.droneLfoGain.connect(this.droneFilter.frequency);

      // 2 Detuned Sine Oscillators: 55.0 Hz & 55.8 Hz (0.8 Hz binaural-style beat)
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'sine';
      this.droneOsc1.frequency.setValueAtTime(55.0, now);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sine';
      this.droneOsc2.frequency.setValueAtTime(55.8, now);

      // Sub-harmonic 50Hz hum oscillator (industrial mains hum)
      const humOsc = this.ctx.createOscillator();
      const humGain = this.ctx.createGain();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(50.0, now);
      humGain.gain.setValueAtTime(0.06, now);
      humOsc.connect(humGain);
      humGain.connect(this.droneGain);
      humOsc.start(now);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.masterGain);

      this.droneOsc1.start(now);
      this.droneOsc2.start(now);
      this.droneLfo.start(now);

      this.isDronePlaying = true;
    } catch (e) {
      console.warn('Drone start error:', e);
    }
  }

  public stopAttractDrone(): void {
    if (!this.ctx || !this.isDronePlaying) return;
    const now = this.ctx.currentTime;
    if (this.droneGain) {
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
      this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    }
    setTimeout(() => {
      try {
        this.droneOsc1?.stop();
        this.droneOsc2?.stop();
        this.droneLfo?.stop();
        this.droneOsc1?.disconnect();
        this.droneOsc2?.disconnect();
        this.droneLfo?.disconnect();
        this.droneFilter?.disconnect();
        this.droneGain?.disconnect();
      } catch {
        // Ignored
      }
      this.isDronePlaying = false;
    }, 450);
  }

  /**
   * Hover-Effekt: Kurzer, hoher Frequenz-Ping
   * Sine wave 2400Hz exponential ramp to 1200Hz over 0.04s
   */
  public playHoverPing(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Ignored
    }
  }

  /**
   * Klick-Effekt: Dumpfer mechanischer Relais-Impuls
   * Triangle wave 180Hz exponential ramp to 40Hz over 0.08s
   */
  public playSelectClick(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignored
    }
  }

  /**
   * Stinger sound for UI clicks
   */
  public playUiClick(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}
