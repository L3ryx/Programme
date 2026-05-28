import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAppStore } from '../../src/store/appStore';
import { encryptMessage, decryptMessage } from '../../src/lib/crypto';
import { scheduleLocalNotification } from '../../src/lib/notifications';

export default function ChatScreen() {
  const { profile, partner, setPartner, messages, setMessages, addMessage, updateMessageDecrypted } = useAppStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerPhone, setPartnerPhone] = useState('');
  const flatRef = useRef<FlatList>(null);

  // Charger le partenaire
  useEffect(() => {
    if (!profile?.partner_id) { setLoading(false); return; }
    supabase.from('profiles').select('*').eq('id', profile.partner_id).single()
      .then(({ data }) => { if (data) setPartner(data); setLoading(false); });
  }, [profile?.partner_id]);

  // Charger les messages existants
  useEffect(() => {
    if (!profile || !partner) return;
    supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${profile.id})`)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(async ({ data }) => {
        if (!data) return;
        setMessages(data);
        // Déchiffrer tous les messages
        for (const msg of data) {
          const senderKey = msg.sender_id === profile.id ? profile.public_key : partner.public_key;
          const decrypted = await decryptMessage(msg.encrypted_content, msg.nonce, senderKey);
          if (decrypted) updateMessageDecrypted(msg.id, decrypted);
        }
      });
  }, [profile?.id, partner?.id]);

  // Temps réel
  useEffect(() => {
    if (!profile || !partner) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${profile.id}`,
      }, async (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== partner.id) return;
        addMessage(msg);
        const decrypted = await decryptMessage(msg.encrypted_content, msg.nonce, partner.public_key);
        if (decrypted) {
          updateMessageDecrypted(msg.id, decrypted);
          scheduleLocalNotification(partner.display_name, decrypted);
        }
        flatRef.current?.scrollToEnd({ animated: true });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, partner?.id]);

  const sendMessage = useCallback(async () => {
    if (!text.trim() || !profile || !partner) return;
    setSending(true);
    const result = await encryptMessage(text.trim(), partner.public_key);
    if (!result) { setSending(false); return; }

    const { data, error } = await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partner.id,
      encrypted_content: result.encrypted,
      nonce: result.nonce,
    }).select().single();

    if (!error && data) {
      addMessage({ ...data, decrypted_content: text.trim() });
      setText('');
      flatRef.current?.scrollToEnd({ animated: true });
    }
    setSending(false);
  }, [text, profile, partner]);

  async function connectPartner() {
    if (!partnerPhone) return;
    const formatted = partnerPhone.replace(/\D/g, '');
    const phone = formatted.startsWith('0') ? '+33' + formatted.slice(1) : '+' + formatted;
    const { data } = await supabase.from('profiles').select('*').eq('phone', phone).single();
    if (!data) return alert('Numéro introuvable');
    await supabase.from('profiles').update({ partner_id: data.id }).eq('id', profile!.id);
    setPartner(data);
  }

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color="#7c3aed" size="large" />
    </View>
  );

  if (!partner) return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>Messages 🔒</Text></View>
      <View style={styles.noPartner}>
        <Text style={styles.noPartnerIcon}>💑</Text>
        <Text style={styles.noPartnerTitle}>Connecte ton partenaire</Text>
        <Text style={styles.noPartnerSub}>Entre son numéro pour commencer à chatter de façon sécurisée</Text>
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

  const myMessages = messages.filter(
    (m) => (m.sender_id === profile?.id && m.receiver_id === partner.id) ||
            (m.sender_id === partner.id && m.receiver_id === profile?.id)
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{partner.display_name[0]?.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{partner.display_name}</Text>
          <Text style={styles.headerSub}>🔒 Chiffré de bout en bout</Text>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={myMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const isMe = item.sender_id === profile?.id;
          return (
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.decrypted_content ?? '🔒 Déchiffrement...'}
              </Text>
              <Text style={styles.bubbleTime}>
                {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Message..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
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
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 17 },
  headerSub: { color: '#555', fontSize: 11, marginTop: 2 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bubble: {
    maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#7c3aed', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#1e1e2e', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#e0e0e0' },
  bubbleTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#12121a', borderTopWidth: 1, borderTopColor: '#1e1e2e',
  },
  textInput: {
    flex: 1, backgroundColor: '#0a0a0f', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 120,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  noPartner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noPartnerIcon: { fontSize: 56, marginBottom: 16 },
  noPartnerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  noPartnerSub: { color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
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
