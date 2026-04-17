import { useAuth } from '@/features/auth/hooks/useAuth';
import { getQueryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

SplashScreen.preventAutoHideAsync();

const queryClient = getQueryClient();

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isRoot = !segments[0];

    if (!user && !inAuthGroup && !isRoot) {
      router.replace('/');
    } else if (user && (inAuthGroup || isRoot)) {
      router.replace('/(main)/home');
    }

    SplashScreen.hideAsync();
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070f24' }}>
        <ActivityIndicator size="large" color="#8AB4F8" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthGate />
    </QueryClientProvider>
  );
}
