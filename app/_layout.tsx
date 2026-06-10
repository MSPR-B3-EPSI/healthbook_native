import '../global.css';

import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { UniverseErrorBoundary } from '@/components/UniverseErrorBoundary';

function RouteGuard() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const root = segments[0] as string | undefined;
    const inAuthGroup = root === '(auth)';
    const atRoot = root === undefined;

    // Connecté → on atterrit sur le hub (choix d'univers), pas directement sur
    // un univers. Déconnecté → login, sauf si déjà sur un écran (auth).
    if (status === 'authenticated' && (inAuthGroup || atRoot)) {
      router.replace('/(hub)');
    } else if (status === 'unauthenticated' && !inAuthGroup) {
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

// Filet de sécurité global : si le shell (providers, RouteGuard) crashe, on évite
// l'écran blanc. Volontairement sans `universe` → message générique + Réessayer.
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <UniverseErrorBoundary {...props} />;
}
