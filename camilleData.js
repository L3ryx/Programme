// ─── Données Camille – extraites de l'analyse de la conversation WhatsApp ────
// Goûts, surnoms, blagues, sujets de conversation personnalisés

export const surnomsReciproques = {
  // Camille appelle Alex
  pourAlex: ["Lexou", "Pti Lexou", "Mon petit coquin", "Ma petit marmotte", "Bibi"],
  // Alex peut appeler Camille
  pourCamille: ["Bibiche", "Bibi", "Bichebiche", "Cookie", "Camilla bella vita", "Agent Camille", "Ma ptite Camille"],
};

export const camilleProfile = {
  activites: [
    "Course à pied (le matin avec sa sœur)",
    "Roller (elle adore ça et s'y remet régulièrement)",
    "Sport / exercices à domicile",
    "Faire des cookies (jusqu'à 22 par fournée, à l'airfryer)",
    "Le marché du dimanche matin",
    "Les colis Temu (elle en reçoit souvent)",
    "Regarder des séries (Mercredi notamment)",
  ],
  caractere: [
    "Très patiente et bienveillante",
    "Transparente et directe",
    "Organisée (fait les courses, range, planifie)",
    "Famille importante (sa mère, son parrain Christophe, sa sœur Marie, ses frères Thomas et Charles)",
    "Attentionnée – pense aux autres avant elle",
    "Aime rire et taquiner gentiment",
  ],
  aimeBien: [
    "La musique rythmique et entraînante",
    "Le rythme indien / flûte",
    "Prendre soin de son corps (crème, sport, alimentation saine)",
    "Les moments calmes en famille",
    "La nature / se balader",
    "Cuisiner (cookies, gâteaux variés)",
  ],
};

// ─── Contenu générable par catégorie ─────────────────────────────────────────

export const categoriesContenu = [
  {
    id: "surnom",
    label: "Surnom du jour",
    emoji: "💕",
    couleur: "#FF6B9D",
    couleurSoft: "#3D1A2A",
  },
  {
    id: "compliment",
    label: "Compliment sincère",
    emoji: "✨",
    couleur: "#FFB347",
    couleurSoft: "#3D2A0A",
  },
  {
    id: "blague",
    label: "Blague / taquinerie",
    emoji: "😄",
    couleur: "#58E8A0",
    couleurSoft: "#0A2D1A",
  },
  {
    id: "sujet",
    label: "Sujet de convo",
    emoji: "💬",
    couleur: "#58A6FF",
    couleurSoft: "#0A1D3D",
  },
  {
    id: "message",
    label: "Message complet",
    emoji: "💌",
    couleur: "#C778EA",
    couleurSoft: "#2A0A3D",
  },
];

// ─── Pool de contenus sur 3 mois (~46 sorties tous les 2 jours) ───────────────

export const poolSurnoms = [
  "Cookie 🍪",
  "Ma bibiche",
  "Camilla bella vita 🌸",
  "Mon agent Camille 🕵️",
  "Ma ptite Camille qui court le matin 🏃",
  "Ma rolleuse préférée 🛼",
  "Ma championne des 22 cookies 🍪🍪",
  "Ma bichebiche",
  "Miss Temu 📦",
  "La reine du marché du dimanche 🥦",
  "Ma super héroïne du quotidien 💪",
  "Mon soleil du matin 🌞",
  "Ma Camille aux mille qualités 💎",
  "Fée du logis et du airfryer ✨",
  "Ma battante du roller 🛼",
  "La philosophe bienveillante 🌿",
  "Mon petit rayon de douceur 🌸",
  "Mademoiselle Cookie à l'airfryer 👩‍🍳",
  "Ma Camille intrépide 🌟",
  "Mon ancre dans la tempête ⚓",
];

