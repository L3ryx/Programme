/**
 * login.tsx — Écran d'authentification (Appwrite)
 *
 * Flux :
 *   INSCRIPTION : email + mot de passe → création compte → OTP email (2FA) → onboarding username
 *   CONNEXION   : email + mot de passe → OTP email (2FA) → app
 *
 * Note : Appwrite ne fournit pas nativement la 2FA SMS sans plan Enterprise.
 * On utilise ici la vérification email OTP (Magic URL / Email Token) disponible
 * sur tous les plans, y compris Cloud gratuit.
 */

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { account, createProfile, getProfileById } from '../../src/lib/appwrite';
import { ID } from 'appwrite';
import { useApp } from '../../src/context/AppContext';
import { getIdentityBundle } from '../../src/lib/crypto';
import { updateProfile } from '../../src/lib/appwrite';

type Step = 'credentials' | 'email-otp';
type Mode = 'login' | 'register';

export default function LoginScreen() {
  const { setUser, setProfile, setNeedsUsername } = useApp();
  const [mode, setMode]       = useState<Mode>('login');
  const [step, setStep]       = useState<Step>('credentials');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPass, setShowPass] = useState(false);

  // userId retourné par Appwrite lors de la création de session OTP
  const pendingUserIdRef = useRef<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCountdown(seconds = 60) {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // ── Étape 1 : inscription ou connexion avec email + mot de passe ──
  async function handleCredentials() {
    if (!email.trim()) return Alert.alert('Erreur', 'Entre ton adresse email');
    if (password.length < 8) return Alert.alert('Erreur', 'Le mot de passe doit faire au moins 8 caractères');

    setLoading(true);

    try {
      if (mode === 'register') {
        // Création du compte Appwrite
        const user = await account.create(ID.unique(), email.trim().toLowerCase(), password);
        pendingUserIdRef.current = user.$id;

        // Création du profil en base
        await createProfile(user.$id, email.trim().toLowerCase(), null);

        // Envoi OTP email (2FA)
        await sendEmailOtp(email.trim().toLowerCase());

      } else {
        // Connexion : créer une session email/password
        const session = await account.createEmailPasswordSession(
          email.trim().toLowerCase(),
          password
        );
        pendingUserIdRef.current = session.userId;

        // Déconnecte temporairement — la session sera créée APRÈS la 2FA
        await account.deleteSession('current');

        // Envoi OTP email (2FA)
        await sendEmailOtp(email.trim().toLowerCase());
      }
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Une erreur est survenue');
    }

    setLoading(false);
  }

  async function sendEmailOtp(userEmail: string) {
    try {
      // Appwrite : crée un token OTP envoyé par email
      const token = await account.createEmailToken(
        pendingUserIdRef.current ?? ID.unique(),
        userEmail
      );
      pendingUserIdRef.current = token.userId;
      setStep('email-otp');
      startCountdown(60);
    } catch (e: any) {
      Alert.alert('Erreur OTP', e?.message ?? 'Impossible d\'envoyer le code');
    }
  }

  // ── Étape 2 : vérification OTP email ──────────────────────────
  async function verifyOtp() {
    const code = otp.join('');
    if (code.length < 6) return; // validation silencieuse (pas d'Alert)
    if (!pendingUserIdRef.current) return;

    setLoading(true);

    try {
      // Crée la session finale via le token OTP
      const session = await account.createSession(pendingUserIdRef.current, code);
      const user    = await account.get();

      // Charge le profil
      let profileData = await getProfileById(user.$id);

      // S'il n'existe pas encore (cas inscription), le créer
      if (!profileData) {
        profileData = await createProfile(user.$id, user.email, null);
      }

      // Mise à jour du bundle X3DH
      try {
        const bundle = await getIdentityBundle();
        await updateProfile(user.$id, {
          identity_key:      bundle.identityKey,
          signed_pre_key:    bundle.signedPreKey,
          signed_pre_key_id: bundle.signedPreKeyId,
          public_key:        bundle.identityKey,
        });
        if (profileData) {
          profileData = {
            ...profileData,
            identity_key:      bundle.identityKey,
            signed_pre_key:    bundle.signedPreKey,
            signed_pre_key_id: bundle.signedPreKeyId,
            public_key:        bundle.identityKey,
          };
        }
      } catch (e) {
        console.warn('[login] X3DH bundle error', e);
      }

      setUser(user);
      if (profileData) {
        setProfile(profileData);
        setNeedsUsername(!profileData.username);
      }
    } catch (e: any) {
      Alert.alert('Code incorrect', 'Vérifie le code reçu par email.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }

    setLoading(false);
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;

    // Gestion du copier-coller : si la valeur collée fait 6 chiffres, on remplit tout
    if (value.length >= 6) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (digits.length === 6) {
        setOtp(digits);
        otpRefs.current[5]?.focus();
        setTimeout(verifyOtp, 150);
        return;
      }
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '')) {
      setTimeout(verifyOtp, 150);
    }
  }

  function handleOtpKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function resetToCredentials() {
    setStep('credentials');
    setOtp(['', '', '', '', '', '']);
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  }

  // ══════════════════════════════════════════════════════════
  // RENDU — Étape 1 : email + mot de passe
  // ══════════════════════════════════════════════════════════
  if (step === 'credentials') return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logo}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>💞</Text>
          </View>
          <Text style={styles.logoText}>À Deux</Text>
          <Text style={styles.logoSub}>Connexion privée & chiffrée</Text>
        </View>

        {/* Onglets login / register */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
              Connexion
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
              S'inscrire
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            style={styles.input}
            placeholder="mon@email.com"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {/* Mot de passe */}
          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={mode === 'register' ? 'Minimum 8 caractères' : '••••••••'}
              placeholderTextColor="#444"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass(!showPass)}
            >
              <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.spacer} />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleCredentials}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>
                  {mode === 'register' ? 'Créer mon compte →' : 'Continuer →'}
                </Text>
            }
          </TouchableOpacity>

          <View style={styles.twoFaHint}>
            <Text style={styles.twoFaHintText}>
              🔒 Un code de vérification sera envoyé à ton adresse email.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ══════════════════════════════════════════════════════════
  // RENDU — Étape 2 : saisie du code email OTP
  // ══════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.scroll}>
        <View style={styles.logo}>
          <View style={[styles.logoIcon, { backgroundColor: '#1a1a2e' }]}>
            <Text style={styles.logoEmoji}>📧</Text>
          </View>
          <Text style={styles.logoText}>Double vérification</Text>
          <Text style={styles.logoSub}>Confirme ton identité par email</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.otpTitle}>Code de vérification</Text>
          <Text style={styles.otpDesc}>
            Un email a été envoyé à{'\n'}
            <Text style={styles.phoneHighlight}>{email}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { otpRefs.current[i] = r; }}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={(e) => handleOtpKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          {loading && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator color="#e879a0" size="small" />
              <Text style={styles.verifyingText}>Vérification en cours...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (loading || otp.join('').length < 6) && styles.btnDisabled]}
            onPress={verifyOtp}
            disabled={loading || otp.join('').length < 6}
          >
            <Text style={styles.btnText}>Confirmer le code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={() => sendEmailOtp(email.trim().toLowerCase())}
            disabled={countdown > 0 || loading}
          >
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : '🔄 Renvoyer le code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resetToCredentials}>
            <Text style={styles.back}>← Retour</Text>
          </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: DEEP },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  logo: { alignItems: 'center', marginBottom: 36 },
  logoIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#1e0a1e',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  logoText: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  logoSub: { fontSize: 13, color: '#555', marginTop: 4 },

  tabs: {
    flexDirection: 'row', backgroundColor: CARD,
    borderRadius: 14, padding: 4, marginBottom: 20,
    borderWidth: 1, borderColor: BORDER,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: ROSE },
  tabText: { color: '#555', fontWeight: '700', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  card: { backgroundColor: CARD, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: BORDER },

  label: { fontSize: 11, color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input: {
    backgroundColor: DEEP, borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 15, borderWidth: 1, borderColor: BORDER, marginBottom: 16,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  eyeBtn: { paddingHorizontal: 12 },
  eyeIcon: { fontSize: 18 },
  spacer: { height: 0 },

  btn: {
    backgroundColor: ROSE, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.35 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  twoFaHint: {
    marginTop: 16, padding: 12, backgroundColor: '#0a0a1a',
    borderRadius: 10, borderWidth: 1, borderColor: '#1a1a30',
  },
  twoFaHintText: { color: '#555', fontSize: 12, lineHeight: 18, textAlign: 'center' },

  otpTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  otpDesc: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  phoneHighlight: { color: ROSE, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  otpBox: {
    flex: 1, height: 56, borderRadius: 12, borderWidth: 2,
    borderColor: BORDER, backgroundColor: DEEP,
    color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center',
  },
  otpBoxFilled: { borderColor: ROSE, backgroundColor: '#1a0a1a' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  verifyingText: { color: ROSE, fontSize: 13 },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { color: ROSE, fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: '#333' },
  back: { color: '#444', textAlign: 'center', marginTop: 12, fontSize: 13 },
});
