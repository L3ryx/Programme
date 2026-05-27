import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Dimensions, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

interface Stats {
  totalMessages: number;
  alexMessages: number;
  camilleMessages: number;
  topHours: { hour: string; count: number }[];
  emotions: { label: string; count: number; color: string }[];
  deletedMessages: number;
  mediaCount: number;
  firstDate: string;
  lastDate: string;
}

function analyzeChat(text: string): Stats {
  const lines = text.split('\n').filter(l => l.includes(' - '));
  let alex = 0, camille = 0, deleted = 0, media = 0;
  const hourMap: Record<string, number> = {};
  const emotions = { tendresse: 0, jalousie: 0, humour: 0, inquietude: 0, colere: 0 };
  let firstDate = '', lastDate = '';

  const tendresseWords = ['bisous','câlins','manque','aime','❤','😘','🥰','bibou','bibiche','papouillous','envie de toi','je t\'aime'];
  const jalousieWords = ['cache','confiance','méfie','localisation','poke','filles','meuf','insta','jalou','tu parles à qui'];
  const humourWords = ['mdr','lol','😂','🤣','😅','n\'importe quoi','😝','haha','ahah'];
  const inquietudWords = ['parano','peur','possible','réel','ça me fait du mal','culpabilise','mal à l\'aise','anxieux'];
  const colereWords = ['énerve','supprimé','désagréable','s\'en fiche','évitant','je m\'énerve'];

  lines.forEach(line => {
    const timeMatch = line.match(/(\d{2}\/\d{2}\/\d{4}), (\d{2}):\d{2}/);
    if (timeMatch) {
      const date = timeMatch[1];
      const hour = timeMatch[2] + 'h';
      hourMap[hour] = (hourMap[hour] || 0) + 1;
      if (!firstDate) firstDate = date;
      lastDate = date;
    }
    const isAlex = line.includes('- Alex:');
    const isCamille = line.includes('- Camille');
    if (isAlex) alex++;
    if (isCamille) camille++;
    if (line.includes('supprimé ce message')) deleted++;
    if (line.includes('<Médias omis>') || line.includes('<Media omitted>')) media++;

    const lower = line.toLowerCase();
    tendresseWords.forEach(w => { if (lower.includes(w)) emotions.tendresse++; });
    jalousieWords.forEach(w => { if (lower.includes(w)) emotions.jalousie++; });
    humourWords.forEach(w => { if (lower.includes(w)) emotions.humour++; });
    inquietudWords.forEach(w => { if (lower.includes(w)) emotions.inquietude++; });
    colereWords.forEach(w => { if (lower.includes(w)) emotions.colere++; });
  });

  const sortedHours = Object.entries(hourMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hour, count]) => ({ hour, count }));

  return {
    totalMessages: alex + camille,
    alexMessages: alex,
    camilleMessages: camille,
    topHours: sortedHours,
    emotions: [
      { label: '💕 Tendresse', count: emotions.tendresse, color: '#e94560' },
      { label: '👀 Jalousie',  count: emotions.jalousie,  color: '#f5a623' },
      { label: '😂 Humour',    count: emotions.humour,    color: '#7ed321' },
      { label: '😟 Inquiétude',count: emotions.inquietude,color: '#9b59b6' },
      { label: '😤 Tension',   count: emotions.colere,    color: '#e74c3c' },
    ],
    deletedMessages: deleted,
    mediaCount: media,
    firstDate,
    lastDate,
  };
}

