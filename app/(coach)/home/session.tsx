import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoach } from '@/features/coach/CoachProvider';
import {
  exerciseFamily,
  exerciseImageUrl,
  exerciseSummary,
  formatRest,
  sessionLabel,
  todayKey,
} from '@/features/coach/labels';
import type { ProgramExercise } from '@/features/coach/types';
import { cardShadow, floatingShadow } from '@/lib/shadows';

/** "65" → "01:05", "3725" → "1:02:05" */
function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Suivi de séance local : chronomètre + validation des exercices un à un.
 * Aucune persistance pour l'instant — le résumé s'affiche à la fin puis on
 * revient à l'accueil (l'historique attend le tracking-api).
 */
export default function SessionScreen() {
  const insets = useSafeAreaInsets();
  const { program } = useCoach();

  const session = useMemo(() => {
    const day = program?.week.find((d) => d.day_of_week === todayKey());
    return day?.sessions[0] ?? null;
  }, [program]);

  const [done, setDone] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Chronomètre basé sur l'horloge (pas de dérive si le rendu prend du retard).
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!session) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background px-6"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons name="moon-outline" size={32} color="#9AA0A6" />
        <Text className="mt-3 text-center text-lg font-bold text-text-primary">
          Aucune séance aujourd&apos;hui
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="mt-6 rounded-full bg-coach px-6 py-3"
        >
          <Text className="text-base font-bold text-white">Retour</Text>
        </Pressable>
      </View>
    );
  }

  const total = session.exos.length;
  const completed = done.size;
  const progress = total > 0 ? completed / total : 0;

  const toggle = (exo: ProgramExercise) => {
    void Haptics.selectionAsync();
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(exo.exercise_id)) next.delete(exo.exercise_id);
      else next.add(exo.exercise_id);
      return next;
    });
  };

  const onQuit = () => {
    Alert.alert('Quitter la séance ?', 'Ta progression ne sera pas conservée.', [
      { text: 'Continuer la séance', style: 'cancel' },
      { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const onFinish = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Séance terminée',
      `${completed}/${total} exercices complétés en ${formatElapsed(elapsed)}.`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      {/* En-tête : quitter, titre, chrono. */}
      <View className="flex-row items-center justify-between px-5 pb-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitter la séance"
          onPress={onQuit}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color="#1A1A1A" />
        </Pressable>
        <Text className="text-lg font-bold text-text-primary" numberOfLines={1}>
          {sessionLabel(session.session_kind)}
        </Text>
        <View className="flex-row items-center gap-1 rounded-full bg-coach-light px-3 py-1.5">
          <Ionicons name="time-outline" size={14} color="#5B2EE5" />
          <Text className="text-sm font-bold tabular-nums text-coach">
            {formatElapsed(elapsed)}
          </Text>
        </View>
      </View>

      {/* Progression */}
      <View className="px-5 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Progression
          </Text>
          <Text className="text-xs font-bold text-coach">
            {completed}/{total} exercices
          </Text>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-coach-light">
          <View
            className="h-2 rounded-full bg-coach"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16 }}
      >
        <View className="gap-3">
          {session.exos.map((exo) => {
            const checked = done.has(exo.exercise_id);
            return (
              <Pressable
                key={exo.exercise_id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={exo.exercise_name}
                onPress={() => toggle(exo)}
                className={`flex-row items-center rounded-2xl border-2 p-3 ${
                  checked
                    ? 'border-coach bg-coach-soft'
                    : 'border-transparent bg-surface'
                }`}
                style={({ pressed }) => [
                  cardShadow,
                  pressed ? { opacity: 0.92 } : null,
                ]}
              >
                <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-background">
                  <Image
                    source={exerciseImageUrl(exo.exercise_id)}
                    style={{ width: '100%', height: '100%', opacity: checked ? 0.5 : 1 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    accessibilityLabel={exo.exercise_name}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className={`text-base font-bold ${
                      checked ? 'text-text-muted line-through' : 'text-text-primary'
                    }`}
                    numberOfLines={1}
                  >
                    {exo.exercise_name}
                  </Text>
                  <Text className="mt-0.5 text-sm text-text-secondary">
                    {exerciseSummary(exo)}
                    {exo.weight_kg != null ? ` • ${exo.weight_kg} kg` : ''}
                    {exerciseFamily(exo) === 'muscu' && exo.rest_seconds != null
                      ? ` • repos ${formatRest(exo.rest_seconds)}`
                      : ''}
                  </Text>
                </View>
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${
                    checked ? 'bg-coach' : 'border-2 border-border bg-surface'
                  }`}
                >
                  {checked ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Pied : terminer. */}
      <View
        className="px-5"
        style={[{ paddingBottom: insets.bottom + 12 }, floatingShadow]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onFinish}
          disabled={completed === 0}
          className={`flex-row items-center justify-center gap-2 rounded-full py-4 ${
            completed === 0 ? 'bg-coach/40' : 'bg-coach'
          }`}
          style={({ pressed }) =>
            pressed && completed > 0 ? { opacity: 0.9 } : null
          }
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text className="text-lg font-bold text-white">
            Terminer la séance
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
