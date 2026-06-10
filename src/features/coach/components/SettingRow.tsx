import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  /** Sous-titre descriptif OU petite étiquette au-dessus du titre (overline). */
  subtitle?: string;
  overline?: string;
  onPress?: () => void;
};

/**
 * Ligne de l'écran Paramètres : tuile d'icône teintée, libellés, chevron.
 * Sert aux infos sportives (overline + valeur) et aux réglages (titre + desc).
 */
export default function SettingRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  overline,
  onPress,
}: SettingRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      className="flex-row items-center py-3"
      style={({ pressed }) => (pressed && onPress ? { opacity: 0.85 } : null)}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="ml-3 flex-1">
        {overline ? (
          <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            {overline}
          </Text>
        ) : null}
        <Text className="text-base font-bold text-text-primary">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-text-secondary">{subtitle}</Text>
        ) : null}
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color="#C2C6CE" />
      ) : null}
    </Pressable>
  );
}
