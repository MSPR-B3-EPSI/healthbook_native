import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';

function RouteGuard() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const root = segments[0] as string | undefined;
    const inAuthGroup = root === '(auth)';
    const inAppGroup = root === '(app)';
    const atRoot = root === undefined;

    if (status === 'authenticated' && (inAuthGroup || atRoot)) {
      router.replace('/(app)');
    } else if (status === 'unauthenticated' && (inAppGroup || atRoot)) {
      router.replace('/(auth)/login');
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F5F5' },
        animation: 'slide_from_right',
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RouteGuard />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
