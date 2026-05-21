// Date de début du programme - à ajuster selon le vrai début d'Alex
export const PROGRAMME_START_DATE = new Date('2026-05-21T00:00:00');

// Calcule le jour du programme (1-indexé) en heure France
export function getJourActuel() {
  const now = new Date();
  const franceOffset = getFranceOffset(now);
  const nowFrance = new Date(now.getTime() + franceOffset);
  const startFrance = new Date(PROGRAMME_START_DATE.getTime());
  const diff = nowFrance - startFrance;
  const jourIndex = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, jourIndex); // 0-indexé
}

function getFranceOffset(date) {
  // France = UTC+1 (hiver) ou UTC+2 (été)
  const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  const isDST = date.getTimezoneOffset() < Math.max(jan, jul);
  return isDST ? 2 * 3600000 : 1 * 3600000;
}

export function getSemaineActuelle() {
  return Math.floor(getJourActuel() / 7) + 1;
}

export function getJourDansSemaine() {
  return (getJourActuel() % 7) + 1; // 1-7
}

export function getDaysElapsed() {
  return getJourActuel();
}

// Programme complet sur 7 semaines (49 jours)
// Chaque jour : taches à cocher + rappels rouges
export const PROGRAMME_JOURS = [
  // SEMAINE 1 - Phase 1 : Stabilisation et premiers pas
  {
    jour: 1, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j1_1", texte: "Se lever avant 9h, se doucher, s'habiller" },
      { id: "j1_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j1_3", texte: "Marcher 30 minutes minimum (sortir dehors)" },
      { id: "j1_4", texte: "Manger 2 vrais repas dans la journée" },
      { id: "j1_5", texte: "Ne pas envoyer de message à Camille entre 22h et 8h" },
      { id: "j1_6", texte: "Écrire dans un carnet : comment je me sens aujourd'hui (5 min)" },
    ],
    rappels: [
      "Pas de cocaïne. Zéro. Même 'juste une fois'.",
      "Pas de message accusateur sans preuve concrète",
      "Pas de surveillance de la localisation de Camille",
    ]
  },
  {
    jour: 2, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j2_1", texte: "Se lever avant 9h, se doucher, s'habiller" },
      { id: "j2_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j2_3", texte: "30 minutes de vélo ou marche active" },
      { id: "j2_4", texte: "Appeler ou contacter son médecin / addictologue pour prendre RDV" },
      { id: "j2_5", texte: "Manger 2 vrais repas dans la journée" },
      { id: "j2_6", texte: "Écouter de la musique et noter une idée créative (production, clip, texte)" },
    ],
    rappels: [
      "Pas de cocaïne. Ni ce soir, ni demain, ni 'une dernière fois'.",
      "Pas de messages après minuit, même si tu dors pas",
      "Ne pas regarder les archives Instagram de Camille",
    ]
  },
  {
    jour: 3, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j3_1", texte: "Se lever avant 9h, se doucher, s'habiller" },
      { id: "j3_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j3_3", texte: "Séance de musculation ou sport 40 min" },
      { id: "j3_4", texte: "Cuisiner un vrai repas (pas juste commander)" },
      { id: "j3_5", texte: "Envoyer 1 message positif à un ami (Valentin ou autre)" },
      { id: "j3_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Ne pas envoyer de message à Camille la nuit",
      "Ne pas demander à voir son téléphone ou ses réseaux",
      "Ne pas rejouer mentalement les anciens conflits pour avoir raison",
    ]
  },
  {
    jour: 4, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j4_1", texte: "Se lever avant 9h, se doucher, s'habiller" },
      { id: "j4_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j4_3", texte: "Marcher 45 minutes (choisir un nouvel itinéraire)" },
      { id: "j4_4", texte: "Travailler sur un projet musical (même 30 min)" },
      { id: "j4_5", texte: "Tenir son carnet d'humeur : 3 émotions ressenties aujourd'hui" },
      { id: "j4_6", texte: "Manger 2 vrais repas dans la journée" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Si Camille ne répond pas vite : noter ce qu'on ressent dans le carnet, ne pas envoyer de message accusateur",
      "Pas de mot brutal même en crise",
    ]
  },
  {
    jour: 5, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j5_1", texte: "Se lever avant 9h, se doucher, s'habiller" },
      { id: "j5_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j5_3", texte: "Séance de sport (vélo, muscu ou marche rapide)" },
      { id: "j5_4", texte: "Appeler (pas seulement SMS) quelqu'un de sa famille ou un ami" },
      { id: "j5_5", texte: "Cuisiner ou manger un vrai repas en dehors de chez soi" },
      { id: "j5_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Ne pas utiliser la jalousie comme preuve d'amour",
      "Pas de demande d'argent à Camille",
      "Pas de surveillance (localisation, réseaux, téléphone)",
    ]
  },
  {
    jour: 6, semaine: 1,
    etape: "Étape 1 — Poser les fondations",
    taches: [
      { id: "j6_1", texte: "Se lever avant 10h (weekend : un peu de marge)" },
      { id: "j6_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j6_3", texte: "1h de sport ou activité physique" },
      { id: "j6_4", texte: "Travailler sur sa musique ou sa boutique Etsy" },
      { id: "j6_5", texte: "Sortir de chez soi (pas rester enfermé toute la journée)" },
      { id: "j6_6", texte: "Écrire dans son carnet : ce qui a été difficile cette semaine et pourquoi" },
    ],
    rappels: [
      "Pas de cocaïne — le weekend c'est le moment le plus dangereux",
      "Ne pas passer la journée à attendre un message de Camille",
      "Pas de messages impulsifs ni de suppressions après envoi",
    ]
  },
  {
    jour: 7, semaine: 1,
    etape: "Étape 1 — Bilan semaine 1",
    taches: [
      { id: "j7_1", texte: "Se lever avant 10h" },
      { id: "j7_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j7_3", texte: "Promenade ou vélo : 45 min" },
      { id: "j7_4", texte: "Relire son carnet de la semaine et écrire un bilan honnête" },
      { id: "j7_5", texte: "Planifier ses objectifs pour la semaine 2" },
      { id: "j7_6", texte: "Cuisiner quelque chose de bon pour soi" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Bilan honnête : pas d'auto-flagellation mais pas de mensonges non plus",
      "Ne pas envoyer de message nocturne même si le bilan est difficile",
    ]
  },

  // SEMAINE 2 - Construire une routine
  {
    jour: 8, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j8_1", texte: "Se lever avant 8h30 (objectif semaine 2 : plus tôt)" },
      { id: "j8_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j8_3", texte: "Sport : 40 min vélo ou muscu" },
      { id: "j8_4", texte: "Travailler sur la musique ou la boutique Etsy (1h minimum)" },
      { id: "j8_5", texte: "Avoir un repas structure (heure fixe, assis, pas en scrollant)" },
      { id: "j8_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Pas de message accusateur sans preuve — l'incertitude fait partie de la confiance",
      "Toujours attendre 20 minutes avant d'envoyer un message de colère",
    ]
  },
  {
    jour: 9, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j9_1", texte: "Se lever avant 8h30" },
      { id: "j9_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j9_3", texte: "RDV médecin / psychiatre ou appel de confirmation RDV" },
      { id: "j9_4", texte: "Marcher 30 min à l'extérieur" },
      { id: "j9_5", texte: "Manger 2 repas assis, sans téléphone" },
      { id: "j9_6", texte: "Écrire dans carnet : une chose dont je suis fier aujourd'hui" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas interrompre une conversation difficile par un emoji ou changement de sujet",
      "Pas de messages la nuit",
    ]
  },
  {
    jour: 10, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j10_1", texte: "Se lever avant 8h30" },
      { id: "j10_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j10_3", texte: "Séance muscu ou vélo 45 min" },
      { id: "j10_4", texte: "Progresser sur un projet concret (musique, Etsy, autre)" },
      { id: "j10_5", texte: "Contacter Valentin ou un ami pour planifier un vrai moment" },
      { id: "j10_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rejouer les anciens conflits pour avoir raison",
      "Pas de surveillance de localisation ou réseaux sociaux de Camille",
    ]
  },
  {
    jour: 11, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j11_1", texte: "Se lever avant 8h30" },
      { id: "j11_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j11_3", texte: "Marche ou vélo 30 min" },
      { id: "j11_4", texte: "Cuisiner un vrai repas fait maison" },
      { id: "j11_5", texte: "Pratiquer la musique ou chanter (même seul) 30 min" },
      { id: "j11_6", texte: "Tenir son carnet : noter une peur du jour et ce qu'elle cache vraiment" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas demander à voir le téléphone de Camille",
      "Pas de mot brutal même en pleine dispute",
    ]
  },
  {
    jour: 12, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j12_1", texte: "Se lever avant 8h30" },
      { id: "j12_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j12_3", texte: "Sport 45 min" },
      { id: "j12_4", texte: "Sortir pour faire quelque chose (café, promenade en ville, magasin)" },
      { id: "j12_5", texte: "Écrire ou enregistrer une idée musicale" },
      { id: "j12_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — vendredi est un jour à risque",
      "Ne pas passer des heures à analyser les stories ou le profil de Camille",
      "Si angoisse monte : respirer, noter dans carnet, NE PAS envoyer",
    ]
  },
  {
    jour: 13, semaine: 2,
    etape: "Étape 2 — Construire une routine solide",
    taches: [
      { id: "j13_1", texte: "Se lever avant 10h" },
      { id: "j13_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j13_3", texte: "1h de sport (weekend : aller plus loin, nouvelle sortie)" },
      { id: "j13_4", texte: "Cuisiner ou manger dehors avec quelqu'un (pas seul)" },
      { id: "j13_5", texte: "Travailler sur la boutique Etsy ou projet musical" },
      { id: "j13_6", texte: "Pas de cocaine — rester focus même quand c'est le weekend" },
    ],
    rappels: [
      "Pas de cocaïne — weekend = vigilance maximale",
      "Ne pas rester enfermé toute la journée",
      "Ne pas écrire à Camille la nuit même si tu dors pas",
    ]
  },
  {
    jour: 14, semaine: 2,
    etape: "Étape 2 — Bilan semaine 2",
    taches: [
      { id: "j14_1", texte: "Se lever avant 10h" },
      { id: "j14_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j14_3", texte: "Promenade tranquille 45 min (se vider la tête)" },
      { id: "j14_4", texte: "Bilan écrit : qu'est-ce qui a changé en 2 semaines ?" },
      { id: "j14_5", texte: "Fixer un objectif concret pour la semaine 3" },
      { id: "j14_6", texte: "Appeler quelqu'un qu'on aime (famille ou ami)" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Le bilan doit être honnête — ni trop sévère ni complaisance",
      "Ne pas instrumentaliser les progrès pour impressionner Camille",
    ]
  },

  // SEMAINE 3 - Travailler la confiance
  {
    jour: 15, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j15_1", texte: "Se lever avant 8h30" },
      { id: "j15_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j15_3", texte: "Sport 45 min" },
      { id: "j15_4", texte: "Exercice : quand une pensée jalouse arrive, l'écrire dans le carnet AU LIEU d'envoyer un message" },
      { id: "j15_5", texte: "Travailler sur un projet personnel (musique, Etsy)" },
      { id: "j15_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Supprimer les apps de localisation ou désactiver la surveillance",
      "Pas de questions déguisées en inquiétude ('tu parles à qui ?')",
    ]
  },
  {
    jour: 16, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j16_1", texte: "Se lever avant 8h30" },
      { id: "j16_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j16_3", texte: "Vélo ou marche 40 min" },
      { id: "j16_4", texte: "Lire ou écouter quelque chose sur la peur de l'abandon (podcast, article)" },
      { id: "j16_5", texte: "Manger 2 repas correctement" },
      { id: "j16_6", texte: "Carnet : noter une preuve concrète que Camille est digne de confiance" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas interpréter chaque silence comme une trahison",
      "Pas de message accusateur",
    ]
  },
  {
    jour: 17, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j17_1", texte: "Se lever avant 8h30" },
      { id: "j17_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j17_3", texte: "Sport 45 min" },
      { id: "j17_4", texte: "RDV psychiatre ou thérapeute (ou appel pour en trouver un)" },
      { id: "j17_5", texte: "Préparer un vrai repas" },
      { id: "j17_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rejouer les conflits passés pour avoir raison",
      "Pas de surveillance des réseaux de Camille",
    ]
  },
  {
    jour: 18, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j18_1", texte: "Se lever avant 8h30" },
      { id: "j18_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j18_3", texte: "Marche 30 min + 15 min de respiration consciente ou méditation" },
      { id: "j18_4", texte: "Travailler sur la musique (créer, pas juste écouter)" },
      { id: "j18_5", texte: "Exercice : écrire une chose que tu feras différemment la prochaine fois que tu sens la jalousie monter" },
      { id: "j18_6", texte: "Manger 2 vrais repas" },
    ],
    rappels: [
      "Pas de cocaïne",
      "La jalousie n'est pas une preuve d'amour — c'est une preuve d'insécurité",
      "Pas de demande d'argent à Camille",
    ]
  },
  {
    jour: 19, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j19_1", texte: "Se lever avant 8h30" },
      { id: "j19_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j19_3", texte: "Sport 45 min" },
      { id: "j19_4", texte: "Sortir seul pour une activité (café, cinéma, balade)" },
      { id: "j19_5", texte: "Appeler un ami (Valentin ou autre) pour vraiment parler" },
      { id: "j19_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — vendredi : vigilance",
      "Ne pas envoyer de message impulsif en soirée",
      "Ne pas passer la nuit à analyser Instagram",
    ]
  },
  {
    jour: 20, semaine: 3,
    etape: "Étape 3 — Apprendre à faire confiance",
    taches: [
      { id: "j20_1", texte: "Se lever avant 10h" },
      { id: "j20_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j20_3", texte: "1h de sport à l'extérieur" },
      { id: "j20_4", texte: "Passer du temps avec quelqu'un (amis ou famille)" },
      { id: "j20_5", texte: "Travailler sur la boutique Etsy ou projet" },
      { id: "j20_6", texte: "Pas de cocaïne — noter dans carnet si l'envie est là et pourquoi" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rester seul enfermé le weekend",
      "Si angoisse : carnet, respiration, NE PAS surveiller",
    ]
  },
  {
    jour: 21, semaine: 3,
    etape: "Étape 3 — Bilan semaine 3",
    taches: [
      { id: "j21_1", texte: "Se lever avant 10h" },
      { id: "j21_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j21_3", texte: "Promenade calme" },
      { id: "j21_4", texte: "Bilan : combien de fois ai-je eu envie de surveiller / accuser cette semaine ? Combien de fois j'ai résisté ?" },
      { id: "j21_5", texte: "Planifier un vrai projet concret pour la semaine à venir" },
      { id: "j21_6", texte: "Cuisiner quelque chose de bien" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Le bilan doit inclure les victoires, pas juste les echecs",
      "Ne pas utiliser les progrès pour demander quelque chose à Camille",
    ]
  },

  // SEMAINE 4 - Communication
  {
    jour: 22, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j22_1", texte: "Se lever avant 8h" },
      { id: "j22_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j22_3", texte: "Sport 45 min" },
      { id: "j22_4", texte: "Exercice : reformuler 3 phrases accusatrices en phrases 'je' (dans le carnet)" },
      { id: "j22_5", texte: "Travailler sur un projet personnel 1h" },
      { id: "j22_6", texte: "Coucher avant 23h30" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Avant d'envoyer un message : est-ce que ça nourrit la relation ou mon angoisse ?",
      "Pas de mots brutaux même en crise",
    ]
  },
  {
    jour: 23, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j23_1", texte: "Se lever avant 8h" },
      { id: "j23_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j23_3", texte: "Marche ou vélo 40 min" },
      { id: "j23_4", texte: "Lire ou écouter quelque chose sur la communication non-violente" },
      { id: "j23_5", texte: "Manger 2 repas assis, sans téléphone" },
      { id: "j23_6", texte: "Carnet : une chose que j'aurais pu dire autrement cette semaine" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas supprimer ses messages — ça crée de l'instabilité",
      "Pas de messages après minuit",
    ]
  },
  {
    jour: 24, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j24_1", texte: "Se lever avant 8h" },
      { id: "j24_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j24_3", texte: "Muscu ou sport intense 45 min" },
      { id: "j24_4", texte: "Avoir une vraie conversation (pas juste SMS) avec quelqu'un" },
      { id: "j24_5", texte: "Travailler sur la musique ou Etsy" },
      { id: "j24_6", texte: "Coucher avant 23h30" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas interrompre une conversation difficile par un emoji",
      "Reconnaître ses torts avec des actes, pas juste des mots",
    ]
  },
  {
    jour: 25, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j25_1", texte: "Se lever avant 8h" },
      { id: "j25_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j25_3", texte: "Vélo 45 min" },
      { id: "j25_4", texte: "Exercice : écouter Camille ou un proche sans interrompre — noter ce qu'on a entendu" },
      { id: "j25_5", texte: "Cuisiner un vrai repas" },
      { id: "j25_6", texte: "Écrire dans carnet : une peur que je cache derrière de la colère" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas faire de menaces déguisées en inquiétude",
      "Pas de surveillance des réseaux",
    ]
  },
  {
    jour: 26, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j26_1", texte: "Se lever avant 8h" },
      { id: "j26_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j26_3", texte: "Sport 45 min" },
      { id: "j26_4", texte: "Sortir pour une activité à l'extérieur" },
      { id: "j26_5", texte: "Travailler sur un projet concret 1h" },
      { id: "j26_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — vendredi : danger",
      "Ne pas passer la soirée à attendre un message",
      "Si envie d'accuser : poser le téléphone 20 min",
    ]
  },
  {
    jour: 27, semaine: 4,
    etape: "Étape 4 — Apprendre à communiquer sans blesser",
    taches: [
      { id: "j27_1", texte: "Se lever avant 10h" },
      { id: "j27_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j27_3", texte: "1h de sport ou activité physique" },
      { id: "j27_4", texte: "Passer du temps avec des gens (famille, amis)" },
      { id: "j27_5", texte: "Travailler sur la musique (créer quelque chose de concret)" },
      { id: "j27_6", texte: "Pas de cocaïne" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas passer la journée seul enfermé",
      "Ne pas écrire à Camille sous l'effet de l'angoisse",
    ]
  },
  {
    jour: 28, semaine: 4,
    etape: "Étape 4 — Bilan semaine 4 — Mi-parcours",
    taches: [
      { id: "j28_1", texte: "Se lever avant 10h" },
      { id: "j28_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j28_3", texte: "Promenade 45 min" },
      { id: "j28_4", texte: "Bilan de mi-parcours : qu'est-ce qui a vraiment changé en 4 semaines ?" },
      { id: "j28_5", texte: "Écrire une lettre à soi-même dans 2 mois (pas à envoyer)" },
      { id: "j28_6", texte: "Cuisiner un bon repas pour soi" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Le bilan doit être honnête — se féliciter des vraies victoires",
      "Ne pas instrumentaliser les progrès",
    ]
  },

  // SEMAINE 5 - Développer une vie propre
  {
    jour: 29, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j29_1", texte: "Se lever avant 8h" },
      { id: "j29_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j29_3", texte: "Sport 50 min" },
      { id: "j29_4", texte: "Avancer sur la boutique Etsy (ajouter ou améliorer un produit)" },
      { id: "j29_5", texte: "Manger 2 repas correctement" },
      { id: "j29_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Le but n'est pas d'impressionner Camille — c'est de te construire pour toi",
      "Ne pas attendre d'aller mieux pour commencer : commencer aide à aller mieux",
    ]
  },
  {
    jour: 30, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j30_1", texte: "Se lever avant 8h" },
      { id: "j30_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j30_3", texte: "Vélo ou marche rapide 40 min" },
      { id: "j30_4", texte: "Reprendre contact avec le monde du travail (recherche, appel, démarche)" },
      { id: "j30_5", texte: "Cuisiner ou manger avec quelqu'un" },
      { id: "j30_6", texte: "Carnet : ce que je construis qui est à moi, pour moi" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas compter uniquement sur Camille pour remplir le temps vide",
      "Pas de demande d'argent",
    ]
  },
  {
    jour: 31, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j31_1", texte: "Se lever avant 8h" },
      { id: "j31_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j31_3", texte: "Muscu ou sport intense 50 min" },
      { id: "j31_4", texte: "Travailler sur la musique : enregistrer quelque chose, même imparfait" },
      { id: "j31_5", texte: "Appeler un ami" },
      { id: "j31_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas abandonner un projet à la première difficulté",
      "Pas de mots brutaux",
    ]
  },
  {
    jour: 32, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j32_1", texte: "Se lever avant 8h" },
      { id: "j32_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j32_3", texte: "Marche 45 min + méditation 10 min" },
      { id: "j32_4", texte: "Démarche travail : contacter une personne, envoyer un CV, ou chercher activement" },
      { id: "j32_5", texte: "Cuisiner un vrai repas" },
      { id: "j32_6", texte: "Carnet : qu'est-ce que je ferais si Camille n'existait pas ? Quels projets ?" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas utiliser la guérison comme argument de séduction",
      "Pas de surveillance",
    ]
  },
  {
    jour: 33, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j33_1", texte: "Se lever avant 8h" },
      { id: "j33_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j33_3", texte: "Sport 50 min" },
      { id: "j33_4", texte: "Sortir pour une activité qui te plaît" },
      { id: "j33_5", texte: "Avancer sur Etsy ou musique" },
      { id: "j33_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — vendredi : tenir bon",
      "Ne pas passer le vendredi soir à angoisser sur où est Camille",
      "Pas de message impulsif",
    ]
  },
  {
    jour: 34, semaine: 5,
    etape: "Étape 5 — Développer une vie qui n'appartient qu'à toi",
    taches: [
      { id: "j34_1", texte: "Se lever avant 10h" },
      { id: "j34_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j34_3", texte: "1h de sport ou activité physique" },
      { id: "j34_4", texte: "Faire quelque chose de créatif (musique, cuisine, dessin, peu importe)" },
      { id: "j34_5", texte: "Passer du temps avec quelqu'un" },
      { id: "j34_6", texte: "Pas de cocaïne" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rester seul à ruminer",
      "Ne pas écrire des messages nocturnes",
    ]
  },
  {
    jour: 35, semaine: 5,
    etape: "Étape 5 — Bilan semaine 5",
    taches: [
      { id: "j35_1", texte: "Se lever avant 10h" },
      { id: "j35_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j35_3", texte: "Promenade 45 min" },
      { id: "j35_4", texte: "Bilan : qu'est-ce que j'ai construit qui est à moi ?" },
      { id: "j35_5", texte: "Planifier une action concrète pour la semaine 6" },
      { id: "j35_6", texte: "Cuisiner quelque chose de bien" },
    ],
    rappels: [
      "Pas de cocaïne",
      "5 semaines — c'est réel. Se féliciter honnêtement.",
      "Ne pas attendre Camille pour continuer",
    ]
  },

  // SEMAINE 6 - Équilibre et autonomie
  {
    jour: 36, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j36_1", texte: "Se lever avant 8h" },
      { id: "j36_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j36_3", texte: "Sport 50 min" },
      { id: "j36_4", texte: "Avancer sur le travail (démarche, projet, heures)" },
      { id: "j36_5", texte: "Faire quelque chose de beau pour quelqu'un d'autre (sans rien attendre)" },
      { id: "j36_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas se remettre en couple avant d'avoir fait toutes les étapes",
      "Pas de messages accusateurs",
    ]
  },
  {
    jour: 37, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j37_1", texte: "Se lever avant 8h" },
      { id: "j37_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j37_3", texte: "Vélo ou marche 40 min" },
      { id: "j37_4", texte: "RDV psychiatre ou thérapeute" },
      { id: "j37_5", texte: "Cuisiner pour soi ou pour d'autres" },
      { id: "j37_6", texte: "Carnet : comment je me sens aujourd'hui sans avoir besoin d'approbation ?" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Croire que l'amour suffit sans le travail concret : FAUX",
      "Pas de surveillance",
    ]
  },
  {
    jour: 38, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j38_1", texte: "Se lever avant 8h" },
      { id: "j38_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j38_3", texte: "Muscu ou sport 50 min" },
      { id: "j38_4", texte: "Travailler sur la musique ou Etsy" },
      { id: "j38_5", texte: "Appeler quelqu'un juste pour prendre des nouvelles (pas parler de ses angoisses)" },
      { id: "j38_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Retomber dans les anciens schémas à la première dispute : le danger est là",
      "Pas de mots brutaux",
    ]
  },
  {
    jour: 39, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j39_1", texte: "Se lever avant 8h" },
      { id: "j39_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j39_3", texte: "Marche 45 min" },
      { id: "j39_4", texte: "Démarche concrète vers l'indépendance financière (travail, projet)" },
      { id: "j39_5", texte: "Cuisiner un vrai repas" },
      { id: "j39_6", texte: "Carnet : qu'est-ce que j'offre à une relation aujourd'hui que je n'offrais pas avant ?" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Pas de demande d'argent",
      "Ne pas attendre que Camille revienne sans avoir changé",
    ]
  },
  {
    jour: 40, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j40_1", texte: "Se lever avant 8h" },
      { id: "j40_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j40_3", texte: "Sport 50 min" },
      { id: "j40_4", texte: "Faire quelque chose qui te plaît vraiment (juste pour toi)" },
      { id: "j40_5", texte: "Avancer sur un projet concret" },
      { id: "j40_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — vendredi : tenir bon encore une fois",
      "Ne pas proposer un projet à Camille avant d'être prêt",
      "Pas de message impulsif",
    ]
  },
  {
    jour: 41, semaine: 6,
    etape: "Étape 6 — Devenir quelqu'un qui n'a plus besoin d'elle pour exister",
    taches: [
      { id: "j41_1", texte: "Se lever avant 10h" },
      { id: "j41_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j41_3", texte: "1h de sport extérieur" },
      { id: "j41_4", texte: "Passer du temps avec des gens" },
      { id: "j41_5", texte: "Travailler sur la musique (partager quelque chose si prêt)" },
      { id: "j41_6", texte: "Pas de cocaïne" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rester seul enfermé",
      "Ne pas écrire à Camille la nuit",
    ]
  },
  {
    jour: 42, semaine: 6,
    etape: "Étape 6 — Bilan semaine 6",
    taches: [
      { id: "j42_1", texte: "Se lever avant 10h" },
      { id: "j42_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j42_3", texte: "Promenade 45 min" },
      { id: "j42_4", texte: "Bilan complet : 6 semaines. Qu'est-ce qui a vraiment changé en moi ?" },
      { id: "j42_5", texte: "Écrire ce dont j'ai besoin pour les 2 prochaines semaines" },
      { id: "j42_6", texte: "Cuisiner un bon repas, se faire plaisir" },
    ],
    rappels: [
      "Pas de cocaïne",
      "6 semaines. Honnêteté totale dans le bilan.",
      "Ne pas instrumentaliser les progrès",
    ]
  },

  // SEMAINE 7 - Consolidation
  {
    jour: 43, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j43_1", texte: "Se lever avant 8h" },
      { id: "j43_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j43_3", texte: "Sport 50 min" },
      { id: "j43_4", texte: "Avancer sur un projet concret (travail, musique, Etsy)" },
      { id: "j43_5", texte: "Faire quelque chose de bien pour quelqu'un" },
      { id: "j43_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Les acquis fragiles : continuer même quand ça va mieux",
      "Pas de messages nocturnes",
    ]
  },
  {
    jour: 44, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j44_1", texte: "Se lever avant 8h" },
      { id: "j44_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j44_3", texte: "Vélo ou marche 40 min" },
      { id: "j44_4", texte: "RDV médical (psychiatre, addictologue, ou médecin)" },
      { id: "j44_5", texte: "Cuisiner 2 repas faits maison" },
      { id: "j44_6", texte: "Carnet : ce que je ressens quand je fais confiance" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas stopper le traitement parce que ça va mieux",
      "Pas de surveillance",
    ]
  },
  {
    jour: 45, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j45_1", texte: "Se lever avant 8h" },
      { id: "j45_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j45_3", texte: "Muscu 50 min" },
      { id: "j45_4", texte: "Travailler sur la musique (créer ou publier)" },
      { id: "j45_5", texte: "Sortir et faire une activité à l'extérieur" },
      { id: "j45_6", texte: "Coucher avant 23h" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas retomber dans les anciens schémas à la première tension",
      "Pas de mots brutaux",
    ]
  },
  {
    jour: 46, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j46_1", texte: "Se lever avant 8h" },
      { id: "j46_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j46_3", texte: "Sport 50 min" },
      { id: "j46_4", texte: "Avoir une vraie conversation (écouter vraiment)" },
      { id: "j46_5", texte: "Avancer sur un projet" },
      { id: "j46_6", texte: "Carnet : une chose concrète que j'ai changée pour de bon" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas attendre d'aller parfaitement pour s'autoriser à être heureux",
      "Pas de demande d'argent",
    ]
  },
  {
    jour: 47, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j47_1", texte: "Se lever avant 8h" },
      { id: "j47_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j47_3", texte: "Sport 50 min" },
      { id: "j47_4", texte: "Faire quelque chose qui te plaît vraiment" },
      { id: "j47_5", texte: "Avancer sur Etsy ou musique" },
      { id: "j47_6", texte: "Coucher avant minuit" },
    ],
    rappels: [
      "Pas de cocaïne — 7ème vendredi : tu en es capable",
      "Ne pas relâcher les gardes",
      "Pas de message impulsif",
    ]
  },
  {
    jour: 48, semaine: 7,
    etape: "Étape 7 — Consolider et tenir",
    taches: [
      { id: "j48_1", texte: "Se lever avant 10h" },
      { id: "j48_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j48_3", texte: "1h de sport ou activité physique" },
      { id: "j48_4", texte: "Passer du temps de qualité avec des gens qu'on aime" },
      { id: "j48_5", texte: "Travailler sur la musique ou projet créatif" },
      { id: "j48_6", texte: "Pas de cocaïne" },
    ],
    rappels: [
      "Pas de cocaïne",
      "Ne pas rester seul enfermé à ruminer",
      "Pas de message nocturne",
    ]
  },
  {
    jour: 49, semaine: 7,
    etape: "Étape 7 — Bilan final : 7 semaines",
    taches: [
      { id: "j49_1", texte: "Se lever avant 10h" },
      { id: "j49_2", texte: "Prendre son traitement psychiatrique" },
      { id: "j49_3", texte: "Promenade longue (1h) : réfléchir, respirer" },
      { id: "j49_4", texte: "Bilan final : relire tous les bilans depuis la semaine 1. Qu'est-ce qui a changé ?" },
      { id: "j49_5", texte: "Écrire une lettre à Alex dans 6 mois" },
      { id: "j49_6", texte: "Cuisiner un repas dont tu es fier et le partager avec quelqu'un" },
    ],
    rappels: [
      "Pas de cocaïne — et si tu es arrivé jusqu'ici sans, c'est ÉNORME",
      "7 semaines. Ce n'est pas une fin — c'est un début.",
      "Camille ne reviendra pas parce que tu auras fait un programme. Elle reviendra — peut-être — parce que tu seras devenu quelqu'un qui n'a plus besoin d'elle pour exister.",
    ]
  }
];
