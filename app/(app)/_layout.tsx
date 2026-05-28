import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';

export default function AppLayout() {
  const { profile, needsUsername } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (needsUsername) {
      router.replace('/(auth)/setup-username');
      return;
    }
    // Si pas de partenaire → rester sur home (pas de tabs)
  }, [needsUsername, profile?.partner_id]);

  // Si pas de partenaire → afficher uniquement home (pas de barre d'onglets)
  if (!profile?.partner_id) {
    return null; // home.tsx est affiché directement sans tabs
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d18',
          borderTopColor: '#1e1e30',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#e879a0',
        tabBarInactiveTintColor: '#333',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analyse',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="home" options={{ href: null }} />
    </Tabs>
  );
}
