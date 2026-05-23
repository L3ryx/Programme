/**
 * geminiService.js
 * Génère du contenu pour Camille via l'API Gemini (Google)
 * Une seule requête pour les 5 catégories = moins de quota utilisé
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

Style : naturel, chaleureux, comme un vrai message WhatsApp.`;

const COMBINED_PROMPT = `${SYSTEM_BASE}

Génère exactement les 5 éléments suivants, séparés par la balise ---NEXT--- entre chaque.
Ne mets pas de titre, pas d'introduction, pas de guillemets autour. Juste le contenu demandé.

1. UN surnom affectueux et original pour Camille, court, qui fait référence à une de ses habitudes (cookies, roller, marché, Temu…). Juste le surnom avec éventuellement un emoji.

---NEXT---

2. UN compliment sincère et naturel pour Camille (2-3 phrases max). Parle d'une de ses vraies qualités. Sonne vrai, pas flatteur à l'excès.

---NEXT---

3. UNE taquinerie légère et affectueuse (2-3 lignes max). Base-toi sur ses habitudes réelles. Drôle mais gentil.

---NEXT---

4. UN sujet de conversation ou UNE question précise qu'Alex peut envoyer à Camille. Formule-le directement comme s'il lui écrivait.

---NEXT---

5. UN message WhatsApp complet (4-6 lignes) qu'Alex peut envoyer à Camille. Mélange tendresse et légèreté. Signe avec un surnom affectueux.`;

export async function generateAll(apiKey, onProgress) {
  if (!apiKey) throw new Error("Clé API Gemini manquante");

  onProgress?.({ type: "surnom", status: "generating" });

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: COMBINED_PROMPT }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.error?.message || `Erreur HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!fullText) throw new Error("Réponse vide de Gemini");

  const parts = fullText.split("---NEXT---").map((p) => p.trim());

  const types = ["surnom", "compliment", "blague", "sujet", "message"];
  const results = {};

  types.forEach((type, i) => {
    results[type] = parts[i] || "";
    onProgress?.({ type, status: "done", text: results[type] });
  });

  return results;
}

// Gardé pour compatibilité si appelé seul
export async function generateForCamille(type, apiKey) {
  const results = await generateAll(apiKey);
  return results[type] || "";
}
