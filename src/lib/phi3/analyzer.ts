/**
 * Analyseur de relation propulsé par Phi-3 Mini (local, on-device)
 *
 * Remplace l'ancien analyseur regex par une IA générative locale.
 * Phi-3 comprend le contexte, les nuances, l'ironie — bien au-delà
 * des expressions régulières.
 */

import { generate } from './engine';

// --- Types (identiques à analyzer.ts pour rétrocompatibilité) ---

export type RedFlagType =
  | 'control'
  | 'jealousy'
  | 'manipulation'
  | 'isolation'
  | 'gaslighting'
  | 'aggression'
  | 'disrespect'
  | 'pressure';

export type GreenFlagType =
  | 'respect'
  | 'communication'
  | 'empathy'
  | 'encouragement'
  | 'affection'
  | 'trust'
  | 'support';

export type RedFlag = {
  type: RedFlagType;
  label: string;
  severity: 1 | 2 | 3;
  matches: string[];
  explanation: string;
};

export type GreenFlag = {
  type: GreenFlagType;
  label: string;
  example: string;
  explanation: string;
};

export type CommunicationScore = {
  total: number; // /100
  categories: {
    respect: number;
    empathy: number;
    honesty: number;
    boundaries: number;
    positivity: number;
  };
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  summary: string;
  aiPowered: true;
};

export type AnalysisMessage = {
  content: string;
  isFromMe: boolean;
};

// --- Prompt d'analyse principal ---

function buildAnalysisPrompt(messages: AnalysisMessage[]): string {
  // On limite à 60 messages pour rester dans le context window
  const sample = messages.slice(-60);

  const conversation = sample
    .map((m) => `[${m.isFromMe ? 'MOI' : 'PARTENAIRE'}]: ${m.content}`)
    .join('\n');

  return `Analyse cette conversation de couple et détecte les signaux de communication.

CONVERSATION :
${conversation}

Réponds UNIQUEMENT avec un objet JSON valide (sans backticks, sans markdown) respectant exactement cette structure :

{
  "total": <score global 0-100>,
  "categories": {
    "respect": <0-100>,
    "empathy": <0-100>,
    "honesty": <0-100>,
    "boundaries": <0-100>,
    "positivity": <0-100>
  },
  "redFlags": [
    {
      "type": <"control"|"jealousy"|"manipulation"|"isolation"|"gaslighting"|"aggression"|"disrespect"|"pressure">,
      "label": <titre court en français>,
      "severity": <1|2|3>,
      "matches": [<1 à 3 citations exactes tirées de la conversation>],
      "explanation": <1-2 phrases expliquant pourquoi c'est problématique>
    }
  ],
  "greenFlags": [
    {
      "type": <"respect"|"communication"|"empathy"|"encouragement"|"affection"|"trust"|"support">,
      "label": <titre court en français>,
      "example": <une citation positive tirée de la conversation>,
      "explanation": <1 phrase expliquant pourquoi c'est positif>
    }
  ],
  "summary": <résumé bienveillant de 2-3 phrases sur la qualité de cette relation>
}

Règles :
- N'inclus un red flag QUE si tu as une citation concrète de la conversation.
- N'inclus un green flag QUE s'il y a une phrase réellement positive.
- Si aucun flag n'est détecté, retourne des tableaux vides.
- Le score "total" doit refléter l'équilibre red/green flags.
- Sois nuancé(e) et bienveillant(e) dans le summary.`;
}

// --- Parseur sécurisé du JSON de l'IA ---

function safeParseAIResponse(raw: string): CommunicationScore | null {
  try {
    // Nettoyer les artefacts potentiels du modèle
    let cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // Trouver le premier { et le dernier }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return null;

    cleaned = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(cleaned);

    // Validation minimale
    if (
      typeof parsed.total !== 'number' ||
      !parsed.categories ||
      !Array.isArray(parsed.redFlags) ||
      !Array.isArray(parsed.greenFlags)
    ) {
      return null;
    }

    // S'assurer que les valeurs sont dans les bornes
    return {
      total: Math.max(0, Math.min(100, Math.round(parsed.total))),
      categories: {
        respect: Math.max(0, Math.min(100, parsed.categories.respect ?? 50)),
        empathy: Math.max(0, Math.min(100, parsed.categories.empathy ?? 50)),
        honesty: Math.max(0, Math.min(100, parsed.categories.honesty ?? 50)),
        boundaries: Math.max(0, Math.min(100, parsed.categories.boundaries ?? 50)),
        positivity: Math.max(0, Math.min(100, parsed.categories.positivity ?? 50)),
      },
      redFlags: (parsed.redFlags ?? []).map((f: any) => ({
        type: f.type ?? 'disrespect',
        label: f.label ?? 'Signal détecté',
        severity: ([1, 2, 3].includes(f.severity) ? f.severity : 2) as 1 | 2 | 3,
        matches: Array.isArray(f.matches) ? f.matches.slice(0, 3) : [],
        explanation: f.explanation ?? '',
      })),
      greenFlags: (parsed.greenFlags ?? []).map((f: any) => ({
        type: f.type ?? 'communication',
        label: f.label ?? 'Point positif',
        example: f.example ?? '',
        explanation: f.explanation ?? '',
      })),
      summary: parsed.summary ?? 'Analyse terminée.',
      aiPowered: true,
    };
  } catch {
    return null;
  }
}

// --- Fallback si le JSON échoue ---

function buildFallbackScore(): CommunicationScore {
  return {
    total: 50,
    categories: { respect: 50, empathy: 50, honesty: 50, boundaries: 50, positivity: 50 },
    redFlags: [],
    greenFlags: [],
    summary:
      "L'analyse n'a pas pu être complétée correctement. Essaie avec une conversation plus longue.",
    aiPowered: true,
  };
}

// --- Fonction principale d'analyse ---

export async function analyzeWithPhi3(
  messages: AnalysisMessage[],
  onToken?: (token: string) => void
): Promise<CommunicationScore> {
  if (messages.length === 0) {
    return {
      ...buildFallbackScore(),
      summary: 'Aucun message à analyser. Commence à chatter pour obtenir une analyse.',
    };
  }

  const prompt = buildAnalysisPrompt(messages);

  let rawOutput = '';
  const raw = await generate(prompt, (token) => {
    rawOutput += token;
    onToken?.(token);
  });

  const result = safeParseAIResponse(raw || rawOutput);
  return result ?? buildFallbackScore();
}
