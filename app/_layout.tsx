/**
 * _layout.tsx — Layout racine
 *
 * Flux :
 *   1. Pas d'utilisateur → /(auth)/login
 *   2. Utilisateur + pas de username → /(auth)/setup-username
 *   3. Utilisateur + username + pas de partenaire → /(app)/home
 *   4. Utilisateur + username + partenaire → /(app)/chat
 */

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { account, getProfileById, updateProfile } from '../src/lib/appwrite';
import { AppProvider, useApp } from '../src/context/AppContext';
import { registerForPushNotifications, savePushToken } from '../src/lib/notifications';
import { getIdentityBundle } from '../src/lib/crypto';

function RootNav() {
  const { user, profile, needsUsername, setUser, setProfile, setNeedsUsername } = useApp();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    // Vérification initiale de la session Appwrite
    account.get()
      .then(async (u) => {
        setUser(u);

        const profileData = await getProfileById(u.$id);
        if (profileData) {
          setProfile(profileData);
          setNeedsUsername(!profileData.username);
        } else {
          // Profil introuvable → forcer setup username pour débloquer la navigation
          setNeedsUsername(true);
        }

        // Mise à jour du bundle X3DH en arrière-plan (ne bloque pas la navigation)
        getIdentityBundle()
          .then((bundle) =>
            updateProfile(u.$id, {
              identity_key:      bundle.identityKey,
              signed_pre_key:    bundle.signedPreKey,
              signed_pre_key_id: bundle.signedPreKeyId,
              public_key:        bundle.identityKey,
            })
          )
          .catch((e) => console.warn('[layout] X3DH bundle error', e));

        // Push token en arrière-plan (ne bloque pas la navigation)
        registerForPushNotifications()
          .then((token) => { if (token) savePushToken(u.$id, token); })
          .catch(() => {});
      })
      .catch(() => {
        // Pas de session — rester sur auth
        setUser(null);
      });
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuthGroup) {
      if (needsUsername) {
        router.replace('/(auth)/setup-username');
      } else if (profile?.partner_id) {
        router.replace('/(app)/chat');
      } else {
        router.replace('/(app)/home');
      }
      return;
    }

    if (user && !inAuthGroup && needsUsername) {
      router.replace('/(auth)/setup-username');
    }
  }, [user, needsUsername, profile?.partner_id, segments]);

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
