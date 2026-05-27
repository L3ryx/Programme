import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STYLES = ['Pop romantique', 'Rap tendresse', 'Chanson française', 'R&B doux', 'Folk acoustique'];
const MOODS = ['Amoureux 🥰', 'Mélancolique 😢', 'Passionné 🔥', 'Drôle 😂', 'Nostalgique 🌅'];

function generateLyrics(keywords: string, style: string, mood: string, names: string): string {
  const kw = keywords.toLowerCase();
  const [n1, n2] = names.split('/').map(n => n.trim()) || ['Toi', 'Moi'];

  const verses: Record<string, string> = {
    'Pop romantique': `[Couplet 1]
La distance entre nous, c'est juste des kilomètres
${n1} et ${n2}, deux cœurs qui s'entêtent
${kw.includes('bisou') ? 'Tes bisous me manquent chaque matin qui se lève' : 'Chaque message de toi, une nouvelle aurore'}
${kw.includes('manque') ? 'Tu me manques tellement, c\'est comme une fièvre' : 'Dans mes pensées tu restes, tu ne pars plus'}

[Refrain]
${n1}, ${n2}, on traverse tout ça
La nuit, le doute, les larmes et les éclats de rire
Je t'envoie des étoiles pour que tu les attrapes là-bas
Parce que sans toi, je ne sais plus respirer

[Couplet 2]
${kw.includes('cookie') ? 'Tes cookies du dimanche, je les imagine dorés' : 'Ton sourire en photo, il illumine ma journée'}
${kw.includes('roller') ? 'Tu glisses sur tes rollers pendant que je rêve de toi' : 'Pendant que tu cours, je compte les jours qui passent'}
${kw.includes('câlin') ? 'Un jour bientôt je te serrerai fort dans mes bras' : 'Un jour prochain nos mains se rejoindront enfin'}
Et plus rien ne pourra nous séparer cette fois

[Pont]
Même quand les nuits sont longues et froides
Même quand le silence pèse trop
Je pense à nous, à notre histoire
Et je souris malgré tout`,

    'Rap tendresse': `[Intro]
Yo, ${n1} et ${n2}, longue distance mais cœur intact

[Couplet]
Distance zéro dans ma tête quand tu m'écris le matin
${kw.includes('bisou') ? 'Tes bisous en emoji valent un billet de train' : 'Chaque mot de toi c\'est du soleil sur ma peau'}
${kw.includes('jaloux') || kw.includes('jalousie') ? 'J\'avoue parfois la jalousie ça m\'envahit' : 'Les doutes ils viennent mais l\'amour reste solide'}
Mais c'est parce que tu comptes, t'es pas n'importe qui

[Hook]
${n1} et ${n2}, c'est nous contre le monde
Les kilomètres on s'en fout, notre amour il féconde
${kw.includes('cookie') ? 'Garde-moi des cookies, je débarque un de ces quatre' : 'Garde-moi une place, je débarque un de ces quatre'}
On écrit notre histoire, lettre après lettre

[Outro]
C'est pas parfait, mais c'est réel
${n1} + ${n2}, authentique et fidèle`,

    'Chanson française': `[Couplet 1]
Il y a des matins où le ciel est trop gris
Où ta voix me manque, où le temps s'est figé
${n1} attend ${n2} sur ce quai imaginaire
Deux âmes qui dansent sans jamais se toucher

[Refrain]
Mais l'amour n'a pas besoin de frontières
Il voyage la nuit dans nos rêves mêlés
${kw.includes('bisou') ? 'Tes bisous, tes bisous, je les sens sur ma peau' : 'Ta voix, ta voix, résonne dans mon âme'}
${kw.includes('manque') ? 'Tu me manques tellement, mon beau' : 'Je t\'aime tellement, mon beau'}

[Couplet 2]
Le téléphone posé, les photos partagées
${kw.includes('roller') ? 'Tu glisses sur tes rollers, libre comme le vent' : 'Ta vie qui continue, belle comme le printemps'}
Et moi je te regarde de loin, ébloui
Par cette femme simple qui illumine mes nuits

[Final]
Un jour viendra où la distance sera morte
Et on rira de tout ça, ensemble, à notre porte`,
  };

  return verses[style] || verses['Pop romantique'];
}

