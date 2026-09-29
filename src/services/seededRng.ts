// services/seededRng.ts - Deterministischer Mulberry32 PRNG-Seed-Generator für wöchentliche Live-Ops

export class SeededRng {
  private seed: number;

  constructor(seedStr: string) {
    // String zu 32-Bit FNV-1a Hash konvertieren
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    }
    this.seed = h >>> 0;
  }

  // Mulberry32 PRNG (Deterministischer Zufall)
  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextRange(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // Statische Methode zur Ermittlung des aktuellen Wochen-Seeds
  public static getCurrentWeeklySeed(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 3600 * 1000));
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    return `WEEK-${now.getFullYear()}-W${weekNum < 10 ? '0' : ''}${weekNum}-NULL`;
  }
}
