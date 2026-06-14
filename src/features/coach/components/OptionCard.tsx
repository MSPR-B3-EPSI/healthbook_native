import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cardShadow } from '@/lib/shadows';

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  /** Couleurs de la tuile d'icône (tints des maquettes : violet, vert, jaune…). */
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Carte de choix unique (objectif, niveau) : tuile d'icône teintée + titre +
 * sous-titre, bord violet quand sélectionnée (cf. maquettes onboarding).
 */
export default function OptionCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  selected,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={onPress}
      className={`flex-row items-center rounded-2xl border-2 p-4 ${
        selected ? 'border-coach bg-coach-soft' : 'border-transparent bg-surface'
      }`}
      style={({ pressed }) => [cardShadow, pressed ? { opacity: 0.92 } : null]}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-text-primary">{title}</Text>
        <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
