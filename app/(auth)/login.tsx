/**
 * login.tsx — Écran d'authentification
 *
 * Flux :
 *   INSCRIPTION : email + mot de passe → envoi SMS OTP (2FA) → vérification → onboarding username
 *   CONNEXION   : email + mot de passe → envoi SMS OTP (2FA) → vérification → app
 *
 * La double authentification SMS est obligatoire à chaque connexion.
 */

import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';

type Step = 'credentials' | 'sms-otp';
type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode]       = useState<Mode>('login');
  const [step, setStep]       = useState<Step>('credentials');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stocke temporairement le userId pour la vérification OTP
  const pendingUserIdRef = useRef<string | null>(null);

  const formatPhone = (p: string) => {
    const cleaned = p.replace(/\D/g, '');
    return cleaned.startsWith('0') ? '+33' + cleaned.slice(1) : '+' + cleaned;
  };

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
    if (mode === 'register' && !phone.trim()) return Alert.alert('Erreur', 'Entre ton numéro de téléphone pour la 2FA');

    setLoading(true);

    if (mode === 'register') {
      // Inscription : créer le compte avec email + password
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { phone: formatPhone(phone) },
        },
      });

      if (error) {
        Alert.alert('Erreur', error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        pendingUserIdRef.current = data.user.id;
        // Met à jour le profil avec le téléphone
        await supabase.from('profiles').update({
          phone: formatPhone(phone),
          email: email.trim().toLowerCase(),
        }).eq('id', data.user.id);

        // Envoie le SMS OTP
        await sendSmsOtp(formatPhone(phone));
      }

    } else {
      // Connexion : vérifier email + password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert('Identifiants incorrects', 'Vérifie ton email et ton mot de passe.');
        setLoading(false);
        return;
      }

      if (data.user) {
        pendingUserIdRef.current = data.user.id;

        // Récupérer le téléphone depuis le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', data.user.id)
          .single();

        const userPhone = profile?.phone || '';
        if (!userPhone) {
          Alert.alert('Erreur', 'Aucun numéro de téléphone associé à ce compte. Contacte le support.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Déconnecte temporairement — la session sera créée APRÈS la 2FA
        await supabase.auth.signOut();
        await sendSmsOtp(userPhone);
        setPhone(userPhone);
      }
    }

    setLoading(false);
  }

  async function sendSmsOtp(formattedPhone: string) {
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) {
      Alert.alert('Erreur SMS', error.message);
      return;
    }
    setStep('sms-otp');
    startCountdown(60);
  }

  // ── Étape 2 : vérification SMS OTP ──────────────────────────
  async function verifyOtp() {
    const code = otp.join('');
    if (code.length < 6) return Alert.alert('Erreur', 'Entre le code à 6 chiffres');
    setLoading(true);

    const formattedPhone = formatPhone(phone);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: code,
      type: 'sms',
    });

    if (error) {
      Alert.alert('Code incorrect', 'Vérifie le code reçu par SMS.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setLoading(false);
      return;
    }

    if (data.session) {
      // Pour une inscription : mettre à jour l'email dans le profil
      if (mode === 'register') {
        await supabase.from('profiles').update({
          email: email.trim().toLowerCase(),
          phone: formattedPhone,
        }).eq('id', data.session.user.id);
      }
      // La session est détectée par le listener dans _layout.tsx
    }
    setLoading(false);
  }

  function handleOtpChange(value: string, index: number) {
    if (!/^\d*$/.test(value)) return;
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
  // RENDU — Étape 1 : email + mot de passe (+ téléphone si inscription)
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

          {/* Téléphone (seulement à l'inscription) */}
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Numéro de téléphone (pour la 2FA)</Text>
              <TextInput
                style={styles.input}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor="#444"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  🔐 Un code SMS sera envoyé à chaque connexion pour vérifier ton identité.
                </Text>
              </View>
            </>
          )}

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

          {mode === 'login' && (
            <View style={styles.twoFaHint}>
              <Text style={styles.twoFaHintText}>
                🔒 Après vérification, un SMS de confirmation sera envoyé sur ton téléphone.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ══════════════════════════════════════════════════════════
  // RENDU — Étape 2 : saisie du code SMS
  // ══════════════════════════════════════════════════════════
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.scroll}>
        <View style={styles.logo}>
          <View style={[styles.logoIcon, { backgroundColor: '#1a1a2e' }]}>
            <Text style={styles.logoEmoji}>📱</Text>
          </View>
          <Text style={styles.logoText}>Double vérification</Text>
          <Text style={styles.logoSub}>Confirme ton identité par SMS</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.otpTitle}>Code de vérification</Text>
          <Text style={styles.otpDesc}>
            Un SMS a été envoyé au{'\n'}
            <Text style={styles.phoneHighlight}>{formatPhone(phone)}</Text>
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
            onPress={() => sendSmsOtp(formatPhone(phone))}
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

  infoBox: {
    backgroundColor: '#0a0a1a', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#1a1a30', marginBottom: 16,
  },
  infoText: { color: '#667', fontSize: 12, lineHeight: 18 },

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

  // OTP
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