export default function SongScreen() {
  const [keywords, setKeywords] = useState('');
  const [names, setNames] = useState('Alex / Camille');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const generate = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const result = generateLyrics(keywords, selectedStyle, selectedMood, names);
    setLyrics(result);
    setLoading(false);
  };

  const saveLyrics = async () => {
    if (!lyrics) return;
    const raw = await AsyncStorage.getItem('saved_songs');
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const entry = `🎵 ${selectedStyle} - ${new Date().toLocaleDateString('fr-FR')}\n\n${lyrics}`;
    arr.unshift(entry);
    await AsyncStorage.setItem('saved_songs', JSON.stringify(arr));
    setSaved(arr);
    Alert.alert('✅ Sauvegardé !', 'Tes paroles sont enregistrées.');
  };

  const loadSaved = async () => {
    const raw = await AsyncStorage.getItem('saved_songs');
    if (raw) setSaved(JSON.parse(raw));
    setShowSaved(!showSaved);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🎵 Générateur de Chanson</Text>
      <Text style={styles.subtitle}>Crée des paroles personnalisées pour vous deux</Text>

      <Text style={styles.label}>Prénoms (Prénom1 / Prénom2)</Text>
      <TextInput style={styles.input} value={names} onChangeText={setNames} placeholderTextColor="#555" color="#fff" />

      <Text style={styles.label}>Mots-clés (bisous, manque, cookie...)</Text>
      <TextInput style={styles.input} value={keywords} onChangeText={setKeywords}
        placeholder="ex: bisous, manque, roller, câlins..." placeholderTextColor="#555" color="#fff" />

      <Text style={styles.label}>Style musical</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {STYLES.map(s => (
          <TouchableOpacity key={s} style={[styles.chip, selectedStyle === s && styles.chipActive]} onPress={() => setSelectedStyle(s)}>
            <Text style={[styles.chipText, selectedStyle === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Ambiance</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {MOODS.map(m => (
          <TouchableOpacity key={m} style={[styles.chip, selectedMood === m && styles.chipActive]} onPress={() => setSelectedMood(m)}>
            <Text style={[styles.chipText, selectedMood === m && styles.chipTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={generate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>🎼 Générer les paroles</Text>}
      </TouchableOpacity>

      {lyrics !== '' && (
        <View style={styles.lyricsBox}>
          <Text style={styles.lyricsText}>{lyrics}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={saveLyrics}>
            <Text style={styles.saveBtnText}>💾 Sauvegarder cette chanson</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.savedToggle} onPress={loadSaved}>
        <Text style={styles.savedToggleText}>{showSaved ? '▲ Masquer' : '📂 Mes chansons sauvegardées'}</Text>
      </TouchableOpacity>

      {showSaved && saved.map((s, i) => (
        <View key={i} style={styles.savedItem}>
          <Text style={styles.savedText}>{s}</Text>
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  label: { color: '#aaa', fontSize: 12, marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#16213e', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#0f3460', marginBottom: 4 },
  chips: { marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#16213e', marginRight: 8, borderWidth: 1, borderColor: '#0f3460' },
  chipActive: { backgroundColor: '#e94560', borderColor: '#e94560' },
  chipText: { color: '#888', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  button: { backgroundColor: '#e94560', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  lyricsBox: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#0f3460' },
  lyricsText: { color: '#ddd', fontSize: 13, lineHeight: 22, fontFamily: 'monospace' },
  saveBtn: { marginTop: 14, backgroundColor: '#0f3460', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  savedToggle: { marginTop: 20, padding: 12, alignItems: 'center' },
  savedToggleText: { color: '#4a90e2', fontWeight: '600' },
  savedItem: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#0f3460' },
  savedText: { color: '#ccc', fontSize: 12, lineHeight: 20 },
});
