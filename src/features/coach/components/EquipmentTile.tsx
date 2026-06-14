import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cardShadow } from '@/lib/shadows';

type EquipmentTileProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Tuile de la grille matériel (2 colonnes, multi-sélection) : pastille d'icône
 * ronde + libellé centré, bord violet quand sélectionnée.
 */
export default function EquipmentTile({
  icon,
  label,
  selected,
  onPress,
}: EquipmentTileProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      className={`items-center rounded-2xl border-2 px-3 py-6 ${
        selected ? 'border-coach bg-coach-soft' : 'border-transparent bg-surface'
      }`}
      // 2 colonnes avec gouttière : la largeur est posée par le parent (basis ~48%).
      style={({ pressed }) => [
        { flexBasis: '47%', flexGrow: 1 },
        cardShadow,
        pressed ? { opacity: 0.92 } : null,
      ]}
    >
      <View
        className={`h-14 w-14 items-center justify-center rounded-full ${
          selected ? 'bg-coach-light' : 'bg-background'
        }`}
      >
        <Ionicons name={icon} size={26} color={selected ? '#5B2EE5' : '#1A1A1A'} />
      </View>
      <Text className="mt-3 text-center text-sm font-semibold text-text-primary">
        {label}
      </Text>
    </Pressable>
  );
}
