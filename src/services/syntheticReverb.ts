// services/syntheticReverb.ts - Prozeduraler Raumhall ohne externe Impuls-Audiodatei

/**
 * Erzeugt einen synthetischen Impulsantwort-Puffer im RAM
 * Simuliert eine massive unterirdische Industrie-Halle aus Stahl und Beton
 */
export function createProceduralReverbBuffer(
  ctx: AudioContext,
  duration: number = 1.8,
  decay: number = 2.5
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate); // Stereo-Puffer

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    // Exponentiell abfallendes weißes Rauschen
    const factor = Math.exp(-i / (sampleRate * (duration / decay)));
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }

  return buffer;
}

/**
 * Erzeugt eine voll einsatzfähige ConvolverNode mit synthetischem Impuls-Puffer
 */
export function createProceduralReverbNode(
  ctx: AudioContext,
  duration: number = 1.8,
  decay: number = 2.5
): ConvolverNode {
  const convolver = ctx.createConvolver();
  convolver.buffer = createProceduralReverbBuffer(ctx, duration, decay);
  return convolver;
}
