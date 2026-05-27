import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator
} from 'react-native';

interface Result {
  score: number;
  flags: { label: string; detail: string; type: 'red' | 'orange' | 'green' }[];
  advice: string;
}

function analyzeText(text: string): Result {
  const lower = text.toLowerCase();
  const flags: Result['flags'] = [];
  let score = 100;

  // Red flags
  const redPatterns = [
    { words: ['supprimé','supprimé ce message'], label: '🚩 Messages supprimés', detail: 'Des messages ont été effacés, signe possible de dissimulation.' },
    { words: ['localisation','où tu es','où es-tu'], label: '🚩 Contrôle de localisation', detail: 'Surveiller constamment la localisation de l\'autre peut indiquer un manque de confiance ou du contrôle.' },
    { words: ['tu cache','tu caches','quelque chose à cacher'], label: '🚩 Accusations cachotterie', detail: 'Accuser l\'autre de cacher des choses sans preuve crée de la méfiance injustifiée.' },
    { words: ['tu parle à qui','tu parles à qui'], label: '🚩 Contrôle des contacts', detail: 'Vouloir surveiller avec qui parle son/sa partenaire est un signe de jalousie excessive.' },
    { words: ['tu t\'amuses','tu dois t\'amuser','avec quelqu\'un'], label: '🚩 Suspicion sans base', detail: 'Imaginer des scénarios négatifs sans preuve témoigne d\'une insécurité importante.' },
  ];

  // Orange flags
  const orangePatterns = [
    { words: ['parano','paranoia'], label: '⚠️ Comportement paranoïaque', detail: 'La paranoïa peut être temporaire (stress, substances) mais mérite attention.' },
    { words: ['jalou','jalousie','succès','toutes ces filles'], label: '⚠️ Jalousie', detail: 'La jalousie modérée est normale mais peut devenir toxique si excessive.' },
    { words: ['je me sens dévalorisé','dévalorisé','dévalorisée'], label: '⚠️ Sentiment de dévalorisation', detail: 'Se sentir dévalorisé dans la relation est un signal à ne pas ignorer.' },
    { words: ['tu te forces','tu te force','pas épanoui'], label: '⚠️ Doutes sur les sentiments', detail: 'L\'impression que l\'autre se force mérite une conversation ouverte et honnête.' },
    { words: ['évitant','évite','joue sur les mots'], label: '⚠️ Communication évitante', detail: 'Eviter les sujets difficiles empêche la résolution des conflits.' },
  ];

  // Green flags
  const greenPatterns = [
    { words: ['pardon','désolé','désolée','excuse'], label: '✅ Capacité à s\'excuser', detail: 'Savoir s\'excuser montre de la maturité émotionnelle.' },
    { words: ['confiance','je n\'ai rien à cacher'], label: '✅ Transparence', detail: 'La transparence est une base saine pour une relation.' },
    { words: ['je tiens à toi','je t\'aime','tu me manques'], label: '✅ Expression des sentiments', detail: 'Exprimer ses sentiments ouvertement renforce le lien affectif.' },
    { words: ['on en parle','j\'ai voulu t\'en parler','échange'], label: '✅ Communication ouverte', detail: 'Vouloir dialoguer est un excellent signe de communication saine.' },
    { words: ['j\'ai hâte','impatience','retrouver'], label: '✅ Engagement & désir', detail: 'L\'enthousiasme à retrouver l\'autre montre un attachement sincère.' },
  ];

  redPatterns.forEach(p => {
    if (p.words.some(w => lower.includes(w))) {
      flags.push({ label: p.label, detail: p.detail, type: 'red' });
      score -= 20;
    }
  });

  orangePatterns.forEach(p => {
    if (p.words.some(w => lower.includes(w))) {
      flags.push({ label: p.label, detail: p.detail, type: 'orange' });
      score -= 10;
    }
  });

  greenPatterns.forEach(p => {
    if (p.words.some(w => lower.includes(w))) {
      flags.push({ label: p.label, detail: p.detail, type: 'green' });
      score += 5;
    }
  });

  score = Math.max(0, Math.min(100, score));

  let advice = '';
  if (score >= 80) advice = '💚 Cette conversation montre des bases saines. Continuez à communiquer ouvertement !';
  else if (score >= 60) advice = '💛 Quelques points d\'attention. Une conversation calme et bienveillante peut tout arranger.';
  else if (score >= 40) advice = '🟠 Plusieurs signaux méritent attention. Il serait bon de poser les choses et d\'en parler sereinement.';
  else advice = '🔴 Cette conversation contient plusieurs indicateurs préoccupants. Parlez-en ensemble ou consultez un professionnel de couple.';

  return { score, flags, advice };
}

const getScoreColor = (score: number) => {
  if (score >= 80) return '#7ed321';
  if (score >= 60) return '#f5a623';
  if (score >= 40) return '#e67e22';
  return '#e94560';
};

