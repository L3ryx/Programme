import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, Text, ScrollView, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: string | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error: error.message + '\n\n' + error.stack + '\n\n' + info.componentStack });
  }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message + '\n\n' + error.stack };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a2e', padding: 20, paddingTop: 60 }}>
          <Text style={{ color: '#e94560', fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
            💥 Erreur détectée
          </Text>
          <TouchableOpacity
            onPress={() => Clipboard.setStringAsync(this.state.error || '')}
            style={{ backgroundColor: '#e94560', padding: 10, borderRadius: 8, marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>
              📋 Copier l'erreur
            </Text>
          </TouchableOpacity>
          <ScrollView style={{ backgroundColor: '#16213e', borderRadius: 8, padding: 12 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'monospace' }}>
              {this.state.error}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/messages');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NavigationGuard>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </NavigationGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}
