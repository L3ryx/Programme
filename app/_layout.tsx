/**
 * _layout.tsx — Layout racine
 *
 * Flux :
 *   1. Pas de session → /(auth)/login
 *   2. Session + pas de username → /(auth)/setup-username
 *   3. Session + username + pas de partenaire → /(app)/home
 *   4. Session + username + partenaire → /(app)/chat
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { AppProvider, useApp } from '../src/context/AppContext';
import { registerForPushNotifications, savePushToken } from '../src/lib/notifications';
import { getIdentityBundle } from '../src/lib/crypto';

function RootNav() {
  const { session, profile, needsUsername, setSession, setProfile, setNeedsUsername } = useApp();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData);
            setNeedsUsername(!profileData.username);
          }

          try {
            const bundle = await getIdentityBundle();
            await supabase.from('profiles').update({
              identity_key:      bundle.identityKey,
              signed_pre_key:    bundle.signedPreKey,
              signed_pre_key_id: bundle.signedPreKeyId,
              public_key:        bundle.identityKey,
            }).eq('id', session.user.id);
          } catch (e) {
            console.warn('[layout] X3DH bundle error', e);
          }

          try {
            const token = await registerForPushNotifications();
            if (token) await savePushToken(session.user.id, token);
          } catch {}
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && inAuthGroup) {
      if (needsUsername) {
        router.replace('/(auth)/setup-username');
      } else if (profile?.partner_id) {
        router.replace('/(app)/chat');
      } else {
        router.replace('/(app)/home');
      }
      return;
    }

    if (session && !inAuthGroup && needsUsername) {
      router.replace('/(auth)/setup-username');
    }
  }, [session, needsUsername, profile?.partner_id, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootNav />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