export default function RedFlagScreen() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setResult(analyzeText(text));
    setLoading(false);
  };

  const redFlags = result?.flags.filter(f => f.type === 'red') || [];
  const orangeFlags = result?.flags.filter(f => f.type === 'orange') || [];
  const greenFlags = result?.flags.filter(f => f.type === 'green') || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🚩 Détecteur Red Flags</Text>
      <Text style={styles.subtitle}>Analyse la santé de ta communication de couple</Text>

      <TextInput
        style={styles.input}
        multiline
        numberOfLines={7}
        placeholder="Colle ici un message, une conversation ou décris une situation..."
        placeholderTextColor="#555"
        value={text}
        onChangeText={setText}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.button} onPress={analyze} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={styles.buttonText}>🔍 Analyser</Text>}
      </TouchableOpacity>

      {result && (
        <View style={styles.results}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score de communication</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNum, { color: getScoreColor(result.score) }]}>{result.score}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, {
                width: `${result.score}%`,
                backgroundColor: getScoreColor(result.score)
              }]} />
            </View>
          </View>

          <View style={styles.adviceBox}>
            <Text style={styles.adviceText}>{result.advice}</Text>
          </View>

          {redFlags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🚩 Red Flags détectés</Text>
              {redFlags.map((f, i) => (
                <View key={i} style={[styles.flagCard, styles.flagRed]}>
                  <Text style={styles.flagLabel}>{f.label}</Text>
                  <Text style={styles.flagDetail}>{f.detail}</Text>
                </View>
              ))}
            </>
          )}

          {orangeFlags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⚠️ Points d'attention</Text>
              {orangeFlags.map((f, i) => (
                <View key={i} style={[styles.flagCard, styles.flagOrange]}>
                  <Text style={styles.flagLabel}>{f.label}</Text>
                  <Text style={styles.flagDetail}>{f.detail}</Text>
                </View>
              ))}
            </>
          )}

          {greenFlags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Points positifs</Text>
              {greenFlags.map((f, i) => (
                <View key={i} style={[styles.flagCard, styles.flagGreen]}>
                  <Text style={styles.flagLabel}>{f.label}</Text>
                  <Text style={styles.flagDetail}>{f.detail}</Text>
                </View>
              ))}
            </>
          )}

          {result.flags.length === 0 && (
            <View style={styles.noFlag}>
              <Text style={styles.noFlagText}>🤷 Aucun signal détecté.{'\n'}Essaie avec plus de texte.</Text>
            </View>
          )}

          <View style={styles.tipsBox}>
            <Text style={styles.tipsTitle}>💬 Conseils généraux</Text>
            <Text style={styles.tipItem}>• Exprimez vos besoins sans accusation ("Je ressens..." plutôt que "Tu fais...")</Text>
            <Text style={styles.tipItem}>• La confiance se construit avec le temps et la cohérence</Text>
            <Text style={styles.tipItem}>• La jalousie signale souvent une insécurité personnelle à travailler</Text>
            <Text style={styles.tipItem}>• Un couple sain peut traverser les doutes avec une communication ouverte</Text>
          </View>
        </View>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  input: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, color: '#fff', fontSize: 13, minHeight: 130, borderWidth: 1, borderColor: '#0f3460', marginBottom: 14 },
  button: { backgroundColor: '#e94560', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 24 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  results: { gap: 4 },
  scoreContainer: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#0f3460' },
  scoreLabel: { color: '#888', fontSize: 13, marginBottom: 10 },
  scoreCircle: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  scoreNum: { fontSize: 52, fontWeight: '800', lineHeight: 56 },
  scoreMax: { fontSize: 18, color: '#555', marginBottom: 8 },
  scoreBar: { width: '100%', height: 8, backgroundColor: '#1a1a2e', borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 4 },
  adviceBox: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#0f3460' },
  adviceText: { color: '#ddd', fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginTop: 12, marginBottom: 8 },
  flagCard: { borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4 },
  flagRed: { backgroundColor: '#2d1b1b', borderLeftColor: '#e94560' },
  flagOrange: { backgroundColor: '#2d2510', borderLeftColor: '#f5a623' },
  flagGreen: { backgroundColor: '#1b2d1b', borderLeftColor: '#7ed321' },
  flagLabel: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  flagDetail: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  noFlag: { padding: 30, alignItems: 'center' },
  noFlagText: { color: '#555', textAlign: 'center', lineHeight: 24, fontSize: 14 },
  tipsBox: { backgroundColor: '#16213e', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#0f3460' },
  tipsTitle: { color: '#e94560', fontWeight: '700', fontSize: 15, marginBottom: 10 },
  tipItem: { color: '#aaa', fontSize: 13, lineHeight: 22 },
});
