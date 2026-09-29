// services/geminiBossDialogue.ts - Diegetische Boss-Funkinterzeptionen via Gemini 2.5 Flash SDK

import { GoogleGenAI } from '@google/genai';

const FALLBACK_TAUNTS = [
  'DIE ZEITLINIE BRICHT ZUSAMMEN... IHR WERDET BRECHEN.',
  'FLEISCH IST VERGÄNGLICH. DIE NULL-ZONE IST EWIG.',
  'EURER DROHNE FEHLT DIE SEELE, EUCH DIE ZEIT.',
  'ICH HABE DAS ENDE VON STRATUM-09 GESEHEN. IHR SEID NICHT DARIN.',
  'SEISMISCHE RESONANZ INITIALISIERT. FLIEHT, WENN IHR KÖNNT.',
  'EURE SCHILDE ZERFALLLEN IN QUANTENRAUSCHEN.',
];

export async function fetchBossPhaseTaunt(
  explicitApiKey?: string,
  bossName: string = 'APEX-WÄCHTER NILUS',
  currentPhase: number = 1,
  playerHpPercent: number = 80
): Promise<string> {
  const apiKey =
    explicitApiKey ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('GEMINI_API_KEY_v1') || ''
      : '') ||
    process.env.GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    const randomFallback =
      FALLBACK_TAUNTS[(currentPhase - 1) % FALLBACK_TAUNTS.length] ||
      FALLBACK_TAUNTS[0];
    return `[FUNK-INTERZEPT]: "${randomFallback}"`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Rolle: Sci-Fi-Boss '${bossName}', ein korrumpierter kybernetischer Chef-Konstrukteur der verfallenen Raumstation Stratum-09.
      Situation: Du trittst im Taktik-Raster in Kampfphase ${currentPhase} ein. Operative Vance hat noch ${playerHpPercent}% Gesundheit.
      Auftrag: Generiere genau EINE kurze, eiskalte, von statischem Rauschen zerrüttete Funk-Drohung (maximal 12 Wörter).
      Stil: Hard Sci-Fi, Kybernetik, Verfall, Verachtung, keine Höflichkeiten, komplett in Großbuchstaben.
    `;

    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.8 },
    });

    const text = res.text?.trim()?.replace(/^["']|["']$/g, '');
    if (text) {
      return `[FUNK-INTERZEPT]: "${text}"`;
    }
  } catch (err) {
    console.warn('Gemini boss dialogue fallback:', err);
  }

  const fallback =
    FALLBACK_TAUNTS[(currentPhase - 1) % FALLBACK_TAUNTS.length] ||
    'DIE ZEITLINIE BRICHT ZUSAMMEN... IHR WERDET BRECHEN.';
  return `[FUNK-INTERZEPT]: "${fallback}"`;
}
