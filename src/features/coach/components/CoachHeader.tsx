import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type CoachHeaderProps = {
  /** Prénom (initiale de l'avatar). */
  name?: string | null;
};

/** En-tête commun des onglets coach : avatar (initiale, teinte violette), logo H, cloche. */
export default function CoachHeader({ name }: CoachHeaderProps) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <View className="flex-row items-center justify-between px-5 pb-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir le profil"
        onPress={() => router.navigate('/(coach)/home/profile')}
        className="h-9 w-9 items-center justify-center rounded-full bg-coach-light"
      >
        <Text className="text-base font-bold text-coach">{initial}</Text>
      </Pressable>
      <Text className="text-2xl font-extrabold text-coach">H</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={8}
      >
        <Ionicons name="notifications-outline" size={24} color="#1A1A1A" />
      </Pressable>
    </View>
  );
}
