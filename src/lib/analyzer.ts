export type RedFlag = {
  type: 'control' | 'jealousy' | 'manipulation' | 'isolation' | 'gaslighting' | 'aggression';
  label: string;
  severity: 1 | 2 | 3; // 1=léger, 2=modéré, 3=grave
  matches: string[];
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
  greenFlags: string[];
  summary: string;
};

// ---- Patterns de détection ----

const RED_FLAG_PATTERNS: { type: RedFlag['type']; label: string; severity: RedFlag['severity']; patterns: RegExp[] }[] = [
  {
    type: 'control',
    label: 'Comportement controlant',
    severity: 3,
    patterns: [
      /tu (dois|peux pas|ne peux pas|dois pas)/i,
      /je t'interdis/i,
      /sans ma permission/i,
      /t'as pas le droit/i,
      /dis moi où tu (es|vas)/i,
      /montre moi ton (téléphone|tel|portable)/i,
    ],
  },
  {
    type: 'jealousy',
    label: 'Jalousie excessive',
    severity: 2,
    patterns: [
      /c'est qui (ce|cette|cet)/i,
      /tu (couches?|sors?) avec/i,
      /t'as encore (parlé|écrit)/i,
      /pourquoi tu (réponds|réponds pas) (pas|si vite)/i,
      /qui t'a (écrit|appelé|texté)/i,
    ],
  },
  {
    type: 'manipulation',
    label: 'Manipulation émotionnelle',
    severity: 3,
    patterns: [
      /si tu (m'aimais|m'aimais vraiment)/i,
      /personne (d'autre|d'autre que moi)/i,
      /tu me fais souffrir/i,
      /c'est ta faute si/i,
      /tu me rends fou|folle/i,
      /après tout ce que j'ai fait/i,
      /tu le regretteras/i,
    ],
  },
  {
    type: 'isolation',
    label: 'Tentative d\'isolement',
    severity: 3,
    patterns: [
      /tes ami(e)?s (sont|c'est) (nul|toxique|mauvais)/i,
      /ta famille (se mêle|se fout|comprend pas)/i,
      /t'as (besoin de|pas besoin d')autre (chose|personne) que moi/i,
      /ils te (font|veulent) du mal/i,
    ],
  },
  {
    type: 'gaslighting',
    label: 'Gaslighting',
    severity: 3,
    patterns: [
      /t'as (rêvé|inventé|imaginé)/i,
      /ça s'est jamais passé/i,
      /t'es (folle?|trop sensible|parano)/i,
      /tu (exagères|dramatises)/i,
      /c'est pas ce que j'ai dit/i,
    ],
  },
  {
    type: 'aggression',
    label: 'Agressivité verbale',
    severity: 3,
    patterns: [
      /ferme (ta gueule|la|la bouche)/i,
      /t'es (con|conne|idiote?|nulle?|bête)/i,
      /je te (déteste|hais)/i,
      /va te faire/i,
      /\b(fuck|merde)\b.{0,20}toi/i,
    ],
  },
];

const GREEN_FLAG_PATTERNS: { label: string; patterns: RegExp[] }[] = [
  { label: 'Respect des limites', patterns: [/ok je comprends/i, /si t'as besoin d'espace/i, /je respecte/i] },
  { label: 'Communication saine', patterns: [/je ressens/i, /ça me touche/i, /parlons-en/i, /je t'écoute/i] },
  { label: 'Encouragement', patterns: [/tu gères/i, /je suis fier|fière/i, /t'es incroyable/i, /bravo/i] },
  { label: 'Empathie', patterns: [/je comprends (que|ce que)/i, /c'est difficile/i, /je suis là/i] },
  { label: 'Affection saine', patterns: [/je t'aime/i, /tu me manques/i, /j'aime être avec toi/i] },
];

/**
 * Analyse un tableau de messages et retourne un score de communication
 */
export function analyzeMessages(messages: { content: string; isFromMe: boolean }[]): CommunicationScore {
  const partnerMessages = messages.filter((m) => !m.isFromMe).map((m) => m.content).join(' ');
  const allText = messages.map((m) => m.content).join(' ');

  const detectedRedFlags: RedFlag[] = [];
  const detectedGreenFlags: string[] = [];

  // Détecter les red flags dans les messages du partenaire
  for (const flagDef of RED_FLAG_PATTERNS) {
    const matches: string[] = [];
    for (const pattern of flagDef.patterns) {
      const found = partnerMessages.match(new RegExp(pattern.source, 'gi'));
      if (found) matches.push(...found);
    }
    if (matches.length > 0) {
      detectedRedFlags.push({
        type: flagDef.type,
        label: flagDef.label,
        severity: flagDef.severity,
        matches: matches.slice(0, 3),
      });
    }
  }

  // Détecter les green flags dans tout l'échange
  for (const gf of GREEN_FLAG_PATTERNS) {
    for (const pattern of gf.patterns) {
      if (pattern.test(allText)) {
        if (!detectedGreenFlags.includes(gf.label)) {
          detectedGreenFlags.push(gf.label);
        }
      }
    }
  }

  // Calculer le score
  const redFlagPenalty = detectedRedFlags.reduce((sum, f) => sum + f.severity * 8, 0);
  const greenFlagBonus = detectedGreenFlags.length * 5;
  const msgCountBonus = Math.min(messages.length * 0.5, 10);

  const respect = Math.max(0, 100 - redFlagPenalty + greenFlagBonus * 0.3);
  const empathy = Math.min(100, 40 + greenFlagBonus * 2 + msgCountBonus);
  const honesty = detectedRedFlags.some((f) => f.type === 'gaslighting') ? 30 : 75;
  const boundaries = detectedRedFlags.some((f) => f.type === 'control' || f.type === 'isolation') ? 20 : 80;
  const positivity = Math.min(100, 50 + detectedGreenFlags.length * 8);

  const total = Math.round(
    Math.max(0, Math.min(100, (respect * 0.3 + empathy * 0.2 + honesty * 0.2 + boundaries * 0.2 + positivity * 0.1) - redFlagPenalty * 0.1 + greenFlagBonus * 0.5))
  );

  // Générer le résumé
  let summary = '';
  if (total >= 80) {
    summary = 'Votre communication semble saine et équilibrée. Continuez à vous exprimer avec respect et empathie.';
  } else if (total >= 60) {
    summary = 'La communication présente quelques tensions. Des discussions ouvertes pourraient aider à clarifier certains points.';
  } else if (total >= 40) {
    summary = 'Plusieurs signaux préoccupants ont été détectés. Réfléchissez à vos besoins et limites dans cette relation.';
  } else {
    summary = 'Des comportements potentiellement toxiques ont été identifiés. Votre bien-être est la priorité. Parlez à quelqu\'un de confiance.';
  }

  return {
    total,
    categories: {
      respect: Math.round(respect),
      empathy: Math.round(empathy),
      honesty: Math.round(honesty),
      boundaries: Math.round(boundaries),
      positivity: Math.round(positivity),
    },
    redFlags: detectedRedFlags,
    greenFlags: detectedGreenFlags,
    summary,
  };
}
