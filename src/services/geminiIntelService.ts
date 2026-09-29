// services/geminiIntelService.ts - Gemini 2.5 Flash SDK Integration & Fallback Intelligence

import { GoogleGenAI } from '@google/genai';
import { IMissionDossier } from '../types/mission';

export async function fetchMissionBriefing(
  apiKey: string,
  nodeType: string,
  sectorName: string,
  threatLevel: number
): Promise<IMissionDossier> {
  const cleanKey = apiKey?.trim();

  // If API key is available, call Gemini Flash API
  if (cleanKey && cleanKey.length > 5) {
    try {
      const ai = new GoogleGenAI({ apiKey: cleanKey });
      const prompt = `
        Rolle: Militärischer Taktik-Computer des Astraea Model-7 Terminals.
        Auftrag: Generiere ein extrem prägnantes, militärisches Sci-Fi-Einsatzdossier für einen taktischen Einsatz auf der orbitalen Raumstation Stratum-09.
        Parameter:
        - Sektor: ${sectorName}
        - Knotentyp: ${nodeType}
        - Bedrohungsstufe: ${threatLevel} von 5

        Antworte STRIKT im folgenden JSON-Format ohne Markdown-Codeblöcke:
        {
          "codename": "OPERATION [NAME]",
          "objective": "Einzeilige Primäraufgabe für Operative Vance",
          "environmentalHazards": ["Gefahr 1", "Gefahr 2"],
          "enemyThreats": ["Gegner-Typ 1 (Verhalten)", "Gegner-Typ 2 (Verhalten)"],
          "tacticalAdvice": "Einzeiliger taktischer Ratschlag für den Operative"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text);
      if (parsed && parsed.codename && parsed.objective) {
        return parsed as IMissionDossier;
      }
    } catch (error) {
      console.warn('Gemini Flash API offline oder blockiert, nutze taktisches Fallback:', error);
    }
  }

  // Fallback to deterministic offline military dossiers
  return getOfflineFallbackDossier(nodeType, sectorName, threatLevel);
}

// Deterministischer Pool an immersiven militärischen Sci-Fi-Dossiers
function getOfflineFallbackDossier(
  nodeType: string,
  sectorName: string,
  threatLevel: number
): IMissionDossier {
  const codeNum = Math.floor(Math.random() * 800 + 100);

  const dossiersByType: Record<string, Partial<IMissionDossier>> = {
    COMBAT: {
      codename: `OP 'REAKTOR-SCHLAG ${codeNum}'`,
      objective: `Beseitigung der kompromittierten Verteidigungseinheiten und Sicherung von ${sectorName}.`,
      environmentalHazards: [
        'Magnet-Kühlsystem defekt // Partielle Dekompression',
        'Strahlenleck (0.4 mSv/h) in den Korridoren',
      ],
      enemyThreats: [
        '65% Chrono-Kriecher (Aggressives Schwarm-Flankieren)',
        '35% Abtrünnige Praetor-Mechs (Deckungs-Sperrfeuer)',
      ],
      tacticalAdvice: 'Schrotflinte für Engstellen bereithalten; Schilde vor Raumübertritt laden.',
    },
    SALVAGE: {
      codename: `BERGUNG 'IONEN-RESTE ${codeNum}'`,
      objective: `Infiltration des verlassenen Fracht-Terminals und Evakuierung von Titan-Naniten.`,
      environmentalHazards: [
        'Instabile Schwerkraft-Pylone (Schwankt zwischen 0.1G und 0.8G)',
        'Kriechströme in den Bodenrastern',
      ],
      enemyThreats: [
        'Wartungs-Drohnen (Defensiv-Alarme aktiv)',
        'Vereinzelte Kriecher-Späher auf den Laufgittern',
      ],
      tacticalAdvice: 'Zuerst Alarm-Relais deaktivieren; Drohnen-Schild-Link aktivieren.',
    },
    HAZARD: {
      codename: `SEKTOR-NOT 'GIFT-SCHLEUSE ${codeNum}'`,
      objective: `Manuelle Überbrückung der Kühlmittel-Schotten bei akuter Kern-Instabilität.`,
      environmentalHazards: [
        'Toxische Xenon-Gaswolken (1% Rumpf-Schaden pro Runde)',
        'Geschmolzene Deckungselemente bieten nur 50% Schutz',
      ],
      enemyThreats: [
        'Mutierte Kriecher-Berserker (Immunität gegen Giftschaden)',
        'Geschütztürme mit Sensor-Fehlausrichtung',
      ],
      tacticalAdvice: 'Med-Stims bereithalten; Zielpositionen zügig mit Dash wechseln.',
    },
    EVENT: {
      codename: `ANOMALIE 'ECHO-SIGNAL ${codeNum}'`,
      objective: `Ortung einer verschlüsselten Notsender-Signatur aus den Mannschaftsquartieren.`,
      environmentalHazards: [
        'Temporale Echos (Spiegeln vergangene Kampfspuren)',
        'Flackernde Phosphor-Beleuchtung erschwert Zielen',
      ],
      enemyThreats: [
        'Unbekannte Kausalitäts-Phantome (Kurzzeit-Unsichtbarkeit)',
      ],
      tacticalAdvice: 'Radar-Impuls nutzen, um Sensor-Geister von echten Zielen zu trennen.',
    },
    BOSS: {
      codename: `APEX-ELIMINIERUNG 'NILUS PROTOKOLL'`,
      objective: `Zerschlagung des korrumpierten Architekten Nilus vor Erreichen der kritischen Masse.`,
      environmentalHazards: [
        'Singularitäts-Trichter reißt Bodenkacheln ins Vakuum',
        'Gravitations-Stürme überladen Kinetik-Schilde',
      ],
      enemyThreats: [
        'APEX-WÄCHTER NILUS (2x2 Kachel-Chassis // 3 Phasen)',
        'Phasen-Klone und seismische Gravitations-Hammerschläge',
      ],
      tacticalAdvice: 'Rote Telegrafie-Kacheln meiden; Overdrive erst in Phase 3 zünden.',
    },
  };

  const selected = dossiersByType[nodeType] || dossiersByType.COMBAT;

  return {
    codename: selected.codename || `OPERATION STRATUM-${codeNum}`,
    objective: selected.objective || `Einsatz in ${sectorName} ausführen.`,
    environmentalHazards: selected.environmentalHazards || [
      'Strukturelle Belastungsgrenze erreicht',
      'Atmosphärischer Druckabfall',
    ],
    enemyThreats: selected.enemyThreats || [
      'Chrono-Kriecher (Stufe II)',
      'Automatisierte Wachposten',
    ],
    tacticalAdvice:
      selected.tacticalAdvice ||
      'Auf Munitionsreserven achten und Rückzugskorridor sichern.',
  };
}
