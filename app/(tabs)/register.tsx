import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password || !confirm) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
    } catch (e: any) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'Cet email est déjà utilisé.' :
        e.code === 'auth/invalid-email' ? 'Email invalide.' :
        e.code === 'auth/weak-password' ? 'Mot de passe trop faible (min. 6 caractères).' :
        'Erreur lors de la création du compte.';
      Alert.alert('Échec', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Rejoins ton espace privé de couple</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={styles.input}
            placeholder="Alex ou Camille"
            placeholderTextColor="#555"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 caractères"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Répète le mot de passe"
            placeholderTextColor="#555"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.registerBtnText}>Créer mon compte 💑</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.tip}>
          <Text style={styles.tipText}>
            💡 Crée deux comptes — un pour chaque partenaire — pour accéder à la messagerie en temps réel.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flexGrow: 1, padding: 24, paddingTop: 56 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#e94560', fontSize: 15, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },

  form: { gap: 8, marginBottom: 24 },
  label: { color: '#aaa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  input: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#0f3460',
  },
  registerBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  tip: { backgroundColor: '#16213e', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#0f3460' },
  tipText: { color: '#888', fontSize: 13, lineHeight: 20 },
});