export default function AnalyzerScreen() {
  const [chatText, setChatText]     = useState('');
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(false);
  const [importing, setImporting]   = useState(false);
  const [fileName, setFileName]     = useState('');
  const [inputMode, setInputMode]   = useState<'paste' | 'file'>('file');

  // ── Import .txt file ──────────────────────────────────────────
  const handleImport = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/*', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) {
        setImporting(false);
        return;
      }

      const asset = result.assets[0];
      setFileName(asset.name);

      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setChatText(content);
      setImporting(false);
      Alert.alert('✅ Fichier importé', `"${asset.name}" chargé avec succès.\nAppuie sur Analyser.`);
    } catch (e) {
      setImporting(false);
      Alert.alert('Erreur', 'Impossible de lire le fichier. Assure-toi que c\'est un .txt exporté depuis WhatsApp.');
    }
  };

  // ── Analyze ───────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!chatText.trim()) {
      Alert.alert('Attention', 'Importe un fichier ou colle du texte d\'abord.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = analyzeChat(chatText);
    setStats(result);
    await AsyncStorage.setItem('last_analysis', JSON.stringify(result));
    setLoading(false);
  };

  const maxEmotion = stats ? Math.max(...stats.emotions.map(e => e.count), 1) : 1;
  const maxHour    = stats?.topHours[0]?.count || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Analyseur de Conversation</Text>
      <Text style={styles.subtitle}>Importe ton export WhatsApp (.txt) ou colle le texte</Text>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, inputMode === 'file' && styles.modeBtnActive]}
          onPress={() => setInputMode('file')}>
          <Text style={[styles.modeBtnText, inputMode === 'file' && styles.modeBtnTextActive]}>📂 Fichier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, inputMode === 'paste' && styles.modeBtnActive]}
          onPress={() => setInputMode('paste')}>
          <Text style={[styles.modeBtnText, inputMode === 'paste' && styles.modeBtnTextActive]}>📋 Coller</Text>
        </TouchableOpacity>
      </View>

      {/* File import */}
      {inputMode === 'file' && (
        <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing}>
          {importing
            ? <ActivityIndicator color="#fff" />
            : <>
                <Text style={styles.importIcon}>📂</Text>
                <Text style={styles.importTitle}>
                  {fileName ? `✅ ${fileName}` : 'Importer une discussion WhatsApp'}
                </Text>
                <Text style={styles.importSub}>
                  {fileName
                    ? `${chatText.split('\n').length.toLocaleString()} lignes chargées`
                    : 'Fichier .txt exporté depuis WhatsApp'}
                </Text>
              </>
          }
        </TouchableOpacity>
      )}

      {/* Paste mode */}
      {inputMode === 'paste' && (
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={7}
          placeholder="Colle ici le texte de ta conversation WhatsApp..."
          placeholderTextColor="#555"
          value={chatText}
          onChangeText={setChatText}
          textAlignVertical="top"
        />
      )}

      {/* Analyze button */}
      <TouchableOpacity style={styles.button} onPress={handleAnalyze} disabled={loading || !chatText}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>🔍 Analyser</Text>}
      </TouchableOpacity>

      {/* Results */}
      {stats && (
        <View style={styles.results}>

          {/* Period */}
          {stats.firstDate ? (
            <View style={styles.periodBox}>
              <Text style={styles.periodText}>📅 Du {stats.firstDate} au {stats.lastDate}</Text>
            </View>
          ) : null}

          {/* Message counts */}
          <Text style={styles.sectionTitle}>📈 Messages</Text>
          <View style={styles.cards}>
            <View style={styles.card}>
              <Text style={styles.cardNum}>{stats.totalMessages.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Total</Text>
            </View>
            <View style={[styles.card, { borderColor: '#4a90e2' }]}>
              <Text style={[styles.cardNum, { color: '#4a90e2' }]}>{stats.alexMessages.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Alex</Text>
            </View>
            <View style={[styles.card, { borderColor: '#e94560' }]}>
              <Text style={[styles.cardNum, { color: '#e94560' }]}>{stats.camilleMessages.toLocaleString()}</Text>
              <Text style={styles.cardLabel}>Camille</Text>
            </View>
          </View>

          {/* Who writes more */}
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Qui écrit le plus ?</Text>
            <View style={styles.balanceBar}>
              <View style={[styles.balanceFillAlex, {
                flex: stats.alexMessages || 1,
              }]} />
              <View style={[styles.balanceFillCamille, {
                flex: stats.camilleMessages || 1,
              }]} />
            </View>
            <View style={styles.balanceLegend}>
              <Text style={styles.balanceLegendText}>
                Alex {stats.totalMessages ? Math.round(stats.alexMessages / stats.totalMessages * 100) : 0}%
              </Text>
              <Text style={[styles.balanceLegendText, { color: '#e94560' }]}>
                Camille {stats.totalMessages ? Math.round(stats.camilleMessages / stats.totalMessages * 100) : 0}%
              </Text>
            </View>
          </View>

          <View style={styles.cards}>
            <View style={[styles.card, { borderColor: '#f5a623' }]}>
              <Text style={[styles.cardNum, { color: '#f5a623' }]}>{stats.deletedMessages}</Text>
              <Text style={styles.cardLabel}>Supprimés</Text>
            </View>
            <View style={[styles.card, { borderColor: '#7ed321' }]}>
              <Text style={[styles.cardNum, { color: '#7ed321' }]}>{stats.mediaCount}</Text>
              <Text style={styles.cardLabel}>Médias</Text>
            </View>
          </View>

          {/* Emotions */}
          <Text style={styles.sectionTitle}>🎭 Émotions détectées</Text>
          {stats.emotions.map((e, i) => (
            <View key={i} style={styles.emotionRow}>
              <Text style={styles.emotionLabel}>{e.label}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: `${Math.max(3, (e.count / maxEmotion) * 100)}%`,
                  backgroundColor: e.color,
                }]} />
              </View>
              <Text style={[styles.emotionCount, { color: e.color }]}>{e.count}</Text>
            </View>
          ))}

          {/* Active hours */}
          <Text style={styles.sectionTitle}>🕐 Heures les plus actives</Text>
          {stats.topHours.map((h, i) => (
            <View key={i} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{h.hour}</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width: `${(h.count / maxHour) * 100}%`,
                  backgroundColor: '#0f3460',
                }]} />
              </View>
              <Text style={styles.hourCount}>{h.count}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#1a1a2e' },
  content:    { padding: 20, paddingTop: 50, paddingBottom: 40 },
  title:      { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle:   { fontSize: 13, color: '#888', marginBottom: 18 },

  modeRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeBtn:         { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#16213e', alignItems: 'center', borderWidth: 1, borderColor: '#0f3460' },
  modeBtnActive:   { borderColor: '#e94560', backgroundColor: '#2d1b2e' },
  modeBtnText:     { color: '#666', fontWeight: '600', fontSize: 13 },
  modeBtnTextActive:{ color: '#e94560', fontWeight: '700' },

  importBtn:   { backgroundColor: '#16213e', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#0f3460', borderStyle: 'dashed', marginBottom: 14, gap: 6 },
  importIcon:  { fontSize: 36 },
  importTitle: { color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  importSub:   { color: '#666', fontSize: 12, textAlign: 'center' },

  input:     { backgroundColor: '#16213e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 13, minHeight: 130, borderWidth: 1, borderColor: '#0f3460', marginBottom: 14 },
  button:    { backgroundColor: '#e94560', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 24 },
  buttonText:{ color: '#fff', fontWeight: '700', fontSize: 16 },

  results:       { gap: 4 },
  periodBox:     { backgroundColor: '#16213e', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#0f3460' },
  periodText:    { color: '#888', fontSize: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#e94560', marginTop: 16, marginBottom: 10 },

  cards:     { flexDirection: 'row', gap: 10, marginBottom: 8 },
  card:      { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#0f3460' },
  cardNum:   { fontSize: 22, fontWeight: '800', color: '#fff' },
  cardLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  balanceBox:      { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#0f3460' },
  balanceLabel:    { color: '#888', fontSize: 12, marginBottom: 8 },
  balanceBar:      { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  balanceFillAlex: { backgroundColor: '#4a90e2' },
  balanceFillCamille: { backgroundColor: '#e94560' },
  balanceLegend:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  balanceLegendText:{ color: '#4a90e2', fontSize: 12, fontWeight: '600' },

  emotionRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  emotionLabel:  { width: 112, fontSize: 12, color: '#ccc' },
  barBg:         { flex: 1, height: 10, backgroundColor: '#16213e', borderRadius: 5, overflow: 'hidden' },
  barFill:       { height: '100%', borderRadius: 5 },
  emotionCount:  { width: 40, textAlign: 'right', fontSize: 12, fontWeight: '700' },

  hourRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  hourLabel: { width: 40, fontSize: 12, color: '#ccc' },
  hourCount: { width: 40, textAlign: 'right', fontSize: 12, color: '#4a90e2', fontWeight: '700' },
});
