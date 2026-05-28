/**
 * _layout.tsx — Layout racine
 *
 * Modifications vs version originale :
 *   - Publie le bundle X3DH complet (identity_key + signed_pre_key)
 *     sur Supabase au login, au lieu de la simple public_key NaCl box.
 *   - Gère l'authentification et la redirection comme avant.
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../src/lib/supabase';
import { useAppStore } from '../src/store/appStore';
import { registerForPushNotifications, savePushToken } from '../src/lib/notifications';
import { getIdentityBundle, rotateSignedPreKey } from '../src/lib/crypto';

export default function RootLayout() {
  const { session, setSession, setProfile } = useAppStore();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    // Récupère la session au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          // Charger le profil
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) setProfile(profile);

          // Publier le bundle X3DH complet sur le profil
          try {
            const bundle = await getIdentityBundle();
            await supabase
              .from('profiles')
              .update({
                identity_key:      bundle.identityKey,
                signed_pre_key:    bundle.signedPreKey,
                signed_pre_key_id: bundle.signedPreKeyId,
                // Legacy : on garde public_key pour compatibilité
                public_key:        bundle.identityKey,
              })
              .eq('id', session.user.id);
          } catch (e) {
            console.warn('[layout] Impossible de publier le bundle X3DH', e);
          }

          // Enregistrement des push notifications
          try {
            const token = await registerForPushNotifications();
            if (token) await savePushToken(session.user.id, token);
          } catch {}
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Redirection selon état d'authentification
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
