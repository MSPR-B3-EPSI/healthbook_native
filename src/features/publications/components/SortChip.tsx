import React from 'react';
import { Pressable, Text } from 'react-native';

type SortChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function SortChip({ label, active, onPress }: SortChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active ? 'border-coral bg-coral/10' : 'border-border bg-surface'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? 'text-coral' : 'text-text-secondary'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
