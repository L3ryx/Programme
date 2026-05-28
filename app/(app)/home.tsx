/**
 * home.tsx — Page d'accueil / liaison partenaire (Appwrite)
 */

import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getProfileByUsername,
  getProfileById,
  updateProfile,
} from '../../src/lib/appwrite';
import { useApp } from '../../src/context/AppContext';

type FoundProfile = {
  $id:          string;
  username:     string;
  display_name: string;
  avatar_url:   string | null;
};

export default function HomeScreen() {
  const { profile, setProfile, setPartner, needsUsername } = useApp();
  const router = useRouter();

  const [query, setQuery]           = useState('');
  const [searching, setSearching]   = useState(false);
  const [found, setFound]           = useState<FoundProfile | null>(null);
  const [notFound, setNotFound]     = useState(false);
  const [linking, setLinking]       = useState(false);
  const [fadeAnim]                  = useState(new Animated.Value(0));

  useEffect(() => {
    if (needsUsername) router.replace('/(auth)/setup-username');
  }, [needsUsername]);

  useEffect(() => {
    if (profile?.partner_id) router.replace('/(app)/chat');
  }, [profile?.partner_id]);

  useEffect(() => {
    if (found) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [found]);

  // Profil pas encore chargé depuis Appwrite
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={ROSE} size="large" />
        <Text style={styles.loadingText}>Chargement du profil…</Text>
      </View>
    );
  }

  async function searchPartner() {
    const cleaned = query.replace('@', '').trim().toLowerCase();
    if (!cleaned) return;
    if (cleaned === profile?.username?.toLowerCase()) {
      Alert.alert('Oops', 'Tu ne peux pas te lier à toi-même 😅');
      return;
    }

    setSearching(true);
    setFound(null);
    setNotFound(false);

    const data = await getProfileByUsername(cleaned);
    setSearching(false);

    if (data) {
      setFound({ $id: data.$id, username: data.username!, display_name: data.display_name, avatar_url: data.avatar_url });
    } else {
      setNotFound(true);
    }
  }

  async function linkPartner() {
    if (!found || !profile) return;

    Alert.alert(
      '💞 Lier définitivement ?',
      `Tu vas te lier avec @${found.username}.\n\nAttention : cette liaison est PERMANENTE et ne pourra jamais être annulée.\n\nContinuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, se lier ❤️',
          onPress: async () => {
            setLinking(true);

            const updated = await updateProfile(profile.$id, {
              partner_id:     found!.$id,
              partner_locked: true,
            });

            if (!updated) {
              Alert.alert('Erreur', 'Impossible de créer la liaison. Réessaie.');
              setLinking(false);
              return;
            }

            setProfile(updated);

            const partnerFull = await getProfileById(found!.$id);
            if (partnerFull) setPartner(partnerFull);

            setLinking(false);
            router.replace('/(app)/chat');
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.headerGreet}>
            Salut @{profile.username} 👋
          </Text>
          <Text style={styles.headerTitle}>Trouve ton partenaire</Text>
          <Text style={styles.headerSub}>
            Recherche son @username pour vous lier.{'\n'}
            Cette liaison sera définitive et permanente.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="username de ton partenaire"
              placeholderTextColor="#444"
              value={query}
              onChangeText={(t) => { setQuery(t); setFound(null); setNotFound(false); }}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={searchPartner}
              returnKeyType="search"
            />
            {searching
              ? <ActivityIndicator color="#e879a0" size="small" />
              : (
                <TouchableOpacity style={styles.searchBtn} onPress={searchPartner}>
                  <Text style={styles.searchBtnText}>🔍</Text>
                </TouchableOpacity>
              )
            }
          </View>

          {notFound && (
            <View style={styles.notFound}>
              <Text style={styles.notFoundText}>
                Aucun utilisateur trouvé pour @{query.replace('@', '')}
              </Text>
            </View>
          )}

          {found && (
            <Animated.View style={[styles.resultCard, { opacity: fadeAnim }]}>
              <View style={styles.resultAvatar}>
                <Text style={styles.resultAvatarText}>
                  {(found.display_name || found.username)[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultUsername}>@{found.username}</Text>
                <Text style={styles.resultName}>{found.display_name}</Text>
              </View>
              <TouchableOpacity
                style={[styles.linkBtn, linking && styles.linkBtnDisabled]}
                onPress={linkPartner}
                disabled={linking}
              >
                {linking
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.linkBtnText}>Se lier ❤️</Text>
                }
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            La liaison entre deux personnes est permanente et irréversible. Assure-toi de chercher la bonne personne avant de confirmer.
          </Text>
        </View>

        <View style={styles.myUsernameBox}>
          <Text style={styles.myUsernameLabel}>Mon username (à partager avec mon/ma partenaire)</Text>
          <Text style={styles.myUsername}>@{profile.username}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const ROSE = '#e879a0';
const DEEP = '#0d0d18';
const CARD = '#13131f';
const BORDER = '#1e1e30';

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: DEEP, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#555', fontSize: 14 },
  container: { flex: 1, backgroundColor: DEEP },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30 },
  header: { marginBottom: 32 },
  headerGreet: { fontSize: 14, color: ROSE, fontWeight: '700', marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 8 },
  headerSub: { fontSize: 14, color: '#666', lineHeight: 20 },
  searchCard: { backgroundColor: CARD, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: DEEP, borderRadius: 12, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12 },
  atSign: { color: ROSE, fontSize: 18, fontWeight: '800', marginRight: 4 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 13 },
  searchBtn: { padding: 8 },
  searchBtnText: { fontSize: 18 },
  notFound: { marginTop: 14, padding: 12, backgroundColor: '#1a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#2e0a0a' },
  notFoundText: { color: '#f87171', fontSize: 13, textAlign: 'center' },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14, backgroundColor: '#0a1a1a', borderRadius: 14, borderWidth: 1, borderColor: '#0a2a2a' },
  resultAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center' },
  resultAvatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  resultInfo: { flex: 1 },
  resultUsername: { color: '#fff', fontWeight: '800', fontSize: 15 },
  resultName: { color: '#888', fontSize: 12, marginTop: 2 },
  linkBtn: { backgroundColor: ROSE, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  linkBtnDisabled: { opacity: 0.4 },
  linkBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  warningBox: { flexDirection: 'row', gap: 10, backgroundColor: '#1a1000', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2a2000', marginBottom: 20 },
  warningIcon: { fontSize: 16 },
  warningText: { flex: 1, color: '#d97706', fontSize: 12, lineHeight: 18 },
  myUsernameBox: { backgroundColor: CARD, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  myUsernameLabel: { color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  myUsername: { color: ROSE, fontSize: 22, fontWeight: '900' },
});
