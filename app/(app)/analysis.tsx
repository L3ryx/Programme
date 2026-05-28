/**
 * AnalysisScreen — Phi-3 Mini Edition
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { analyzeWithPhi3, type CommunicationScore } from '../../src/lib/phi3/analyzer';
import { ModelSetupCard } from '../../src/components/ModelSetupCard';
import { usePhiModel } from '../../src/hooks/usePhiModel';
import { databases, DATABASE_ID, COLLECTION_RELATIONSHIP_ANALYSES } from '../../src/lib/appwrite';
import { ID } from 'appwrite';
import { getMessages, LocalMessage } from '../../src/lib/localDb';

const RED_COLORS: Record<string, string> = {
  control: '#ef4444', jealousy: '#f97316', manipulation: '#dc2626',
  isolation: '#b91c1c', gaslighting: '#c026d3', aggression: '#991b1b',
  disrespect: '#f43f5e', pressure: '#ea580c',
};

const GREEN_COLORS: Record<string, string> = {
  respect: '#22c55e', communication: '#10b981', empathy: '#06b6d4',
  encouragement: '#a3e635', affection: '#f472b6', trust: '#34d399', support: '#4ade80',
};

const SEVERITY_LABELS = ['', 'Léger', 'Modéré', 'Grave'];

function ScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.scoreRing}>
      <View style={[styles.scoreCircle, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreLabel}>/100</Text>
      </View>
      <Text style={[styles.scoreTitle, { color }]}>
        {score >= 70 ? 'Saine 💚' : score >= 40 ? 'À surveiller ⚠️' : 'Préoccupante 🚩'}
      </Text>
      <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>⚡ Phi-3 Mini · Local</Text>
      </View>
    </View>
  );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={styles.catRow}>
      <Text style={styles.catLabel}>{label}</Text>
      <View style={styles.catBarBg}>
        <View style={[styles.catBarFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.catValue, { color }]}>{value}</Text>
    </View>
  );
}

export default function AnalysisScreen() {
  const { profile, partner } = useApp();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [result, setResult] = useState<CommunicationScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [saved, setSaved] = useState(false);
  const phi = usePhiModel();

  // Charger les messages depuis SQLite
  useEffect(() => {
    if (!partner) return;
    getMessages(partner.id).then(setMessages);
  }, [partner?.id]);

  const messagesToAnalyze = useMemo(() => {
    if (!profile || !partner) return [];
    return messages
      .filter((m) => m.decrypted_content)
      .map((m) => ({ content: m.decrypted_content!, isFromMe: m.sender_id === profile.id }));
  }, [messages, profile, partner]);

  const runAnalysis = useCallback(async () => {
    if (messagesToAnalyze.length === 0 || !phi.isReady) return;
    setLoading(true);
    setStreamText('');
    setSaved(false);
    setResult(null);
    try {
      const analysis = await analyzeWithPhi3(messagesToAnalyze, (token) => {
        setStreamText((prev) => prev + token);
      });
      setResult(analysis);
    } catch (e) {
      console.error('Analyse échouée:', e);
    } finally {
      setLoading(false);
      setStreamText('');
    }
  }, [messagesToAnalyze, phi.isReady]);

  async function saveAnalysis() {
    if (!result || !profile) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_RELATIONSHIP_ANALYSES,
        ID.unique(),
        {
          user_id: profile.id,
          score: result.total,
          red_flags: result.redFlags.map((f) => f.label),
          positive_signals: result.greenFlags.map((f) => f.label),
          summary: result.summary,
        }
      );
      setSaved(true);
    } catch (e) {
      console.error('Sauvegarde échouée:', e);
    }
  }

  if (!partner) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyText}>Connecte d'abord ton partenaire dans Messages</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analyse IA 📊</Text>
        <Text style={styles.headerSub}>{messagesToAnalyze.length} messages analysables</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <ModelSetupCard
          status={phi.status}
          downloadProgress={phi.downloadProgress}
          loadingMessage={phi.loadingMessage}
          error={phi.error}
          onDownload={phi.startDownload}
          onDelete={phi.removeModel}
        />
      </View>

      {phi.isReady && (
        <>
          {!result && !loading && (
            <View style={styles.startCard}>
              <Text style={styles.startIcon}>🔍</Text>
              <Text style={styles.startTitle}>Analyse par IA locale</Text>
              <Text style={styles.startDesc}>
                Phi-3 Mini analyse le contexte, les nuances et les émotions de votre échange.{'\n'}
                100% sur l'appareil, zéro données envoyées.
              </Text>
              <TouchableOpacity
                style={[styles.btn, messagesToAnalyze.length === 0 && styles.btnDisabled]}
                onPress={runAnalysis}
                disabled={messagesToAnalyze.length === 0}
              >
                <Text style={styles.btnText}>Lancer l'analyse Phi-3</Text>
              </TouchableOpacity>
              {messagesToAnalyze.length === 0 && (
                <Text style={styles.hint}>Commence à chatter pour avoir des données</Text>
              )}
            </View>
          )}

          {loading && (
            <View style={styles.streamCard}>
              <ActivityIndicator color="#7c3aed" size="large" />
              <Text style={styles.streamTitle}>Phi-3 analyse en cours…</Text>
              <Text style={styles.streamText} numberOfLines={8}>{streamText || 'Génération…'}</Text>
              <Text style={styles.streamHint}>L'IA tourne sur l'appareil · 30-60s</Text>
            </View>
          )}

          {result && (
            <View style={styles.results}>
              <View style={styles.card}>
                <ScoreRing score={result.total} />
                <Text style={styles.summaryt}>{result.summary}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Indicateurs de communication</Text>
                <CategoryBar label="Respect" value={result.categories.respect} />
                <CategoryBar label="Empathie" value={result.categories.empathy} />
                <CategoryBar label="Honnêteté" value={result.categories.honesty} />
                <CategoryBar label="Limites" value={result.categories.boundaries} />
                <CategoryBar label="Positivité" value={result.categories.positivity} />
              </View>

              {result.redFlags.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>🚩 Signaux d'alerte ({result.redFlags.length})</Text>
                  {result.redFlags.map((flag) => {
                    const color = RED_COLORS[flag.type] ?? '#ef4444';
                    return (
                      <View key={flag.type} style={[styles.flagCard, { borderLeftColor: color }]}>
                        <View style={styles.flagHeader}>
                          <Text style={styles.flagLabel}>{flag.label}</Text>
                          <View style={[styles.flagSeverity, { backgroundColor: color + '33' }]}>
                            <Text style={[styles.flagSeverityText, { color }]}>{SEVERITY_LABELS[flag.severity]}</Text>
                          </View>
                        </View>
                        {flag.explanation ? <Text style={styles.flagExplanation}>{flag.explanation}</Text> : null}
                        {flag.matches.slice(0, 2).map((m, i) => (
                          <Text key={i} style={styles.flagMatch}>"{m}"</Text>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}

              {result.greenFlags.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>💚 Points positifs ({result.greenFlags.length})</Text>
                  {result.greenFlags.map((flag) => {
                    const color = GREEN_COLORS[flag.type] ?? '#22c55e';
                    return (
                      <View key={flag.type} style={[styles.greenFlagCard, { borderLeftColor: color }]}>
                        <View style={styles.greenFlagHeader}>
                          <Ionicons name="checkmark-circle" size={16} color={color} />
                          <Text style={[styles.greenFlagLabel, { color }]}>{flag.label}</Text>
                        </View>
                        {flag.explanation ? <Text style={styles.greenFlagExplanation}>{flag.explanation}</Text> : null}
                        {flag.example ? <Text style={styles.greenFlagExample}>"{flag.example}"</Text> : null}
                      </View>
                    );
                  })}
                </View>
              )}

              {result.redFlags.length === 0 && result.greenFlags.length === 0 && (
                <View style={[styles.card, { alignItems: 'center' }]}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🤔</Text>
                  <Text style={{ color: '#888', textAlign: 'center', fontSize: 14 }}>
                    Pas assez de contexte pour détecter des signaux.{'\n'}
                    Continue à chatter et relance l'analyse.
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.btn} onPress={runAnalysis}>
                  <Text style={styles.btnText}>Relancer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, saved && styles.btnSaved]}
                  onPress={saveAnalysis}
                  disabled={saved}
                >
                  <Text style={styles.btnText}>{saved ? '✓ Sauvegardé' : 'Sauvegarder'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 24 },
  headerSub: { color: '#555', fontSize: 13, marginTop: 4 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#666', fontSize: 16, textAlign: 'center', paddingHorizontal: 32 },
  startCard: {
    margin: 16, backgroundColor: '#12121a', borderRadius: 20,
    padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e2e',
  },
  startIcon: { fontSize: 48, marginBottom: 12 },
  startTitle: { color: '#fff', fontWeight: '700', fontSize: 20, marginBottom: 8 },
  startDesc: { color: '#888', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  streamCard: {
    margin: 16, backgroundColor: '#12121a', borderRadius: 20,
    padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2e1065',
  },
  streamTitle: { color: '#a78bfa', fontWeight: '700', fontSize: 16 },
  streamText: { color: '#555', fontSize: 11, fontFamily: 'monospace', textAlign: 'left', width: '100%' },
  streamHint: { color: '#444', fontSize: 12 },
  results: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: { backgroundColor: '#12121a', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1e1e2e' },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 16 },
  scoreRing: { alignItems: 'center', marginBottom: 16, gap: 8 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  scoreNumber: { fontSize: 32, fontWeight: '800' },
  scoreLabel: { color: '#666', fontSize: 12 },
  scoreTitle: { fontWeight: '700', fontSize: 18 },
  aiBadge: { backgroundColor: '#2e1065', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  aiBadgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '600' },
  summaryt: { color: '#aaa', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  catLabel: { color: '#888', fontSize: 13, width: 80 },
  catBarBg: { flex: 1, height: 6, backgroundColor: '#1e1e2e', borderRadius: 3 },
  catBarFill: { height: 6, borderRadius: 3 },
  catValue: { width: 30, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  flagCard: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 14 },
  flagHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  flagLabel: { color: '#fff', fontWeight: '600', fontSize: 14 },
  flagSeverity: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  flagSeverityText: { fontSize: 11, fontWeight: '700' },
  flagExplanation: { color: '#888', fontSize: 12, lineHeight: 17, marginBottom: 4 },
  flagMatch: { color: '#666', fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  greenFlagCard: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 14 },
  greenFlagHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  greenFlagLabel: { fontWeight: '600', fontSize: 14 },
  greenFlagExplanation: { color: '#888', fontSize: 12, lineHeight: 17, marginBottom: 4 },
  greenFlagExample: { color: '#555', fontSize: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, backgroundColor: '#7c3aed', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnSecondary: { backgroundColor: '#1e1e2e' },
  btnSaved: { backgroundColor: '#14532d' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { color: '#555', fontSize: 12, marginTop: 12, textAlign: 'center' },
});
