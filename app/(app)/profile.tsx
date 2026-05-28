/**
 * profile.tsx — Écran de profil
 *
 * Affiche les infos de l'utilisateur et du partenaire lié.
 * La déconnexion du partenaire est IMPOSSIBLE (liaison permanente).
 */

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useApp } from '../../src/context/AppContext';

export default function ProfileScreen() {
  const { profile, partner, setProfile, reset } = useApp();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    if (!profile || !displayName.trim()) return;
    setSaving(true);
    const { data } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id)
      .select()
      .single();
    if (data) setProfile(data);
    setSaving(false);
    setEditing(false);
  }

  async function logout() {
    Alert.alert('Déconnexion', 'Quitter l\'application ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          reset();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Avatar & nom */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile?.display_name || '?')[0].toUpperCase()}</Text>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              placeholder="Ton prénom"
              placeholderTextColor="#444"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
            <Text style={styles.name}>{profile?.display_name}</Text>
            <Ionicons name="pencil" size={14} color="#555" />
          </TouchableOpacity>
        )}

        <Text style={styles.usernameTag}>@{profile?.username}</Text>
        <Text style={styles.emailText}>{profile?.email || profile?.phone}</Text>
      </View>

      {/* Partenaire lié */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partenaire 💑</Text>
        {partner ? (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>
                {(partner.display_name || partner.username)[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{partner.display_name}</Text>
              <Text style={styles.partnerUsername}>@{partner.username}</Text>
            </View>
            {/* Pas de bouton de déconnexion — liaison permanente */}
            <View style={styles.lockedBadge}>
              <Ionicons name="lock-closed" size={14} color="#e879a0" />
              <Text style={styles.lockedText}>Lié(e)</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.hint}>Aucun partenaire connecté</Text>
        )}

        {partner && (
          <View style={styles.permanentNote}>
            <Ionicons name="infinite" size={14} color="#555" />
            <Text style={styles.permanentNoteText}>
              La liaison est permanente et ne peut pas être annulée.
            </Text>
          </View>
        )}
      </View>

      {/* Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Sécurité</Text>
        <InfoRow icon="mail" text={`Email : ${profile?.email || '—'}`} />
        <InfoRow icon="lock-closed" text="Chiffrement Double Ratchet (E2E)" />
        <InfoRow icon="key" text="Clés privées stockées localement (Secure Store)" />
        <InfoRow icon="shield-checkmark" text="Double authentification SMS activée" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={15} color="#e879a0" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const ROSE = '#e879a0';
const DEEP = '#0d0d18';
const CARD = '#13131f';
const BORDER = '#1e1e30';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DEEP },
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarSection: { alignItems: 'center', padding: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  usernameTag: { color: ROSE, fontSize: 15, fontWeight: '700', marginTop: 2 },
  emailText: { color: '#555', fontSize: 13, marginTop: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    backgroundColor: CARD, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: BORDER, minWidth: 150,
  },
  saveBtn: {
    backgroundColor: ROSE, borderRadius: 8,
    padding: 8, alignItems: 'center', justifyContent: 'center',
  },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 },
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: CARD, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  partnerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#5b0a2e', alignItems: 'center', justifyContent: 'center',
  },
  partnerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  partnerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  partnerUsername: { color: ROSE, fontSize: 12, marginTop: 2 },
  lockedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { color: ROSE, fontSize: 12, fontWeight: '700' },
  permanentNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, paddingHorizontal: 4,
  },
  permanentNoteText: { color: '#444', fontSize: 12 },
  hint: { color: '#555', fontSize: 14 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: CARD, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
  },
  infoText: { color: '#888', fontSize: 13, flex: 1, lineHeight: 18 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8,
    backgroundColor: CARD, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: BORDER,
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
