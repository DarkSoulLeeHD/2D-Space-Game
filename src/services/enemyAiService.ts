// services/enemyAiService.ts - KI-Entscheidungsbäume, Intent-Kalkulation & Runden-Choreografie

import { ICombatEntity, ITacticalTile, ICombatIntent } from '../types/combat';
import { findPathAStar, hasClearLineOfSight } from './pathfinding';
import { EnemyAudioEngine } from './enemyAudio';

export class EnemyAiService {
  /**
   * Berechnet vor dem Spielerzug die Absichten (Intents) aller lebenden Gegner
   * Macht das Gefecht zu einem deterministischen Taktik-Puzzle im Stil von Into the Breach
   */
  public static calculateIntents(
    enemies: ICombatEntity[],
    grid: ITacticalTile[][],
    player: ICombatEntity
  ): ICombatEntity[] {
    const occupied = enemies
      .filter((e) => e.hp > 0)
      .map((e) => ({ x: e.x, y: e.y }))
      .concat([{ x: player.x, y: player.y }]);

    return enemies.map((enemy) => {
      if (enemy.hp <= 0 || enemy.isPlayer) {
        return enemy;
      }

      const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
      let intent: ICombatIntent;

      // ARCHETYP 3: BOSS APEX-WÄCHTER NILUS
      if (enemy.archetype === 'BOSS_NILUS') {
        const hpPercent = (enemy.hp / enemy.maxHp) * 100;

        if (hpPercent > 66) {
          // Phase 1: Gravitations-Hammer (3x3 AOE)
          const affected: { x: number; y: number }[] = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ax = player.x + dx;
              const ay = player.y + dy;
              if (ax >= 0 && ax < 10 && ay >= 0 && ay < 10) {
                affected.push({ x: ax, y: ay });
              }
            }
          }
          intent = {
            actionType: 'AOE_HAMMER',
            targetTile: { x: player.x, y: player.y },
            affectedTiles: affected,
            damagePreview: 32,
            description: 'Telegrafiert seismischen Schlag (3x3 Felder!). Evakuierung empfohlen!',
          };
        } else if (hpPercent > 33) {
          // Phase 2: Zeitliche Bifurkation & Defensiv-Barriere
          intent = {
            actionType: 'DEFENSE',
            targetTile: { x: enemy.x, y: enemy.y },
            damagePreview: 0,
            description: 'Aktiviert Phasen-Schild (+40 MJ) & ruft Zeit-Echo zur Flankierung.',
          };
        } else {
          // Phase 3: Entropie-Singularität
          intent = {
            actionType: 'AOE_HAMMER',
            targetTile: { x: player.x, y: player.y },
            affectedTiles: [
              { x: player.x, y: player.y },
              { x: Math.min(9, player.x + 1), y: player.y },
              { x: Math.max(0, player.x - 1), y: player.y },
            ],
            damagePreview: 40,
            description: 'SINGULARITÄTS-AUSBRUCH: Zerstört Kacheln zu Vakuum & entlädt 40 DMG!',
          };
        }

        return { ...enemy, intent, bossPhase: hpPercent > 66 ? 1 : hpPercent > 33 ? 2 : 3 };
      }

      // ARCHETYP 1: PRAETOR MECH-DROHNE (Taktischer Fernkämpfer)
      if (enemy.archetype === 'PRAETOR') {
        const hasLoS = hasClearLineOfSight(enemy.x, enemy.y, player.x, player.y, grid);

        if (enemy.shield < 15 && enemy.shield < enemy.maxShield) {
          intent = {
            actionType: 'DEFENSE',
            targetTile: { x: enemy.x, y: enemy.y },
            damagePreview: 0,
            description: 'Errichtet Kinetik-Schild-Barriere (+30 MJ Schild)',
          };
        } else if (hasLoS && dist >= 3) {
          intent = {
            actionType: 'ATTACK',
            targetTile: { x: player.x, y: player.y },
            damagePreview: 18,
            description: `Lädt Impuls-Sperrfeuer (18 DMG) auf Operative Vance.`,
          };
        } else if (dist < 3) {
          // Zu nah an Vance -> Rückzug in Deckung
          intent = {
            actionType: 'MOVE',
            targetTile: { x: Math.min(9, enemy.x + 2), y: enemy.y },
            damagePreview: 0,
            description: 'Weicht vor Nahkampf-Distanz in sichere Deckung aus.',
          };
        } else {
          // Keine Sichtlinie -> Umgehen zur Flanke
          intent = {
            actionType: 'MOVE',
            targetTile: { x: player.x, y: Math.max(0, player.y - 2) },
            damagePreview: 0,
            description: 'Manövriert zur freien Schusslinie.',
          };
        }

        return { ...enemy, intent };
      }

      // ARCHETYP 2: CHRONO-KRIECHER (Aggressiver Schwarm)
      // Standardmäßig Nahkampf-Druck
      if (dist === 1) {
        intent = {
          actionType: 'ATTACK',
          targetTile: { x: player.x, y: player.y },
          damagePreview: 24,
          description: 'Plant Kinetik-Klauenangriff (24 DMG) auf Nachbarfeld.',
        };
      } else {
        // Berechne ob der Kriecher in 3 Schritten nah genug herankommt
        const otherEnemies = occupied.filter((o) => !(o.x === enemy.x && o.y === enemy.y));
        const path = findPathAStar(enemy.x, enemy.y, player.x, player.y, grid, otherEnemies);

        const willReach = path.length <= 3;
        intent = {
          actionType: willReach ? 'ATTACK' : 'MOVE',
          targetTile: { x: player.x, y: player.y },
          damagePreview: willReach ? 24 : 0,
          description: willReach
            ? 'Stürmt 3 Kacheln vor und greift Vance mit Klauenhieb an (24 DMG).'
            : 'Hetzkampf-Spurt in Richtung Operative Vance.',
        };
      }

      return { ...enemy, intent };
    });
  }

  /**
   * Führt einen einzelnen Schritt der Feind-Phase aus
   */
  public static async executeSingleEnemyAction(
    enemy: ICombatEntity,
    player: ICombatEntity,
    grid: ITacticalTile[][],
    otherOccupied: { x: number; y: number }[],
    audio: EnemyAudioEngine
  ): Promise<{
    newPos: { x: number; y: number };
    attackExecuted: boolean;
    damageAmount: number;
    attackType: 'DIRECT' | 'AOE' | 'SHIELD' | 'NONE';
    affectedTiles?: { x: number; y: number }[];
    spawnEcho?: boolean;
    destroyTiles?: { x: number; y: number }[];
    logText: string;
  }> {
    let newPos = { x: enemy.x, y: enemy.y };
    let damageAmount = 0;
    let attackExecuted = false;
    let attackType: 'DIRECT' | 'AOE' | 'SHIELD' | 'NONE' = 'NONE';
    let affectedTiles: { x: number; y: number }[] | undefined;
    let spawnEcho = false;
    let destroyTiles: { x: number; y: number }[] | undefined;
    let logText = '';

    // 1. BOSS NILUS LOGIK
    if (enemy.archetype === 'BOSS_NILUS') {
      const intent = enemy.intent;
      audio.playBossChargeHum();
      await new Promise((r) => setTimeout(r, 200));

      if (intent?.actionType === 'AOE_HAMMER') {
        audio.playSeismicImpact();
        attackExecuted = true;
        attackType = 'AOE';
        affectedTiles = intent.affectedTiles || [];

        // Prüfe ob Vance im Zielbereich steht
        const playerHit = affectedTiles.some((t) => t.x === player.x && t.y === player.y);
        damageAmount = playerHit ? intent.damagePreview : 0;

        if (enemy.bossPhase === 3) {
          // Zerstöre 2 zufällige Kacheln im Bereich
          destroyTiles = affectedTiles.slice(0, 2);
        }

        logText = playerHit
          ? `>> [SEISMISCHER HAMMER]: Nilus erschüttert das Grid! Operative Vance erleidet ${damageAmount} DMG!`
          : `>> [SEISMISCHER HAMMER]: Nilus schlägt ins Leere! Vance weicht dem Einschlag aus!`;
      } else if (intent?.actionType === 'DEFENSE') {
        attackExecuted = true;
        attackType = 'SHIELD';
        spawnEcho = true;
        logText = `>> [ZEITLICHE BIFURKATION]: Nilus regeneriert Schilde (+40 MJ) und manifestiert ein Zeit-Echo!`;
      }
      return {
        newPos,
        attackExecuted,
        damageAmount,
        attackType,
        affectedTiles,
        spawnEcho,
        destroyTiles,
        logText,
      };
    }

    // 2. PRAETOR FERNKÄMPFER
    if (enemy.archetype === 'PRAETOR') {
      const intent = enemy.intent;

      if (intent?.actionType === 'DEFENSE') {
        audio.playMechServo();
        attackExecuted = true;
        attackType = 'SHIELD';
        logText = `>> [PRAETOR PROTOKOLL]: Praetor Mech verstärkt Kinetik-Barriere (+30 MJ).`;
        return {
          newPos,
          attackExecuted,
          damageAmount: 0,
          attackType,
          logText,
        };
      }

      if (intent?.actionType === 'ATTACK') {
        audio.playMechServo();
        attackExecuted = true;
        attackType = 'DIRECT';
        damageAmount = intent.damagePreview || 18;
        logText = `>> [PRAETOR FEUERSALVE]: Impuls-Laser trifft Operative Vance für ${damageAmount} DMG!`;
        return {
          newPos,
          attackExecuted,
          damageAmount,
          attackType,
          logText,
        };
      }

      // Falls MOVE intent: Weiche zurück oder gehe zur Flanke
      const path = findPathAStar(enemy.x, enemy.y, intent?.targetTile.x || 9, intent?.targetTile.y || 5, grid, otherOccupied);
      if (path.length > 0) {
        audio.playMechServo();
        newPos = path[0];
        logText = `>> [PRAETOR BEWEGUNG]: Mech bezieht neue Schussposition auf (${newPos.x}, ${newPos.y}).`;
      }
      return {
        newPos,
        attackExecuted: false,
        damageAmount: 0,
        attackType: 'NONE',
        logText,
      };
    }

    // 3. CHRONO-KRIECHER (SCHWARM)
    // Schritt A: Bewege Kriecher bis zu 2-3 Kacheln Richtung Vance
    const path = findPathAStar(enemy.x, enemy.y, player.x, player.y, grid, otherOccupied);

    if (path.length > 0) {
      // Bewege maximal 2 Kacheln weit entlang des Pfads
      const stepIndex = Math.min(path.length - 1, 1);
      const targetStep = path[stepIndex];
      // Niemals auf das Spielerfeld selbst betreten
      if (!(targetStep.x === player.x && targetStep.y === player.y)) {
        newPos = targetStep;
        audio.playCreeperSkitter();
        await new Promise((r) => setTimeout(r, 180));
      }
    }

    // Schritt B: Prüfe Nahkampf-Distanz
    const newDist = Math.abs(newPos.x - player.x) + Math.abs(newPos.y - player.y);
    if (newDist === 1) {
      attackExecuted = true;
      attackType = 'DIRECT';
      damageAmount = 24;
      logText = `>> [KRIECHER-ANGRIFF]: Chrono-Kriecher reißt mit Kinetik-Klauen zu (${damageAmount} DMG)!`;
    } else {
      logText = `>> [KRIECHER-SPURT]: Kriecher rückt auf Feld (${newPos.x}, ${newPos.y}) vor.`;
    }

    return {
      newPos,
      attackExecuted,
      damageAmount,
      attackType,
      logText,
    };
  }
}
