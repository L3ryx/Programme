import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal, ActivityIndicator
} from 'react-native';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

interface Entry {
  id: string;
  author: string;
  authorUid: string;
  mood: string;
  text: string;
  date: string;
  timestamp: any;
}

const MOODS = ['😍','😊','😐','😢','😤','🥰','😴','🤔'];

export default function JournalScreen() {
  const { user, userProfile } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'journal'),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const entries: Entry[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Entry));
      setEntries(entries);
      setLoading(false);
    });
    return unsub;
  }, []);

  const saveEntry = async () => {
    if (!text.trim() || !user || !userProfile) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'journal'), {
        author: userProfile.displayName,
        authorUid: user.uid,
        mood: selectedMood,
        text: text.trim(),
        date: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        timestamp: serverTimestamp(),
      });
      setText('');
      setModalVisible(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string, authorUid: string) => {
    if (authorUid !== user?.uid) {
      Alert.alert('Accès refusé', 'Tu ne peux supprimer que tes propres entrées.');
      return;
    }
    Alert.alert('Supprimer ?', 'Cette entrée sera effacée.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'journal', id));
        }
      }
    ]);
  };

  const sendPoke = async () => {
    if (!user || !userProfile) return;
    try {
      await addDoc(collection(db, 'journal'), {
        author: userProfile.displayName,
        authorUid: user.uid,
        mood: '👈',
        text: `💌 ${userProfile.displayName} t'envoie un poke !`,
        date: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        timestamp: serverTimestamp(),
      });
      Alert.alert('Poke envoyé ! 👈', 'Ton/ta partenaire verra le poke dans le journal.');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le poke.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💑 Journal de Couple</Text>
      <Text style={styles.subtitle}>Partagé en temps réel avec ton/ta partenaire</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>✏️ Écrire</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pokeBtn} onPress={sendPoke}>
          <Text style={styles.pokeBtnText}>👈 Poke</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {entries.length === 0 && (
          <Text style={styles.empty}>Aucune entrée pour l'instant 💭{'\n'}Commence par écrire quelque chose !</Text>
        )}
        {entries.map(e => {
          const isMe = e.authorUid === user?.uid;
          return (
            <TouchableOpacity
              key={e.id}
              style={[styles.entry, isMe ? styles.entryRight : styles.entryLeft]}
              onLongPress={() => deleteEntry(e.id, e.authorUid)}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryMood}>{e.mood}</Text>
                <Text style={[styles.entryAuthor, isMe && styles.entryAuthorMe]}>{e.author}</Text>
              </View>
              <Text style={styles.entryText}>{e.text}</Text>
              <Text style={styles.entryDate}>{e.date}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✏️ Nouvelle entrée</Text>
            <Text style={styles.modalLabel}>Humeur</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity key={m}
                  style={[styles.moodBtn, selectedMood === m && styles.moodSelected]}
                  onPress={() => setSelectedMood(m)}>
                  <Text style={styles.moodText}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={5}
              placeholder="Ce que tu ressens aujourd'hui..."
              placeholderTextColor="#555"
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setText(''); }}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Sauvegarder 💾</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 20 },
  loadingContainer: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#555', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  addBtn: { flex: 1, backgroundColor: '#e94560', borderRadius: 12, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  pokeBtn: { backgroundColor: '#0f3460', borderRadius: 12, padding: 12, paddingHorizontal: 20 },
  pokeBtnText: { color: '#fff', fontWeight: '700' },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#555', marginTop: 60, lineHeight: 26, fontSize: 14 },
  entry: { backgroundColor: '#16213e', borderRadius: 14, padding: 14, marginBottom: 12, maxWidth: '85%', borderWidth: 1, borderColor: '#0f3460' },
  entryLeft: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  entryRight: { alignSelf: 'flex-end', borderBottomRightRadius: 4, borderColor: '#e94560' },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  entryMood: { fontSize: 20 },
  entryAuthor: { color: '#4a90e2', fontWeight: '700', fontSize: 13 },
  entryAuthorMe: { color: '#e94560' },
  entryText: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  entryDate: { color: '#555', fontSize: 10, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#16213e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16 },
  modalLabel: { color: '#888', fontSize: 13, marginBottom: 8 },
  moodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  moodBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#0f3460' },
  moodSelected: { borderColor: '#e94560', backgroundColor: '#2d1b2e' },
  moodText: { fontSize: 22 },
  modalInput: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, minHeight: 100, borderWidth: 1, borderColor: '#0f3460', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#1a1a2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  cancelText: { color: '#888', fontWeight: '600' },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#e94560', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});
