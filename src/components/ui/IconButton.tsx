import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';

type IconButtonProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
  hitSlop?: number;
};

export default function IconButton({
  name,
  onPress,
  size = 22,
  color = '#6B6B6B',
  accessibilityLabel,
  hitSlop = 8,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      onPress={onPress}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
    >
      <Ionicons name={name} size={size} color={color} />
    </Pressable>
  );
}
