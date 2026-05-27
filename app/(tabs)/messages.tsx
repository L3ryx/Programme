import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Animated
} from 'react-native';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, limit, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { encryptMessage, decryptMessage } from '../../utils/encryption';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: any;
  encrypted: boolean;
  read: boolean;
  reaction?: string;
}

const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏'];
const CONVERSATION_ID = 'alex-camille-main';

export default function MessagesScreen() {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Subscribe to messages
  useEffect(() => {
    const q = query(
      collection(db, 'conversations', CONVERSATION_ID, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.encrypted ? decryptMessage(data.text) : data.text,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          encrypted: data.encrypted,
          read: data.read || false,
          reaction: data.reaction,
        };
      });
      setMessages(msgs);
      setLoading(false);

      // Mark incoming messages as read
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.senderId !== user?.uid && !data.read) {
          updateDoc(doc(db, 'conversations', CONVERSATION_ID, 'messages', d.id), { read: true });
        }
      });
    });

    return unsubscribe;
  }, [user]);

  // Listen for partner typing indicator
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'conversations', CONVERSATION_ID),
      (snap) => {
        const data = snap.data();
        if (data?.typingUid && data.typingUid !== user?.uid) {
          setPartnerTyping(true);
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        } else {
          setPartnerTyping(false);
        }
      }
    );
    return unsubscribe;
  }, [user]);

  // Send typing indicator
  const handleTyping = useCallback((text: string) => {
    setInputText(text);
    if (text.length > 0) {
      updateDoc(doc(db, 'conversations', CONVERSATION_ID), { typingUid: user?.uid }).catch(() => {});
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        updateDoc(doc(db, 'conversations', CONVERSATION_ID), { typingUid: null }).catch(() => {});
      }, 2000);
    } else {
      updateDoc(doc(db, 'conversations', CONVERSATION_ID), { typingUid: null }).catch(() => {});
    }
  }, [user]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !user || !userProfile) return;
    setSending(true);
    setInputText('');
    try {
      const encrypted = encryptMessage(text);
      await addDoc(collection(db, 'conversations', CONVERSATION_ID, 'messages'), {
        text: encrypted,
        senderId: user.uid,
        senderName: userProfile.displayName,
        timestamp: serverTimestamp(),
        encrypted: true,
        read: false,
      });
      // Clear typing
      updateDoc(doc(db, 'conversations', CONVERSATION_ID), { typingUid: null }).catch(() => {});
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert('Erreur', 'Message non envoyé. Vérifiez votre connexion.');
    } finally {
      setSending(false);
    }
  };

  const addReaction = async (msgId: string, emoji: string) => {
    try {
      await updateDoc(doc(db, 'conversations', CONVERSATION_ID, 'messages', msgId), { reaction: emoji });
      setSelectedMsg(null);
    } catch {}
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    const time = item.timestamp?.toDate
      ? item.timestamp.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => setSelectedMsg(selectedMsg === item.id ? null : item.id)}
        style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}
      >
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubblePartner]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
          <View style={styles.msgMeta}>
            <Text style={styles.encryptedTag}>🔒</Text>
            <Text style={styles.msgTime}>{time}</Text>
            {isMe && (
              <Text style={styles.readStatus}>{item.read ? '✓✓' : '✓'}</Text>
            )}
          </View>
          {item.reaction && (
            <View style={styles.reactionBadge}>
              <Text style={styles.reactionText}>{item.reaction}</Text>
            </View>
          )}
        </View>

        {/* Reaction picker */}
        {selectedMsg === item.id && (
          <View style={[styles.reactionPicker, isMe ? styles.reactionPickerRight : styles.reactionPickerLeft]}>
            {REACTIONS.map((emoji) => (
              <TouchableOpacity key={emoji} onPress={() => addReaction(item.id, emoji)} style={styles.reactionOption}>
                <Text style={styles.reactionOptionText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Connexion sécurisée...</Text>
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>💑</Text>
          <View>
            <Text style={styles.headerTitle}>Alex & Camille</Text>
            <View style={styles.headerStatusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerStatus}>Chiffré · Privé</Text>
            </View>
          </View>
        </View>
        <View style={styles.encryptBadgeSmall}>
          <Text style={styles.encryptBadgeText}>🔒 AES-256</Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💌</Text>
            <Text style={styles.emptyTitle}>Votre espace privé</Text>
            <Text style={styles.emptySubtitle}>Tous vos messages sont chiffrés end-to-end. Commencez à écrire !</Text>
          </View>
        }
      />

      {/* Typing indicator */}
      {partnerTyping && (
        <Animated.View style={[styles.typingRow, { opacity: fadeAnim }]}>
          <Text style={styles.typingText}>✏️ est en train d'écrire...</Text>
        </Animated.View>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message chiffré..."
          placeholderTextColor="#555"
          value={inputText}
          onChangeText={handleTyping}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  loadingContainer: { flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#888', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#16213e', paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#0f3460',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji: { fontSize: 32 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4caf50' },
  headerStatus: { color: '#4caf50', fontSize: 11, fontWeight: '600' },
  encryptBadgeSmall: {
    backgroundColor: '#0d2b0d', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#1a4d1a',
  },
  encryptBadgeText: { color: '#4caf50', fontSize: 11, fontWeight: '700' },

  messageList: { padding: 12, paddingBottom: 8 },

  msgRow: { marginBottom: 4, maxWidth: '80%' },
  msgRowLeft: { alignSelf: 'flex-start' },
  msgRowRight: { alignSelf: 'flex-end' },

  bubble: {
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleMe: {
    backgroundColor: '#e94560', borderColor: '#c73452',
    borderBottomRightRadius: 4,
  },
  bubblePartner: {
    backgroundColor: '#16213e', borderColor: '#0f3460',
    borderBottomLeftRadius: 4,
  },
  senderName: { color: '#e94560', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  msgText: { color: '#ddd', fontSize: 15, lineHeight: 21 },
  msgTextMe: { color: '#fff' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  encryptedTag: { fontSize: 9 },
  msgTime: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  readStatus: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' },

  reactionBadge: {
    position: 'absolute', bottom: -10, right: 6,
    backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: '#0f3460',
  },
  reactionText: { fontSize: 14 },

  reactionPicker: {
    flexDirection: 'row', backgroundColor: '#0f3460', borderRadius: 24,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 4, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
    elevation: 5,
  },
  reactionPickerRight: { alignSelf: 'flex-end' },
  reactionPickerLeft: { alignSelf: 'flex-start' },
  reactionOption: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  reactionOptionText: { fontSize: 22 },

  typingRow: { paddingHorizontal: 16, paddingVertical: 6 },
  typingText: { color: '#888', fontSize: 12, fontStyle: 'italic' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#16213e', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: '#0f3460',
  },
  input: {
    flex: 1, backgroundColor: '#1a1a2e', borderRadius: 22, paddingHorizontal: 16,
    paddingVertical: 10, color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: '#0f3460', maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#e94560', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#4a2030', opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: -2 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptySubtitle: { color: '#666', fontSize: 13, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});
