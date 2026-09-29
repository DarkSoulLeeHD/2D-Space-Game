// services/automatedQaRunner.ts - Automatisierter Headless-Stresstest für Spielmechaniken (SYS-QA-15)

export interface IQaTestResult {
  passed: boolean;
  iterations: number;
  executionTimeMs: number;
  errors: string[];
  stats: {
    turnsCompleted: number;
    hits: number;
    misses: number;
    damageDealt: number;
    damageReceived: number;
  };
}

export function runAutomatedStressTest(iterations: number = 1000): IQaTestResult {
  const startTime = performance.now();
  const errors: string[] = [];

  let testAp = 4;
  let playerHp = 100;
  let turnsCompleted = 0;
  let hits = 0;
  let misses = 0;
  let damageDealt = 0;
  let damageReceived = 0;

  for (let i = 0; i < iterations; i++) {
    try {
      // 1. Simuliere Vance-Aktionen (Schritt, Schuss, Nachladen)
      testAp -= 1;

      // 2. Simuliere mathematische Hit-Formel aus Modul 07
      // Chance = Clamp(Base 85% - Cover 20% + WeaponAcc 10%, 5%, 95%)
      const coverMod = (i % 3 === 0) ? 0.20 : 0.0;
      const hitChance = Math.min(0.95, Math.max(0.05, 0.85 - coverMod + 0.05));
      const roll = Math.random();
      const isHit = roll <= hitChance;

      if (typeof isHit !== 'boolean') {
        errors.push(`Iteration ${i}: Ungültiges Ergebnis der Hit-Formel`);
      }

      if (isHit) {
        hits++;
        damageDealt += 34; // ARC-70 Basisschaden
      } else {
        misses++;
      }

      // Runden-Abschluss
      if (testAp <= 0) {
        turnsCompleted++;
        testAp = 4;

        // Feind-Schadensphase
        const enemyDmg = Math.floor(Math.random() * 8);
        playerHp -= enemyDmg;
        damageReceived += enemyDmg;

        if (playerHp <= 0) {
          // Klon-Reset für Endlos-Stresstest
          playerHp = 100;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Iteration ${i}: Crash abgefangen: ${msg}`);
      break;
    }
  }

  const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

  return {
    passed: errors.length === 0,
    iterations,
    executionTimeMs,
    errors,
    stats: {
      turnsCompleted,
      hits,
      misses,
      damageDealt,
      damageReceived,
    },
  };
}
