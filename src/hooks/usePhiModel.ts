/**
 * Hook usePhiModel — gère le cycle de vie du modèle Phi-3 Mini
 * Téléchargement → Chargement → Prêt → Libération
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isModelDownloaded,
  downloadModel,
  loadModel,
  unloadModel,
  isModelLoaded,
  deleteModel,
  type ModelStatus,
  type DownloadProgress,
  PHI3_MODEL_CONFIG,
} from '../lib/phi3/engine';

export type { ModelStatus, DownloadProgress };

export function usePhiModel() {
  const [status, setStatus] = useState<ModelStatus>('not_downloaded');
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Vérifier l'état au montage
  useEffect(() => {
    (async () => {
      try {
        if (isModelLoaded()) {
          setStatus('ready');
          return;
        }
        const downloaded = await isModelDownloaded();
        if (downloaded) {
          setStatus('loading');
          await loadModel(setLoadingMessage);
          setStatus('ready');
        } else {
          setStatus('not_downloaded');
        }
      } catch (e) {
        setError((e as Error).message);
        setStatus('error');
      }
    })();

    return () => {
      // On ne décharge pas au démontage — le modèle reste en mémoire
      // pour être réutilisé sans rechargement
    };
  }, []);

  // Télécharger + charger
  const startDownload = useCallback(async () => {
    setError(null);
    setStatus('downloading');
    setDownloadProgress({ bytesWritten: 0, totalBytesExpectedToWrite: PHI3_MODEL_CONFIG.sizeBytes, percent: 0 });

    await downloadModel(
      (progress) => setDownloadProgress(progress),
      async () => {
        setStatus('loading');
        setDownloadProgress(null);
        try {
          await loadModel(setLoadingMessage);
          setStatus('ready');
        } catch (e) {
          setError((e as Error).message);
          setStatus('error');
        }
      },
      (e) => {
        setError(e.message);
        setStatus('error');
        setDownloadProgress(null);
      }
    );
  }, []);

  // Supprimer le modèle
  const removeModel = useCallback(async () => {
    try {
      await unloadModel();
      await deleteModel();
      setStatus('not_downloaded');
      setDownloadProgress(null);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  return {
    status,
    downloadProgress,
    error,
    loadingMessage,
    startDownload,
    removeModel,
    isReady: status === 'ready',
  };
}
