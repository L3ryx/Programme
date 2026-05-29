/**
 * useAnalysisQueue — File d'attente d'analyse Phi-3
 *
 * Chaque nouveau message (envoyé ou reçu) est ajouté à une file.
 * Phi-3 les traite un par un en arrière-plan sans bloquer l'UI.
 * Le score cumulé est persisté dans SQLite (table flag_scores).
 *
 * Stratégie d'analyse :
 *   - On passe à Phi-3 une fenêtre de contexte : le message à analyser
 *     + les 10 messages précédents pour que l'IA comprenne le contexte.
 *   - Les nouveaux red/green flags sont fusionnés avec le score existant.
 *   - Les IDs analysés sont mémorisés pour ne jamais retraiter un message.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { LocalMessage, getFlagScore, saveFlagScore, FlagScore } from '../lib/localDb';
import { analyzeWithPhi3 } from '../lib/phi3/analyzer';
import { isModelLoaded } from '../lib/phi3/engine';

export type QueueStatus = 'idle' | 'analyzing' | 'waiting_model';

export type LiveFlagScore = {
  redCount:    number;
  greenCount:  number;
  totalScore:  number;
  redLabels:   string[];
  greenLabels: string[];
  updatedAt:   number;
};

const CONTEXT_WINDOW = 10; // messages de contexte envoyés à Phi-3 avec chaque nouveau message

export function useAnalysisQueue(
  messages: LocalMessage[],
  partnerId: string | null | undefined,
  myId: string | null | undefined
) {
  const [liveScore, setLiveScore]   = useState<LiveFlagScore | null>(null);
  const [status, setStatus]         = useState<QueueStatus>('idle');
  const [queueLength, setQueueLength] = useState(0);

  const queueRef       = useRef<LocalMessage[]>([]);
  const processingRef  = useRef(false);
  const analyzedIdsRef = useRef<Set<string>>(new Set());

  // ── Charger le score persisté au montage ──────────────────
  useEffect(() => {
    if (!partnerId) return;
    getFlagScore(partnerId).then((saved) => {
      if (!saved) return;
      analyzedIdsRef.current = new Set(saved.analyzed_ids);
      setLiveScore({
        redCount:    saved.red_count,
        greenCount:  saved.green_count,
        totalScore:  saved.total_score,
        redLabels:   saved.red_labels,
        greenLabels: saved.green_labels,
        updatedAt:   saved.updated_at,
      });
    });
  }, [partnerId]);

  // ── Traitement de la file ──────────────────────────────────
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    if (queueRef.current.length === 0) return;
    if (!isModelLoaded()) {
      setStatus('waiting_model');
      return;
    }
    if (!partnerId || !myId) return;

    processingRef.current = true;
    setStatus('analyzing');

    while (queueRef.current.length > 0) {
      const msg = queueRef.current.shift()!;
      setQueueLength(queueRef.current.length);

      // Récupérer le contexte : les N messages avant ce message dans la liste complète
      const msgIndex = messages.findIndex((m) => m.id === msg.id);
      const contextStart = Math.max(0, msgIndex - CONTEXT_WINDOW);
      const contextMsgs = messages.slice(contextStart, msgIndex + 1);

      const input = contextMsgs
        .filter((m) => m.plaintext?.trim())
        .map((m) => ({
          content:  m.plaintext,
          isFromMe: m.sender_id === myId,
        }));

      if (input.length === 0) continue;

      try {
        const result = await analyzeWithPhi3(input);

        // Charger le score actuel depuis SQLite pour fusionner
        const existing = await getFlagScore(partnerId);
        const existingIds = existing?.analyzed_ids ?? [];

        // Fusion : on ajoute les nouveaux flags (sans doublons)
        const mergedRedLabels = Array.from(new Set([
          ...(existing?.red_labels ?? []),
          ...result.redFlags.map((f) => f.label),
        ]));
        const mergedGreenLabels = Array.from(new Set([
          ...(existing?.green_labels ?? []),
          ...result.greenFlags.map((f) => f.label),
        ]));

        // Score global : moyenne glissante pondérée
        const prevScore  = existing?.total_score ?? 50;
        const newScore   = Math.round((prevScore * 0.7) + (result.total * 0.3));

        const updated: FlagScore = {
          partner_id:   partnerId,
          red_count:    mergedRedLabels.length,
          green_count:  mergedGreenLabels.length,
          total_score:  newScore,
          red_labels:   mergedRedLabels,
          green_labels: mergedGreenLabels,
          analyzed_ids: [...existingIds, msg.id],
          updated_at:   Date.now(),
        };

        await saveFlagScore(updated);
        analyzedIdsRef.current.add(msg.id);

        setLiveScore({
          redCount:    updated.red_count,
          greenCount:  updated.green_count,
          totalScore:  updated.total_score,
          redLabels:   updated.red_labels,
          greenLabels: updated.green_labels,
          updatedAt:   updated.updated_at,
        });
      } catch (e) {
        console.warn('[useAnalysisQueue] Phi-3 error:', e);
      }
    }

    processingRef.current = false;
    setStatus('idle');
    setQueueLength(0);
  }, [messages, partnerId, myId]);

  // ── Détecter les nouveaux messages et les mettre en file ──
  useEffect(() => {
    if (!partnerId || !myId) return;

    const newMsgs = messages.filter(
      (m) => m.plaintext?.trim() && !analyzedIdsRef.current.has(m.id)
    );

    if (newMsgs.length === 0) return;

    // Ajouter uniquement ceux pas déjà dans la file
    const alreadyQueued = new Set(queueRef.current.map((m) => m.id));
    const toAdd = newMsgs.filter((m) => !alreadyQueued.has(m.id));

    if (toAdd.length === 0) return;

    queueRef.current.push(...toAdd);
    setQueueLength(queueRef.current.length);
    processQueue();
  }, [messages.length, partnerId, myId, processQueue]);

  // ── Relancer si le modèle devient disponible ──────────────
  useEffect(() => {
    if (status === 'waiting_model' && isModelLoaded()) {
      processQueue();
    }
  }, [status, processQueue]);

  return { liveScore, status, queueLength };
}
