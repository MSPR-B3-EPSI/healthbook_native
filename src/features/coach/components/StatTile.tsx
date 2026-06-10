import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type StatTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit?: string;
  caption?: string;
};

/** Tuile de mesure de l'onglet Stats (poids, taille, masse grasse…). */
export default function StatTile({
  icon,
  label,
  value,
  unit,
  caption,
}: StatTileProps) {
  return (
    <View className="flex-1 rounded-2xl bg-background p-4">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color="#5B2EE5" />
        <Text className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
          {label}
        </Text>
      </View>
      <View className="mt-2 flex-row items-baseline gap-1">
        <Text className="text-3xl font-extrabold text-text-primary">{value}</Text>
        {unit ? <Text className="text-sm text-text-muted">{unit}</Text> : null}
      </View>
      {caption ? (
        <Text className="mt-1 text-xs font-semibold text-mint">{caption}</Text>
      ) : null}
    </View>
  );
}
