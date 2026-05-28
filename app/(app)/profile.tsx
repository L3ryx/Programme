import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAppStore } from '../../src/store/appStore';

export default function ProfileScreen() {
  const { profile, partner, setProfile, setPartner, reset } = useAppStore();
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

  async function disconnectPartner() {
    Alert.alert(
      'Déconnecter le partenaire',
      'Es-tu sûr(e) ? Les messages resteront dans la base.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter', style: 'destructive',
          onPress: async () => {
            await supabase.from('profiles').update({ partner_id: null }).eq('id', profile!.id);
            setPartner(null);
          },
        },
      ]
    );
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

      {/* Avatar */}
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
              placeholderTextColor="#555"
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
        <Text style={styles.phone}>{profile?.phone}</Text>
      </View>

      {/* Section partenaire */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Partenaire 💑</Text>
        {partner ? (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>{partner.display_name[0]?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{partner.display_name}</Text>
              <Text style={styles.partnerPhone}>{partner.phone}</Text>
            </View>
            <TouchableOpacity onPress={disconnectPartner}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.hint}>Aucun partenaire connecté — va dans Messages</Text>
        )}
      </View>

      {/* Sécurité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Sécurité</Text>
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed" size={16} color="#7c3aed" />
          <Text style={styles.infoText}>Messages chiffrés avec NaCl (curve25519-xsalsa20-poly1305)</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="key" size={16} color="#7c3aed" />
          <Text style={styles.infoText}>Clés privées stockées localement (Secure Store)</Text>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={16} color="#7c3aed" />
          <Text style={styles.infoText}>APK obfusqué avec ProGuard en production</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: {
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 24 },
  avatarSection: { alignItems: 'center', padding: 32 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  phone: { color: '#555', fontSize: 14, marginTop: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    backgroundColor: '#12121a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#1e1e2e', minWidth: 150,
  },
  saveBtn: {
    backgroundColor: '#7c3aed', borderRadius: 8,
    padding: 8, alignItems: 'center', justifyContent: 'center',
  },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 },
  partnerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#12121a', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  partnerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#5b21b6', alignItems: 'center', justifyContent: 'center',
  },
  partnerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  partnerName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  partnerPhone: { color: '#555', fontSize: 13, marginTop: 2 },
  hint: { color: '#555', fontSize: 14 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#12121a', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#1e1e2e', marginBottom: 8,
  },
  infoText: { color: '#888', fontSize: 13, flex: 1, lineHeight: 18 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#12121a', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  logoutText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});
