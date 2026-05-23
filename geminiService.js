/**
 * geminiService.js
 * Génère du contenu pour Camille via l'API Gemini (Google)
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_BASE = `Tu es un assistant qui aide Alex à trouver les bons mots pour Camille, une femme qu'il apprécie beaucoup.
Ce que tu sais sur Camille :
- Elle fait du roller et de la course à pied le matin avec sa sœur Marie
- Elle adore faire des cookies (jusqu'à 22 à la fois, à l'airfryer)
- Elle va au marché le dimanche matin
- Elle commande régulièrement sur Temu
- Elle est patiente, bienveillante, directe et honnête
- Sa famille est très importante pour elle (sa mère, son parrain Christophe, ses frères Thomas et Charles, sa sœur Marie)
- Elle aime la musique rythmique et entraînante
- Surnoms qu'elle utilise pour Alex : Lexou, Pti Lexou
- Alex peut l'appeler : Cookie, Bibiche, Camilla bella vita, Ma ptite Camille

Style de réponse : naturel, chaleureux, pas trop formel. Comme un vrai message WhatsApp, pas une carte de vœux.
Réponds UNIQUEMENT avec le contenu demandé, sans explication, sans introduction, sans guillemets autour.`;

const INSTRUCTIONS = {
  surnom: "Invente UN surnom affectueux et original pour Camille. Un seul, court, qui fait référence à une de ses habitudes (cookies, roller, marché, Temu…). Donne juste le surnom avec éventuellement un emoji.",
  compliment: "Écris UN compliment sincère et naturel pour Camille (2-3 phrases max). Parle d'une de ses vraies qualités : sa patience, son honnêteté, son organisation, son sport, ses cookies, sa famille… Sonne vrai, pas flatteur à l'excès.",
  blague: "Écris UNE taquinerie légère et affectueuse pour faire rire Camille (2-3 lignes max). Base-toi sur ses habitudes réelles : ses fournées de cookies, le roller, les colis Temu, le marché du dimanche. Doit être drôle mais gentil, pas moqueur.",
  sujet: "Propose UN sujet de conversation ou UNE question précise qu'Alex peut envoyer à Camille pour lancer une discussion sympa. Doit être en lien avec ses centres d'intérêt. Formule-le directement comme s'il lui écrivait.",
  message: "Écris UN message WhatsApp complet (4-6 lignes) qu'Alex peut envoyer à Camille. Mélange tendresse et légèreté. Fait référence à quelque chose de concret qu'elle aime (sport, cookies, famille, musique). Signe avec un surnom affectueux. Ton naturel, pas romantique à l'excès.",
};

export async function generateForCamille(type, apiKey) {
  if (!apiKey) throw new Error("Clé API Gemini manquante");

  const prompt = `${SYSTEM_BASE}\n\n${INSTRUCTIONS[type]}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 300,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `Erreur HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse vide de Gemini");
  return text.trim();
}

export async function generateAll(apiKey, onProgress) {
  const types = ["surnom", "compliment", "blague", "sujet", "message"];
  const results = {};

  for (const type of types) {
    onProgress?.({ type, status: "generating" });
    const text = await generateForCamille(type, apiKey);
    results[type] = text;
    onProgress?.({ type, status: "done", text });
  }

  return results;
}