export const poolCompliments = [
  "T'as cette capacité rare de rester douce même quand les situations sont compliquées. C'est vraiment une qualité précieuse.",
  "Quand tu parles de ta famille, on sent à quel point tu tiens aux gens que tu aimes. C'est beau.",
  "Ta façon de te motiver pour courir le matin même quand c'est dur, ça m'impressionne vraiment.",
  "T'es quelqu'un de foncièrement honnête. Tu dis les choses clairement mais sans jamais blesser. C'est un vrai talent.",
  "Les 22 cookies à l'airfryer un dimanche matin… t'es capable de tout haha. Sérieusement, ton énergie pour prendre soin des gens c'est beau.",
  "Tu as une intelligence émotionnelle que beaucoup de gens n'ont pas. Tu ressens les choses avec finesse.",
  "Le roller, la course, les exercices… tu prends vraiment soin de toi et ça se voit. T'as une belle discipline.",
  "Ta patience est infinie. Je le sais et je l'apprécie énormément.",
  "T'as un cœur immense. Tu donnes beaucoup sans jamais compter.",
  "Ton sens de la famille, la façon dont tu parles de ta mère, ton parrain, ta sœur Marie… ça montre qui tu es vraiment.",
  "Ta transparence est tellement reposante. On sait toujours où on en est avec toi.",
  "T'arrives à être directe sans être dure. C'est un équilibre rare.",
  "Ta façon de t'organiser – les courses, le marché, préparer des cookies pour la semaine – t'as une belle rigueur dans ta vie.",
  "Tu sais mettre des mots justes sur les choses compliquées. C'est un vrai don.",
  "Ta bienveillance n'est pas superficielle, elle vient de loin. Et ça se ressent.",
  "T'as réussi à rester toi-même dans des moments difficiles. Ça demande beaucoup de force.",
  "Quand tu ris, ça illumine vraiment la conversation. J'adore ça.",
  "Ta curiosité pour la musique, les rythmes, les sons… t'as une sensibilité artistique que j'aime beaucoup.",
  "T'as ce truc rare : être à la fois ancrée dans le réel et pleine de douceur. C'est précieux.",
  "Ta façon de prendre soin de toi corpo et mentalement, c'est inspirant.",
];

export const poolBlagues = [
  "Dis-moi, les 22 cookies c'était pour la semaine ou pour le week-end en fait ? 😏🍪",
  "T'as fait combien de km en roller aujourd'hui ? Je calcule le nombre de cookies que ça efface 😂",
  "J'ai une info exclusive : un colis Temu vient d'être expédié… dans ta direction 📦 (je veux 30% des trucs dedans)",
  "Le marché du dimanche c'est bien, mais admettons qu'il y a toujours ce légume bizarre que tu ramènes et que tu sais pas quoi faire 🤔🥦",
  "Toi : 'les cookies c'est pour la semaine' / Les cookies : 'on verra bien' 😂",
  "T'arrives à faire du roller et des cookies le même jour. Les scientifiques sont bluffés.",
  "Je t'ai trouvé un nouveau surnom : Cookie Rolleuse. Dépôt de marque en cours 🛼🍪",
  "T'as couru le matin, fait du roller l'après-midi, fait des cookies le soir. Camille, t'es humaine ou robot ? 🤖",
  "Le airfryer t'a changé la vie hein. Avant c'était 6 cookies à la fois, maintenant... toujours 6 mais en beaucoup plus de fournées 😂",
  "Ta to-do list du dimanche : marché ✓, cookies ✓, colis Temu ✓, roller ✓. La mienne : regarder mon plafond ✓",
  "T'as dit 'c'est pour la semaine' pour les cookies. J'ai mes doutes mais je t'aime quand même 😄",
  "Si un jour on trouve les cookies les plus parfaits du monde, je suis certain que c'est toi qui les auras faits.",
  "J'ai calculé : en vitesse de roller / nombre de cookies produits, ton ratio d'efficacité est de 3,7 cookies/km. Impressionnant.",
  "Ta sœur Marie et toi en train de courir le matin, ça doit ressembler à deux championnes olympiques préparant les JO 🏅",
  "Sérieusement t'aurais pu faire un business de cookies avec l'airfryer. 'Cookie by Camille' je vois ça bien 😂",
];

export const poolSujets = [
  "Demande-lui si elle a une nouvelle recette de cookies en tête ou si elle reste sur les classiques 🍪",
  "Parle-lui de comment s'est passé sa dernière sortie roller — distance, sensations, ambiance",
  "Demande-lui ce qu'elle a trouvé de sympa au marché cette semaine",
  "Parle-lui d'un morceau de musique avec un rythme entraînant que tu as écouté récemment",
  "Demande-lui comment va sa sœur Marie et si elles font encore leur running ensemble",
  "Parle d'un endroit où tu aimerais vous balader un jour, pas trop de monde, nature ou quartier sympa",
  "Demande-lui ce qu'elle regarde en ce moment comme série",
  "Parle-lui d'une chose simple que tu as cuisinée et qui t'a rendu fier",
  "Demande-lui quel est son cookie préféré parmi ceux qu'elle fait (et fais une vraie réponse quand elle explique)",
  "Parle d'un truc rigolo ou bizarre dans l'actu ou la culture pop — sans pression, juste pour rire un peu",
  "Demande-lui ce qu'elle prépare comme activité pour le week-end prochain",
  "Parle-lui d'une chanson dont le rythme t'a marqué cette semaine",
  "Demande-lui si elle a des nouvelles de sa famille (sa mère, son papy)",
  "Partage une anecdote courte et drôle sur ton quotidien, sans dramatiser",
  "Demande-lui ce qu'elle met dans ses cookies — ses ingrédients secrets 😏",
  "Parle d'un film ou d'une série que tu voudrais regarder avec elle un jour",
  "Demande-lui comment se passe sa routine sport – si elle varie les plaisirs",
  "Parle d'un endroit en plein air sympa que t'as repéré pour aller se balader",
  "Demande-lui ce qui l'a fait sourire cette semaine – quelque chose de simple",
  "Parle d'un truc que t'as appris ou découvert cette semaine, même petit",
];

