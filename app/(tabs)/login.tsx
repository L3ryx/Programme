import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const msg =
        e.code === 'auth/user-not-found' ? 'Compte introuvable.' :
        e.code === 'auth/wrong-password' ? 'Mot de passe incorrect.' :
        e.code === 'auth/invalid-email' ? 'Email invalide.' :
        e.code === 'auth/invalid-credential' ? 'Email ou mot de passe incorrect.' :
        'Erreur de connexion. Réessaie.';
      Alert.alert('Connexion échouée', msg);
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
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>💑</Text>
          <Text style={styles.appName}>CoupleApp</Text>
          <Text style={styles.tagline}>Votre espace privé & chiffré</Text>
        </View>

        {/* Lock badge */}
        <View style={styles.encryptBadge}>
          <Text style={styles.encryptIcon}>🔒</Text>
          <Text style={styles.encryptText}>Messages chiffrés AES-256</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Adresse email</Text>
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
          <View style={styles.passwordWrap}>
            <TextInput
              style={styles.inputPassword}
              placeholder="••••••••"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Se connecter 🔓</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Pas encore de compte ? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Accounts info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>📋 Comptes de l'app</Text>
          <Text style={styles.infoItem}>👤 alex@alemille.app</Text>
          <Text style={styles.infoItem}>👤 camille@alemille.app</Text>
          <Text style={styles.infoNote}>Crée les comptes via "Créer un compte" ci-dessus</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  inner: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 64, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 3 },
  tagline: { fontSize: 13, color: '#888', marginTop: 4 },

  encryptBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0d2b0d', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 7, alignSelf: 'center', marginBottom: 32,
    borderWidth: 1, borderColor: '#1a4d1a',
  },
  encryptIcon: { fontSize: 14 },
  encryptText: { color: '#4caf50', fontSize: 12, fontWeight: '700' },

  form: { gap: 8, marginBottom: 28 },
  label: { color: '#aaa', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  input: {
    backgroundColor: '#16213e', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#0f3460',
  },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16213e', borderRadius: 12, borderWidth: 1, borderColor: '#0f3460' },
  inputPassword: { flex: 1, padding: 14, color: '#fff', fontSize: 15 },
  eyeBtn: { paddingHorizontal: 14 },
  eyeText: { fontSize: 18 },

  loginBtn: { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  registerText: { color: '#666', fontSize: 14 },
  registerLink: { color: '#e94560', fontSize: 14, fontWeight: '700' },

  infoBox: {
    backgroundColor: '#16213e', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#0f3460', gap: 6,
  },
  infoTitle: { color: '#e94560', fontWeight: '700', fontSize: 14, marginBottom: 4 },
  infoItem: { color: '#aaa', fontSize: 13 },
  infoNote: { color: '#555', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
});
