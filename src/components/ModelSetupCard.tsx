/**
 * ModelSetupCard — affiche le statut du modèle Phi-3 et permet de le télécharger
 */

import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ModelStatus, DownloadProgress } from '../hooks/usePhiModel';

type Props = {
  status: ModelStatus;
  downloadProgress: DownloadProgress | null;
  loadingMessage: string;
  error: string | null;
  onDownload: () => void;
  onDelete: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ModelSetupCard({ status, downloadProgress, loadingMessage, error, onDownload, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🤖</Text>
          <View>
            <Text style={styles.title}>Phi-3 Mini (Local)</Text>
            <Text style={styles.sub}>Microsoft · ~2.3 GB · 100% privé</Text>
          </View>
        </View>
        <StatusBadge status={status} />
      </View>

      {status === 'not_downloaded' && (
        <View style={styles.body}>
          <Text style={styles.desc}>
            L'IA analyse tes messages directement sur l'appareil.{'\n'}
            Aucune donnée n'est envoyée sur Internet.
          </Text>
          <View style={styles.featureList}>
            {['Détection contextuelle (pas juste des mots-clés)', 'Comprend l\'ironie et les nuances', 'Red flags ET green flags détaillés', 'Explication pour chaque signal'].map((f) => (
              <View key={f} style={styles.feature}>
                <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.downloadBtn} onPress={onDownload}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.downloadBtnText}>Télécharger Phi-3 Mini (2.3 GB)</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>⚡ Wifi recommandé · ~15 min selon connexion</Text>
        </View>
      )}

      {status === 'downloading' && downloadProgress && (
        <View style={styles.body}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>
              {formatBytes(downloadProgress.bytesWritten)} / {formatBytes(downloadProgress.totalBytesExpectedToWrite)}
            </Text>
            <Text style={styles.progressPct}>{downloadProgress.percent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${downloadProgress.percent}%` }]} />
          </View>
          <Text style={styles.hint}>⬇️ Téléchargement en cours…</Text>
        </View>
      )}

      {status === 'loading' && (
        <View style={styles.body}>
          <ActivityIndicator color="#7c3aed" />
          <Text style={styles.hint}>{loadingMessage || 'Chargement du modèle…'}</Text>
        </View>
      )}

      {status === 'ready' && (
        <View style={styles.body}>
          <Text style={styles.readyText}>
            ✅ Phi-3 Mini est chargé et prêt à analyser.
          </Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={styles.deleteBtnText}>Supprimer le modèle (libérer 2.3 GB)</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.body}>
          <Text style={styles.errorText}>❌ {error ?? 'Erreur inconnue'}</Text>
          <TouchableOpacity style={styles.downloadBtn} onPress={onDownload}>
            <Text style={styles.downloadBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: ModelStatus }) {
  const config: Record<ModelStatus, { label: string; color: string; bg: string }> = {
    not_downloaded: { label: 'Non installé', color: '#888', bg: '#1e1e2e' },
    downloading: { label: 'Téléchargement', color: '#f59e0b', bg: '#451a03' },
    loading: { label: 'Chargement', color: '#a78bfa', bg: '#2e1065' },
    ready: { label: 'Prêt ✓', color: '#22c55e', bg: '#052e16' },
    error: { label: 'Erreur', color: '#ef4444', bg: '#450a0a' },
  };
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12121a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { fontSize: 28 },
  title: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sub: { color: '#666', fontSize: 11, marginTop: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  body: { gap: 10 },
  desc: { color: '#888', fontSize: 13, lineHeight: 20 },
  featureList: { gap: 6, marginBottom: 4 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { color: '#aaa', fontSize: 12 },
  downloadBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  hint: { color: '#555', fontSize: 12, textAlign: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: '#aaa', fontSize: 12 },
  progressPct: { color: '#7c3aed', fontWeight: '700', fontSize: 12 },
  progressBar: { height: 6, backgroundColor: '#1e1e2e', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#7c3aed', borderRadius: 3 },
  readyText: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  deleteBtnText: { color: '#ef4444', fontSize: 12 },
  errorText: { color: '#ef4444', fontSize: 13 },
});
