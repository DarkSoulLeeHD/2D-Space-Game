// services/speechService.ts - Web Speech API (TTS) für Barrierefreiheit

export class TerminalSpeechSynthesizer {
  private static instance: TerminalSpeechSynthesizer | null = null;
  private synth: SpeechSynthesis | null = null;
  public isEnabled: boolean = false;
  public voiceRate: number = 1.0;
  public voicePitch: number = 0.8; // Tiefere, leicht roboterhafte Sci-Fi-Stimme

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public static getInstance(): TerminalSpeechSynthesizer {
    if (!TerminalSpeechSynthesizer.instance) {
      TerminalSpeechSynthesizer.instance = new TerminalSpeechSynthesizer();
    }
    return TerminalSpeechSynthesizer.instance;
  }

  public speak(text: string, force = false): void {
    if ((!this.isEnabled && !force) || !this.synth) return;

    try {
      this.synth.cancel(); // Vorherige Sprache abbrechen

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.voiceRate;
      utterance.pitch = this.voicePitch;

      // Automatische Auswahl einer passenden System-Stimme
      const voices = this.synth.getVoices();
      const sciFiVoice = voices.find(
        (v) => v.lang.includes('de') || v.name.includes('Google') || v.name.includes('Zira') || v.lang.includes('en')
      );
      if (sciFiVoice) utterance.voice = sciFiVoice;

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
