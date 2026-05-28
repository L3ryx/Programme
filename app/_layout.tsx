import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/appStore';
import { registerForPushNotifications, savePushToken } from '../src/lib/notifications';
import { getOrCreateKeyPair } from '../src/lib/crypto';

export default function RootLayout() {
  const { session, setSession, setProfile } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        // Charger le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) setProfile(profile);

        // Enregistrer les clés et les push tokens
        try {
          const { publicKey } = await getOrCreateKeyPair();
          await supabase.from('profiles').update({ public_key: publicKey }).eq('id', session.user.id);

          const token = await registerForPushNotifications();
          if (token) await savePushToken(session.user.id, token);
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirection auth
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(app)/chat');
    }
  }, [session, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
