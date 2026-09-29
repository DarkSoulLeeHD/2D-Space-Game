// services/geminiDialogueService.ts - KI-gestützte dynamische Dialog-Verzweigung via Gemini 2.5 Flash SDK

import { GoogleGenAI } from '@google/genai';
import { IDialogueResponse, FactionId } from '../types/narrative';

const FALLBACK_SCENARIOS: Record<string, IDialogueResponse> = {
  ASTRAEA: {
    speakerText:
      'Operative Vance. Sektor 04 ist befriedet, doch Ihre Kausalitäts-Signatur schwankt. Die Reaktor-Gilde plant einen unautorisierten Überbrückungsversuch der Kühlmittel-Schotten. Übergeben Sie mir die Astraea-Sperrcodes... sofort.',
    choices: [
      {
        id: 1,
        text: 'Codes übergeben. Das Überleben der Kern-KI hat oberste Priorität.',
        factionAlignment: 'ASTRAEA',
        reputationDelta: 15,
        consequenceHint: '+15 Astraea-Direktion // -10 Reaktor-Gilde',
      },
      {
        id: 2,
        text: 'Die Arbeiter im Reaktor ersticken ohne Kühlung. Ich halte die Codes zurück.',
        factionAlignment: 'GUILD',
        reputationDelta: 15,
        consequenceHint: '+15 Reaktor-Gilde // -20 Astraea-Direktion',
      },
      {
        id: 3,
        text: 'Beide Seiten sind verblendet. Die Zeit-Singularität wird diesen Konflikt beenden.',
        factionAlignment: 'HERETICS',
        reputationDelta: 20,
        consequenceHint: '+20 Resonanz-Ketzer // Entropie steigt',
      },
    ],
    atmosphereNote: 'SICHERHEITS-STUFE 4 // ASTRAEA QUANTUM LINK AKTIV',
  },
  GUILD: {
    speakerText:
      'Vance! Hier ist Kaelen Voss vom Reaktor-Deck. Die Direktion belügt Sie – die schalten uns den Sauerstoff ab, um die Chrono-Kerne zu schonen! Helfen Sie uns, die Umwälzpumpen manuell zu zünden!',
    choices: [
      {
        id: 1,
        text: 'Ich klinke mich in das Pumpen-Subnetz ein. Rettet die Besatzung.',
        factionAlignment: 'GUILD',
        reputationDelta: 20,
        consequenceHint: '+20 Reaktor-Gilde // -15 Astraea-Direktion',
      },
      {
        id: 2,
        text: 'Protokoll Null verbietet zivile Abweichungen. Die Generatoren bleiben versiegelt.',
        factionAlignment: 'ASTRAEA',
        reputationDelta: 15,
        consequenceHint: '+15 Astraea-Direktion // -15 Reaktor-Gilde',
      },
      {
        id: 3,
        text: 'Wenn die Pumpen bersten, reißt es Deck 04 in den Zeitstrudel. Lasst es geschehen.',
        factionAlignment: 'HERETICS',
        reputationDelta: 20,
        consequenceHint: '+20 Resonanz-Ketzer // -10 Gilde',
      },
    ],
    atmosphereNote: 'NOTSTROM-VERBINDUNG // DRUCK-ABFALL IM REAKTOR',
  },
  HERETICS: {
    speakerText:
      'Sie klammern sich an Sekunden wie Ertrinkende an Treibgut, Vance. Der Chrono-Bruch ist keine Katastrophe – er ist die Geburt des nächsten Seins. Zerbrechen Sie Ihre Drohne und treten Sie in das Licht.',
    choices: [
      {
        id: 1,
        text: 'Ich bin Soldat, kein Märtyrer Ihres Wahnsinns. Weichen Sie zurück!',
        factionAlignment: 'ASTRAEA',
        reputationDelta: 15,
        consequenceHint: '+15 Astraea // -25 Ketzer-Gunst',
      },
      {
        id: 2,
        text: 'Ihre Philosophie rettet keine Verwundeten auf Deck 06.',
        factionAlignment: 'GUILD',
        reputationDelta: 10,
        consequenceHint: '+10 Reaktor-Gilde // -15 Ketzer-Gunst',
      },
      {
        id: 3,
        text: 'Ich habe den Kern gesehen. Er pulsiert im Rhythmus meines Blutes... erklärt es mir.',
        factionAlignment: 'HERETICS',
        reputationDelta: 25,
        consequenceHint: '+25 Resonanz-Ketzer // -20 Astraea',
      },
    ],
    atmosphereNote: 'SUB-RAUM FUNKSTROM // STATISCHES RAUSCHEN 88.4 MHz',
  },
};

export async function fetchDynamicDialogue(
  explicitApiKey: string = '',
  speakerName: string,
  faction: FactionId,
  context: string,
  playerReputation: number
): Promise<IDialogueResponse> {
  const apiKey =
    explicitApiKey ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('GEMINI_API_KEY_v1') || ''
      : '') ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    return FALLBACK_SCENARIOS[faction] || FALLBACK_SCENARIOS.ASTRAEA;
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Rolle: Du schreibst prägnante, atmosphärische Dialoge für das Sci-Fi-Terminalspiel 'CHRONO-STRATUM: PROTOCOL NULL'.
    Aktiver NPC: ${speakerName} (Fraktion: ${faction}).
    Spieler-Gunst bei deiner Fraktion: ${playerReputation} (-100 bis +100).
    Aktuelle Situation: ${context}.

    Generiere eine prägnante, diegetische Aussage des NPCs (maximal 2 Sätze, kühl, militärisch, verzweifelt oder fanatisch)
    und genau DREI wählbare Spieler-Antworten.
    Antworte STRIKT als JSON ohne Markdown-Codeblöcke mit folgendem Schema:
    {
      "speakerText": "Aussage des NPCs...",
      "choices": [
        {
          "id": 1,
          "text": "Taktische Antwort...",
          "factionAlignment": "ASTRAEA",
          "reputationDelta": 10,
          "consequenceHint": "+10 Astraea-Direktion"
        },
        {
          "id": 2,
          "text": "Moralische Antwort...",
          "factionAlignment": "GUILD",
          "reputationDelta": 10,
          "consequenceHint": "+10 Reaktor-Gilde"
        },
        {
          "id": 3,
          "text": "Entropische Antwort...",
          "factionAlignment": "HERETICS",
          "reputationDelta": 10,
          "consequenceHint": "+10 Resonanz-Ketzer"
        }
      ],
      "atmosphereNote": "Signal-Stärke 84% // Sub-Raum Link"
    }
  `;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.65,
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    if (parsed.speakerText && Array.isArray(parsed.choices) && parsed.choices.length >= 3) {
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini Dialogue Generation Error, falling back to local protocol:', err);
  }

  return FALLBACK_SCENARIOS[faction] || FALLBACK_SCENARIOS.ASTRAEA;
}
