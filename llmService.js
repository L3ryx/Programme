/**
 * llmService.js
 * Gère le téléchargement, l'initialisation et l'inférence de Phi-3 mini via llama.rn
 *
 * Modèle : Phi-3 mini 4K Instruct Q4 (~2.2 Go)
 * Source : Hugging Face – bartowski/Phi-3-mini-4k-instruct-GGUF
 */

import { initLlama, releaseAllLlama } from "llama.rn";
import * as FileSystem from "expo-file-system";

// ─── Config modèle ────────────────────────────────────────────────────────────

const MODEL_URL =
  "https://huggingface.co/bartowski/Phi-3-mini-4k-instruct-GGUF/resolve/main/Phi-3-mini-4k-instruct-Q4_K_M.gguf";

const MODEL_FILENAME = "phi3-mini-q4km.gguf";
const MODEL_PATH = FileSystem.documentDirectory + MODEL_FILENAME;
const MODEL_SIZE_GB = 2.2;

// ─── État singleton ───────────────────────────────────────────────────────────

let _context = null; // contexte llama.rn chargé
let _isLoading = false;

// ─── Téléchargement ───────────────────────────────────────────────────────────

/**
 * Vérifie si le modèle est déjà téléchargé localement.
 */
export async function isModelDownloaded() {
  try {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    return info.exists && info.size > 100_000_000; // > 100 Mo = fichier valide
  } catch {
    return false;
  }
}

/**
 * Télécharge le modèle depuis Hugging Face avec suivi de progression.
 * @param {function} onProgress - callback({ downloaded, total, percent })
 */
export async function downloadModel(onProgress) {
  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    MODEL_PATH,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      const percent =
        totalBytesExpectedToWrite > 0
          ? Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100)
          : 0;
      onProgress?.({
        downloaded: totalBytesWritten,
        total: totalBytesExpectedToWrite,
        percent,
      });
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || result.status !== 200) {
    // Nettoie le fichier partiel en cas d'erreur
    try { await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true }); } catch {}
    throw new Error("Échec du téléchargement (status " + result?.status + ")");
  }
  return MODEL_PATH;
}

/**
 * Supprime le modèle local (pour libérer de l'espace).
 */
