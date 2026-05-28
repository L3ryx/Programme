/**
 * setup-username.tsx — Choix du username après la première connexion
 *
 * Obligatoire avant d'accéder à l'application.
 * Le username sert à être trouvé par son/sa partenaire.
 * Il est unique, entre 3 et 20 caractères, lettres/chiffres/tirets uniquement.
 */

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useApp } from '../../src/context/AppContext';

export default function SetupUsernameScreen() {
  const { profile, setProfile, setNeedsUsername } = useApp();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const isValid = /^[a-z0-9_-]{3,20}$/.test(username);

  async function checkUsername(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(cleaned);
    setAvailable(null);

    if (cleaned.length < 3) return;

    setChecking(true);
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', cleaned)
      .maybeSingle();
    setChecking(false);
    setAvailable(!data);
  }

  async function saveUsername() {
    if (!isValid || !available || !profile) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: username.toLowerCase() })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      Alert.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris.');
      setAvailable(false);
      setSaving(false);
      return;
    }

    if (data) {
      setProfile(data);
      setNeedsUsername(false);
    }
    setSaving(false);
    router.replace('/(app)/home');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Illustration */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Choisis ton username</Text>
          <Text style={styles.heroSub}>
            Ton/ta partenaire te trouvera en cherchant ce nom.{'\n'}
            Il est unique et ne peut pas être changé.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nom d'utilisateur</Text>

          <View style={styles.inputRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="ton_username"
              placeholderTextColor="#444"
              value={username}
              onChangeText={checkUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <View style={styles.statusIcon}>
              {checking && <ActivityIndicator size="small" color="#e879a0" />}
              {!checking && available === true && <Text style={{ fontSize: 18 }}>✅</Text>}
              {!checking && available === false && <Text style={{ fontSize: 18 }}>❌</Text>}
            </View>
          </View>

          {/* Règles */}
          <View style={styles.rules}>
            <Rule ok={username.length >= 3} text="Au moins 3 caractères" />
            <Rule ok={username.length <= 20} text="Maximum 20 caractères" />
            <Rule ok={/^[a-z0-9_-]*$/.test(username) && username.length > 0} text="Lettres, chiffres, _ et - uniquement" />
            {available === false && (
              <Text style={styles.ruleErr}>⚠️ Ce username est déjà pris</Text>
            )}
            {available === true && (
              <Text style={styles.ruleOk}>✅ Disponible !</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, (!isValid || !available || saving) && styles.btnDisabled]}
            onPress={saveUsername}
            disabled={!isValid || !available || saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Confirmer mon username →</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footnote}>
          Ce nom sera visible par ton/ta partenaire uniquement.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function Rule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <Text style={{ color: ok ? '#4ade80' : '#555', fontSize: 12 }}>{ok ? '✓' : '○'}</Text>
      <Text style={{ color: ok ? '#4ade80' : '#555', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

const ROSE = '#e879a0';
const DEEP = '#0d0d18';
const CARD = '#13131f';
const BORDER = '#1e1e30';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DEEP },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },

  hero: { alignItems: 'center', marginBottom: 36 },
  heroEmoji: { fontSize: 54, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  card: { backgroundColor: CARD, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: BORDER },

  label: { fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DEEP, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 12, marginBottom: 16,
  },
  atSign: { color: ROSE, fontSize: 20, fontWeight: '800', marginRight: 4 },
  input: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700', paddingVertical: 14 },
  statusIcon: { width: 28, alignItems: 'center' },

  rules: { marginBottom: 20 },
  ruleErr: { color: '#f87171', fontSize: 12, marginTop: 4 },
  ruleOk: { color: '#4ade80', fontSize: 12, marginTop: 4 },

  btn: {
    backgroundColor: ROSE, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  footnote: { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
