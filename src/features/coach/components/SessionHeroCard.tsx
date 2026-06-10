import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { floatingShadow } from '@/lib/shadows';
import {
  estimateKcal,
  exerciseImageUrl,
  formatDuration,
  intensityBadge,
  sessionIntensity,
  sessionLabel,
} from '../labels';
import type { ProgramSession } from '../types';

type SessionHeroCardProps = {
  session: ProgramSession;
  durationHours: number;
  weightKg: number;
  onStart: () => void;
};

/**
 * Carte héro "session du jour" : visuel sombre (image du 1er exercice +
 * voile noir), chip durée, badge intensité, stats et CTA "Lancer la session".
 */
export default function SessionHeroCard({
  session,
  durationHours,
  weightKg,
  onStart,
}: SessionHeroCardProps) {
  const firstExo = session.exos[0];
  const kcal = estimateKcal(weightKg, durationHours);

  return (
    <View
      className="overflow-hidden rounded-3xl bg-surface"
      style={floatingShadow}
    >
      {/* Visuel : image du premier exercice du catalogue, assombrie. */}
      <View className="h-44 bg-[#23242B]">
        {firstExo ? (
          <Image
            source={exerciseImageUrl(firstExo.exercise_id)}
            style={{ width: '100%', height: '100%', opacity: 0.55 }}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityLabel={firstExo.exercise_name}
          />
        ) : null}

        <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-black/55 px-3 py-1.5">
          <Ionicons name="time-outline" size={14} color="#FFFFFF" />
          <Text className="text-xs font-semibold text-white">
            {formatDuration(durationHours)}
          </Text>
        </View>

        <View className="absolute bottom-3 left-4 right-4">
          <Text className="text-[11px] font-bold tracking-widest text-white/85">
            {intensityBadge(sessionIntensity(session.session_kind))}
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-white">
            {sessionLabel(session.session_kind)}
          </Text>
        </View>
      </View>

      <View className="p-4">
        <View className="mb-4 flex-row items-center gap-5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="barbell-outline" size={16} color="#5B2EE5" />
            <Text className="text-sm font-semibold text-text-primary">
              {session.exos.length} Exercices
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="flame-outline" size={16} color="#5B2EE5" />
            <Text className="text-sm font-semibold text-text-primary">
              {kcal} kcal
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lancer la session"
          onPress={onStart}
          className="flex-row items-center justify-center gap-2 rounded-full bg-coach py-3.5"
          style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
        >
          <Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />
          <Text className="text-base font-bold text-white">Lancer la session</Text>
        </Pressable>
      </View>
    </View>
  );
}
