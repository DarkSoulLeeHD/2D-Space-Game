// services/combatResolutionService.ts - Mathematische Schadens-, Treffer- und Beute-Engine

import { IAttackResult, ICombatEntity, TileType } from '../types/combat';

export class CombatResolutionService {
  /**
   * 1. Hit-Chance-Berechnung nach Multi-Faktor-Algorithmus:
   * P_Hit = Clamp(Acc_Base + Acc_Mod - Dist_Penalty - Cover_Defense + Status_Bonus, 0.05, 0.95)
   */
  public static calculateHitChance(
    attackerAcc: number = 0.85,
    accMod: number = 0.0,
    distance: number = 3,
    optimalRange: number = 4,
    targetCover: TileType = 'FLOOR',
    hasDroneBonus: boolean = false
  ): number {
    // Deckungs-Dämpfung
    let coverDefense = 0.0;
    if (targetCover === 'COVER_HALF') coverDefense = 0.30;
    if (targetCover === 'WALL_FULL') return 0.0; // Keine Sichtlinie

    // Distanz-Malus: max(0, (d - OptimalRange) * 0.06)
    const distPenalty = Math.max(0, (distance - optimalRange) * 0.06);

    // Drohnen-Zielmarkierung (+15% Bonus)
    const statusBonus = hasDroneBonus ? 0.15 : 0.0;

    const rawHitChance = attackerAcc + accMod - distPenalty - coverDefense + statusBonus;

    // Minimum 5% Fehlerrisiko, maximal 95% Cap
    return Math.min(0.95, Math.max(0.05, rawHitChance));
  }

  /**
   * 2. Rüstungs- & Schadens-Berechnungs-Modell:
   * Tatsächlicher Schaden = max(1, (Rohschaden * CritMultiplier) - Armor)
   */
  public static resolveAttack(
    baseDamage: number,
    target: ICombatEntity,
    distance: number,
    targetCover: TileType = 'FLOOR',
    damageType: 'KINETIC' | 'ENERGY' | 'ENTROPY' = 'KINETIC'
  ): IAttackResult {
    const hitChance = this.calculateHitChance(0.85, 0.0, distance, 4, targetCover);
    const roll = Math.random();

    // Fehlschuss
    if (roll > hitChance) {
      return {
        hit: false,
        damage: 0,
        isCrit: false,
        text: 'FEHLSCHUSS [VERFEHLT]',
        damageType,
      };
    }

    // Kritischer Treffer-Check (15% Chance)
    const isCrit = Math.random() < 0.15;
    const critMultiplier = isCrit ? 1.75 : 1.0;

    // Rohschaden mit Zufalls-Streuung
    const rawDamage = Math.round((baseDamage + (Math.random() * 6 - 3)) * critMultiplier);

    // Schadens-Typologie Modifikatoren
    let typedDamage = rawDamage;
    if (damageType === 'ENERGY' && target.shield > 0) {
      typedDamage = Math.round(typedDamage * 1.25); // +25% gegen Schilde
    } else if (damageType === 'ENTROPY') {
      // Entropie umgeht Rüstung komplett
      return {
        hit: true,
        damage: Math.max(1, typedDamage),
        isCrit,
        text: isCrit ? `ENTROPIE-CRIT! -${typedDamage}` : `-${typedDamage}`,
        damageType,
      };
    }

    // Kinetischer Rüstungsabzug (Flat-Abzug)
    const effectiveDamage = Math.max(1, typedDamage - target.armor);

    return {
      hit: true,
      damage: effectiveDamage,
      isCrit,
      text: isCrit ? `KRIT! -${effectiveDamage}` : `-${effectiveDamage}`,
      damageType,
    };
  }

  /**
   * 3. Deterministische Beute-Generierung bei Gegner-Tod:
   * Naniten: Basis-HP * 1.5 * Threat
   * Chrono-Kristalle: 25% Chance bei Eliten, 100% bei Bossen
   */
  public static generateLootOnKill(
    enemyMaxHp: number,
    threatMultiplier: number = 1.6,
    isElite: boolean = true,
    isBoss: boolean = false
  ): { nanites: number; crystals: number; rarityDrop: string | null } {
    const nanites = Math.round(enemyMaxHp * 1.5 * threatMultiplier);

    let crystals = 0;
    if (isBoss) {
      crystals = Math.floor(Math.random() * 3 + 4); // 4-6 CK
    } else if (isElite && Math.random() < 0.35) {
      crystals = 1;
    }

    // Seltenheits-Roll (W1000)
    const roll = Math.floor(Math.random() * 1000) + 1;
    let rarityDrop: string | null = null;
    if (roll >= 999) rarityDrop = 'APEX';
    else if (roll >= 976) rarityDrop = 'ENTROPISCH';
    else if (roll >= 881) rarityDrop = 'ASTRAEA_SPEC';
    else if (roll >= 651) rarityDrop = 'VERSTÄRKT';
    else if (roll >= 400) rarityDrop = 'STANDARD';

    return { nanites, crystals, rarityDrop };
  }
}