export const poolMessages = [
  {
    tag: "Bonjour doux",
    texte: "Coucou toi 🌞\nJ'espère que tu as bien dormi et que la journée commence bien. Je pensais à toi ce matin sans raison particulière — juste que t'es quelqu'un de bien et ça méritait d'être dit. Bonne journée Cookie 🍪",
  },
  {
    tag: "Taquinerie cookies",
    texte: "Hey rolleuse aux cookies 🛼🍪\nAlors ce batch du jour, c'était combien de fournées à l'airfryer ? J'espère qu'il en reste pour la semaine… ou pas, j'aurais compris 😄\nJe pense à toi !",
  },
  {
    tag: "Sincère et simple",
    texte: "Camille,\nT'as une qualité que j'admire beaucoup : tu restes toi-même peu importe la situation. Directe mais douce, honnête sans jamais être cruelle. C'est rare.\nJe voulais juste te dire ça. 🌸",
  },
  {
    tag: "Curiosité légère",
    texte: "Hey toi 😊\nC'était quoi ta dernière sortie roller ? Parce que moi je t'imagine déchaînée sur un chemin sympa avec de la bonne musique dans les oreilles. J'ai pas tort haha\nBisous !",
  },
  {
    tag: "Marché du dimanche",
    texte: "Bonne séance marché ce matin ? 🥦\nTu ramènes quoi comme butin cette fois ? Un légume mystère que t'as pas encore cuisiné ? 😄\nJ'espère que le soleil est au rendez-vous chez toi.",
  },
  {
    tag: "Compliment profond",
    texte: "Je voulais te dire un truc sincère.\nTu prends soin des gens avec une générosité naturelle, sans le calculer. C'est quelque chose que j'apprécie vraiment chez toi.\nContinue d'être toi. 💕",
  },
  {
    tag: "Soir tranquille",
    texte: "Bonsoir Camilla bella vita 🌙\nJ'espère que ta journée s'est bien passée. T'as bien mérité une soirée tranquille. Prends soin de toi 😊\nJe pense à toi.",
  },
  {
    tag: "Humour sport",
    texte: "Petite question sérieuse 🤔\nTu cours le matin, tu fais du roller l'après-midi, tu fais des cookies le soir.\nT'es sportive ou cuisinière ? Les deux à la fois ? Agent secrète sous couverture ?\nJe veux la vérité 😄",
  },
  {
    tag: "Message famille",
    texte: "Hey toi 🌸\nJ'espère que tu profites de bons moments en famille ce week-end. T'as l'air d'avoir des gens bien autour de toi.\nPense à toi et prends soin de toi 💕",
  },
  {
    tag: "Musique partagée",
    texte: "J'ai écouté un truc ce matin avec un rythme super entraînant. J'ai pensé à toi direct — tu aurais kiffé courir ou faire du roller dessus j'en suis sûr 🎵\nBonne journée Cookie !",
  },
  {
    tag: "Douceur du matin",
    texte: "Coucou toi 🌷\nJ'espère que le café/thé du matin est bon et que la journée se dessine bien. Sans raison particulière, je voulais juste te dire que tu comptes 💕\nBonne journée !",
  },
  {
    tag: "Taquinerie Temu",
    texte: "Alors 📦\nOn est à combien de colis Temu ce mois-ci ? J'espère qu'il y a un truc utile ET un truc rigolo dedans comme d'hab 😄\nJ'espère que t'as passé une bonne journée !",
  },
];

// ─── Fonction de sélection pseudo-aléatoire par date ─────────────────────────
// Garantit que le contenu change tous les 2 jours et ne se répète pas trop

export function getContentForDate(dateKey, pool, totalDays = 90) {
  // Seed basé sur la date pour être déterministe
  const seed = dateKey
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const period = Math.floor(seed / 2); // change tous les 2 jours
  const index = period % pool.length;
  return pool[index];
}

export function getMultipleForDate(dateKey, pool, count = 3) {
  const seed = dateKey
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const results = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let idx = (seed + i * 7) % pool.length;
    // éviter les doublons
    while (used.has(idx)) {
      idx = (idx + 1) % pool.length;
    }
    used.add(idx);
    results.push(pool[idx]);
  }
  return results;
}