export async function deleteModel() {
  await releaseAllLlama();
  _context = null;
  try {
    await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  } catch {}
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Charge le modèle en mémoire si ce n'est pas déjà fait.
 * @param {function} onProgress - callback optionnel de chargement
 */
export async function loadModel(onProgress) {
  if (_context) return _context;
  if (_isLoading) throw new Error("Chargement déjà en cours");

  _isLoading = true;
  try {
    onProgress?.("Chargement du modèle en mémoire…");
    _context = await initLlama({
      model: MODEL_PATH,
      use_mlock: false,      // pas de lock mémoire sur mobile
      n_ctx: 1024,           // contexte réduit pour 4 Go RAM
      n_threads: 4,          // 4 threads = bon équilibre perf/batterie
      n_batch: 32,           // batch réduit pour basse RAM
      n_gpu_layers: 0,       // CPU only (GPU Metal/Vulkan non dispo via llama.rn)
    });
    return _context;
  } finally {
    _isLoading = false;
  }
}

/**
 * Libère le contexte llama de la mémoire.
 */
export async function unloadModel() {
  if (_context) {
    await releaseAllLlama();
    _context = null;
  }
}

// ─── Prompt Camille ───────────────────────────────────────────────────────────

/**
 * Construit le prompt système Phi-3 pour générer du contenu Camille.
 * Phi-3 utilise le format <|system|> / <|user|> / <|assistant|>
 */
function buildPrompt(type, extra = "") {
  const systemBase = `Tu es un assistant qui aide Alex à trouver les bons mots pour Camille, une femme qu'il apprécie beaucoup.
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

  const prompts = {
    surnom: `${systemBase}\n${extra}`,
    compliment: `${systemBase}\n${extra}`,
    blague: `${systemBase}\n${extra}`,
    sujet: `${systemBase}\n${extra}`,
    message: `${systemBase}\n${extra}`,
  };

  return prompts[type] || systemBase;
}

const INSTRUCTIONS = {
  surnom: "Invente UN surnom affectueux et original pour Camille. Un seul, court, qui fait référence à une de ses habitudes (cookies, roller, marché, Temu…). Donne juste le surnom avec éventuellement un emoji.",

  compliment: "Écris UN compliment sincère et naturel pour Camille (2-3 phrases max). Parle d'une de ses vraies qualités : sa patience, son honnêteté, son organisation, son sport, ses cookies, sa famille… Sonne vrai, pas flatteur à l'excès.",

  blague: "Écris UNE taquinerie légère et affectueuse pour faire rire Camille (2-3 lignes max). Base-toi sur ses habitudes réelles : ses fournées de cookies, le roller, les colis Temu, le marché du dimanche. Doit être drôle mais gentil, pas moqueur.",

  sujet: "Propose UN sujet de conversation ou UNE question précise qu'Alex peut envoyer à Camille pour lancer une discussion sympa. Doit être en lien avec ses centres d'intérêt. Formule-le directement comme s'il lui écrivait.",

  message: "Écris UN message WhatsApp complet (4-6 lignes) qu'Alex peut envoyer à Camille. Mélange tendresse et légèreté. Fait référence à quelque chose de concret qu'elle aime (sport, cookies, famille, musique). Signe avec un surnom affectueux. Ton naturel, pas romantique à l'excès.",
};

// ─── Génération ───────────────────────────────────────────────────────────────

/**
 * Génère du contenu pour une catégorie donnée.
 * @param {"surnom"|"compliment"|"blague"|"sujet"|"message"} type
 * @param {function} onToken - callback appelé à chaque token généré (streaming)
 * @returns {Promise<string>} texte généré complet
 */
export async function generateForCamille(type, onToken) {
  const ctx = await loadModel();

  const systemPrompt = buildPrompt(type);
  const userInstruction = INSTRUCTIONS[type];

  // Format Phi-3 Instruct
  const fullPrompt =
    `<|system|>\n${systemPrompt}<|end|>\n` +
    `<|user|>\n${userInstruction}<|end|>\n` +
    `<|assistant|>\n`;

  const result = await ctx.completion(
    {
      prompt: fullPrompt,
      n_predict: 200,          // max 200 tokens = assez pour un message
      temperature: 0.8,        // un peu de créativité
      top_p: 0.9,
      top_k: 40,
      repeat_penalty: 1.1,
      stop: ["<|end|>", "<|user|>", "<|system|>", "\n\n\n"],
    },
    (data) => {
      // Streaming token par token
      if (data.token) onToken?.(data.token);
    }
  );

  return result.text.trim();
}

/**
 * Génère toutes les catégories en parallèle (séquentiel pour 4 Go RAM).
 * @param {function} onProgress - callback({ type, token?, done? })
 * @returns {Promise<{surnom, compliment, blague, sujet, message}>}
 */
export async function generateAll(onProgress) {
  const types = ["surnom", "compliment", "blague", "sujet", "message"];
  const results = {};

  for (const type of types) {
    onProgress?.({ type, status: "generating" });
    let accumulated = "";

    results[type] = await generateForCamille(type, (token) => {
      accumulated += token;
      onProgress?.({ type, token, accumulated });
    });

    onProgress?.({ type, status: "done", text: results[type] });
  }

  return results;
}

// ─── Infos modèle (pour l'UI) ─────────────────────────────────────────────────

export const MODEL_INFO = {
  name: "Phi-3 mini 4K",
  size: MODEL_SIZE_GB,
  sizeLabel: "2.2 Go",
  quantization: "Q4_K_M",
  description: "Modèle Microsoft – tourne 100% en local sur ton téléphone",
  url: MODEL_URL,
  path: MODEL_PATH,
};
