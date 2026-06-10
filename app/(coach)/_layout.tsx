import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { UniverseErrorBoundary } from '@/components/UniverseErrorBoundary';
import { CoachProvider } from '@/features/coach/CoachProvider';

/**
 * Univers HealthAI (coach). Le CoachProvider porte le profil onboarding
 * (SecureStore), le brouillon des 4 étapes et le programme hebdo généré —
 * partagés entre l'onboarding et les tabs d'accueil.
 */
export default function CoachLayout() {
  return (
    <CoachProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#F5F5F5' },
          animation: 'slide_from_right',
        }}
      />
    </CoachProvider>
  );
}

// Isole HealthAI : un crash ici n'affecte ni le hub ni HealthBook.
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <UniverseErrorBoundary {...props} universe="HealthAI" />;
}
