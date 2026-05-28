/**
 * chat.tsx — Écran de messagerie
 *
 * Les messages sont stockés UNIQUEMENT en local (SQLite via localDb.ts).
 * Supabase = transit éphémère. Aucune persistance serveur.
 * Chiffrement Double Ratchet avec PFS à chaque message.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useApp } from '../../src/context/AppContext';
import {
  sendMessage,
  subscribeToMessages,
  getMessages,
} from '../../src/lib/messaging';
import { getIdentityBundle, rotateSignedPreKey } from '../../src/lib/crypto';
import { scheduleLocalNotification } from '../../src/lib/notifications';
import { LocalMessage, markRead } from '../../src/lib/localDb';

const KEY_ROTATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const LAST_KEY_ROTATION_KEY     = 'last_key_rotation';

export default function ChatScreen() {
  const { profile, partner, setPartner } = useApp();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [partnerPhone, setPartnerPhone] = useState('');
  const flatRef = useRef<FlatList>(null);

  // ── Rotation des clés (Signed PreKey) ─────────────────────
  useEffect(() => {
    async function maybeRotateKey() {
      if (!profile) return;
      try {
        const raw = await import('expo-secure-store').then(m =>
          m.getItemAsync(LAST_KEY_ROTATION_KEY)
        );
        const last = raw ? Number(raw) : 0;
        if (Date.now() - last > KEY_ROTATION_INTERVAL_MS) {
          const { publicKey, id } = await rotateSignedPreKey();
          await supabase
            .from('profiles')
            .update({ signed_pre_key: publicKey, signed_pre_key_id: id })
            .eq('id', profile.id);
          await import('expo-secure-store').then(m =>
            m.setItemAsync(LAST_KEY_ROTATION_KEY, String(Date.now()))
          );
        }
      } catch {}
    }
    maybeRotateKey();
  }, [profile?.id]);

  // ── Chargement du partenaire ───────────────────────────────
  useEffect(() => {
    if (!profile?.partner_id) { setLoading(false); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.partner_id)
      .single()
      .then(({ data }) => {
        if (data) setPartner(data);
        setLoading(false);
      });
  }, [profile?.partner_id]);

  // ── Chargement de l'historique local ──────────────────────
  useEffect(() => {
    if (!partner) return;
    getMessages(partner.id).then(setMessages);
  }, [partner?.id]);

  // ── Abonnement temps réel ──────────────────────────────────
  useEffect(() => {
    if (!profile || !partner) return;

    const unsub = subscribeToMessages(
      profile.id,
      partner,
      { identityKey: profile.identity_key },
      (msg) => {
        setMessages(prev => [...prev, msg]);
        scheduleLocalNotification(partner.display_name, msg.plaintext);
        flatRef.current?.scrollToEnd({ animated: true });
      }
    );

    return unsub;
  }, [profile?.id, partner?.id]);

  // ── Envoi ──────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!text.trim() || !profile || !partner) return;
    setSending(true);

    const msg = await sendMessage(text.trim(), profile.id, partner);
    if (msg) {
      setMessages(prev => [...prev, msg]);
      setText('');
      flatRef.current?.scrollToEnd({ animated: true });
    }
    setSending(false);
  }, [text, profile, partner]);

  // ── Connexion partenaire ───────────────────────────────────
  async function connectPartner() {
    if (!partnerPhone) return;
    const cleaned = partnerPhone.replace(/\D/g, '');
    const phone   = cleaned.startsWith('0') ? '+33' + cleaned.slice(1) : '+' + cleaned;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .single();
    if (!data) return alert('Numéro introuvable');
    await supabase
      .from('profiles')
      .update({ partner_id: data.id })
      .eq('id', profile!.id);
    setPartner(data);
  }

  // ── Marquer les messages comme lus ────────────────────────
  useEffect(() => {
    if (!partner || !profile) return;
    messages
      .filter(m => m.sender_id === partner.id && !m.read_at)
      .forEach(m => markRead(m.id));
  }, [messages.length]);

  // ── Rendu ──────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages 🔒</Text>
        </View>
        <View style={styles.noPartner}>
          <Text style={styles.noPartnerIcon}>💑</Text>
          <Text style={styles.noPartnerTitle}>Connecte ton partenaire</Text>
          <Text style={styles.noPartnerSub}>
            Entre son numéro pour commencer à chatter de façon sécurisée
          </Text>
          <TextInput
            style={styles.input}
            placeholder="+33 6 12 34 56 78"
            placeholderTextColor="#555"
            value={partnerPhone}
            onChangeText={setPartnerPhone}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.connectBtn} onPress={connectPartner}>
            <Text style={styles.connectBtnText}>Connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {partner.display_name[0]?.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{partner.display_name}</Text>
          <Text style={styles.headerSub}>🔒 Double Ratchet · Clés locales</Text>
        </View>
      </View>

      {/* Liste des messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === profile?.id;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.plaintext}
              </Text>
              <View style={styles.bubbleMeta}>
                <Text style={styles.bubbleTime}>
                  {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
                {isMe && (
                  <Text style={styles.deliveryIcon}>
                    {item.delivered ? '✓✓' : '✓'}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Zone de saisie */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="send" size={20} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerTitle:      { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerSub:        { color: '#555', fontSize: 11, marginTop: 2 },
  messageList:      { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bubble: {
    maxWidth: '80%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe:        { alignSelf: 'flex-end',   backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  bubbleThem:      { alignSelf: 'flex-start', backgroundColor: '#1e1e2e', borderBottomLeftRadius: 4 },
  bubbleText:      { fontSize: 15, lineHeight: 20 },
  bubbleTextMe:    { color: '#fff' },
  bubbleTextThem:  { color: '#e0e0e0' },
  bubbleMeta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 4, marginTop: 4,
  },
  bubbleTime:     { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  deliveryIcon:   { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#12121a', borderTopWidth: 1, borderTopColor: '#1e1e2e',
  },
  textInput: {
    flex: 1, backgroundColor: '#0a0a0f', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  noPartner:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noPartnerIcon:   { fontSize: 56, marginBottom: 16 },
  noPartnerTitle:  { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  noPartnerSub:    { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  input: {
    width: '100%', backgroundColor: '#12121a', borderRadius: 12,
    padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#1e1e2e',
  },
  connectBtn: {
    backgroundColor: '#7c3aed', borderRadius: 12, padding: 16,
    alignItems: 'center', width: '100%', marginTop: 12,
  },
  connectBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
