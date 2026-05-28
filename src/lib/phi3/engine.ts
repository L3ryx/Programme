/**
 * Phi-3 Mini Engine — llama.rn (React Native llama.cpp)
 *
 * Le modèle GGUF tourne 100% en local sur l'appareil.
 * Aucune donnée ne quitte le téléphone.
 *
 * Modèle recommandé : Phi-3-mini-4k-instruct.Q4_K_M.gguf (~2.2 GB)
 * URL de téléchargement : https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf
 */

import { initLlama, type LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system';

export type ModelStatus =
  | 'not_downloaded'
  | 'downloading'
  | 'loading'
  | 'ready'
  | 'error';

export type DownloadProgress = {
  bytesWritten: number;
  totalBytesExpectedToWrite: number;
  percent: number;
};

// --- Configuration du modèle ---
export const PHI3_MODEL_CONFIG = {
  // Modèle quantisé Q4_K_M — bon compromis taille/qualité
  fileName: 'Phi-3-mini-4k-instruct.Q4_K_M.gguf',
  downloadUrl:
    'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
  sizeBytes: 2_300_000_000, // ~2.3 GB
  contextSize: 4096,
  // Paramètres de génération
  temperature: 0.2,      // Faible = réponses déterministes
  topP: 0.9,
  maxTokens: 512,
};

let _ctx: LlamaContext | null = null;
let _modelPath: string | null = null;

// ---- Chemin de stockage du modèle ----
export function getModelPath(): string {
  return `${FileSystem.documentDirectory}models/${PHI3_MODEL_CONFIG.fileName}`;
}

// ---- Vérifier si le modèle est téléchargé ----
export async function isModelDownloaded(): Promise<boolean> {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && (info as any).size > 100_000_000;
}

// ---- Télécharger le modèle ----
export async function downloadModel(
  onProgress: (p: DownloadProgress) => void,
  onComplete: () => void,
  onError: (e: Error) => void
): Promise<void> {
  const dir = `${FileSystem.documentDirectory}models/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  const path = getModelPath();

  const download = FileSystem.createDownloadResumable(
    PHI3_MODEL_CONFIG.downloadUrl,
    path,
    {},
    (progress) => {
      const percent =
        progress.totalBytesExpectedToWrite > 0
          ? Math.round(
              (progress.bytesWritten / progress.totalBytesExpectedToWrite) * 100
            )
          : 0;
      onProgress({ ...progress, percent });
    }
  );

  try {
    await download.downloadAsync();
    onComplete();
  } catch (e) {
    onError(e as Error);
  }
}

// ---- Supprimer le modèle (libérer espace) ----
export async function deleteModel(): Promise<void> {
  const path = getModelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path);
    _ctx = null;
    _modelPath = null;
  }
}

// ---- Charger le modèle en mémoire ----
export async function loadModel(
  onProgress?: (msg: string) => void
): Promise<void> {
  const path = getModelPath();

  if (_ctx && _modelPath === path) return; // Déjà chargé

  onProgress?.('Chargement du modèle Phi-3 Mini...');

  try {
    _ctx = await initLlama({
      model: path,
      use_mlock: false,
      n_ctx: PHI3_MODEL_CONFIG.contextSize,
      n_gpu_layers: 0, // CPU seulement (compatible Android & iOS)
    });
    _modelPath = path;
    onProgress?.('Modèle prêt ✓');
  } catch (e) {
    _ctx = null;
    throw new Error(`Impossible de charger le modèle : ${(e as Error).message}`);
  }
}

// ---- Libérer le modèle de la mémoire ----
export async function unloadModel(): Promise<void> {
  if (_ctx) {
    await _ctx.release();
    _ctx = null;
    _modelPath = null;
  }
}

// ---- Inférence : générer du texte ----
export async function generate(
  prompt: string,
  onToken?: (token: string) => void
): Promise<string> {
  if (!_ctx) {
    throw new Error('Modèle non chargé. Appelez loadModel() d\'abord.');
  }

  // Format Phi-3 Instruct
  const formattedPrompt =
    `<|system|>\nTu es un assistant d'analyse de communication. Réponds uniquement en JSON valide sans markdown.\n<|end|>\n` +
    `<|user|>\n${prompt}\n<|end|>\n` +
    `<|assistant|>\n`;

  let output = '';

  await _ctx.completion(
    {
      prompt: formattedPrompt,
      n_predict: PHI3_MODEL_CONFIG.maxTokens,
      temperature: PHI3_MODEL_CONFIG.temperature,
      top_p: PHI3_MODEL_CONFIG.topP,
      stop: ['<|end|>', '<|user|>', '</s>'],
    },
    (data) => {
      output += data.token;
      onToken?.(data.token);
    }
  );

  return output.trim();
}

// ---- Getters ----
export function isModelLoaded(): boolean {
  return _ctx !== null;
}
