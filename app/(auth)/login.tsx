import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('phone');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function sendOtp() {
    if (!phone.trim()) return Alert.alert('Erreur', 'Entre ton numéro de téléphone');
    setLoading(true);
    const formattedPhone = formatPhone(phone);
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setStep('otp');
      startCountdown(60);
    }
    setLoading(false);
  }

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
    } else if (data.session) {
      // Créer profil si nouveau compte
      await supabase.from('profiles').upsert({
        id: data.session.user.id,
        phone: formattedPhone,
        display_name: formattedPhone,
        public_key: '',
        avatar_url: null,
        partner_id: null,
      }, { onConflict: 'id', ignoreDuplicates: true });
      // La session est détectée automatiquement par le listener dans _layout.tsx
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

  function resetToPhone() {
    setStep('phone');
    setOtp(['', '', '', '', '', '']);
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  }

  // ── Étape 1 : numéro de téléphone ───────────────────────────
  if (step === 'phone') return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🔒</Text>
          <Text style={styles.logoText}>Connect</Text>
          <Text style={styles.logoSub}>Messages chiffrés de bout en bout</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </Text>
          <Text style={styles.desc}>
            Entre ton numéro — on t'envoie un code de vérification par SMS.
          </Text>

          <Text style={styles.label}>Numéro de téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor="#555"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="done"
            onSubmitEditing={sendOtp}
          />

          <TouchableOpacity style={styles.btn} onPress={sendOtp} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>📱 Recevoir le code SMS</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Pas de compte ? S'inscrire"
                : 'Déjà un compte ? Connexion'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // ── Étape 2 : saisie OTP ─────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>📱</Text>
          <Text style={styles.logoText}>Vérification</Text>
          <Text style={styles.logoSub}>Code envoyé par SMS</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Entre le code</Text>
          <Text style={styles.desc}>
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
              <ActivityIndicator color="#7c3aed" size="small" />
              <Text style={styles.verifyingText}>Vérification...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, (loading || otp.join('').length < 6) && styles.btnDisabled]}
            onPress={verifyOtp}
            disabled={loading || otp.join('').length < 6}
          >
            <Text style={styles.btnText}>Confirmer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={sendOtp}
            disabled={countdown > 0 || loading}
          >
            <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
              {countdown > 0
                ? `Renvoyer le code dans ${countdown}s`
                : '🔄 Renvoyer le code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resetToPhone}>
            <Text style={styles.back}>← Modifier le numéro</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoIcon: { fontSize: 48 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 2, marginTop: 8 },
  logoSub: { fontSize: 12, color: '#555', marginTop: 4, letterSpacing: 1 },
  card: {
    backgroundColor: '#12121a', borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: '#1e1e2e',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  desc: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  phoneHighlight: { color: '#7c3aed', fontWeight: '700' },
  label: {
    fontSize: 12, color: '#888', marginBottom: 6,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0a0a0f', borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#1e1e2e', marginBottom: 16,
  },
  btn: {
    backgroundColor: '#7c3aed', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { color: '#7c3aed', textAlign: 'center', marginTop: 16, fontSize: 14 },
  // OTP
  otpRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 24, gap: 8,
  },
  otpBox: {
    flex: 1, height: 58, borderRadius: 12, borderWidth: 2,
    borderColor: '#1e1e2e', backgroundColor: '#0a0a0f',
    color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center',
  },
  otpBoxFilled: { borderColor: '#7c3aed', backgroundColor: '#1a0a2e' },
  verifyingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 12,
  },
  verifyingText: { color: '#7c3aed', fontSize: 13 },
  resendBtn: { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#7c3aed', fontSize: 14, fontWeight: '600' },
  resendDisabled: { color: '#444' },
  back: { color: '#555', textAlign: 'center', marginTop: 12, fontSize: 13 },
});
