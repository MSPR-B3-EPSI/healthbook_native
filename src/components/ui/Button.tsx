import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const rootClassName = isDisabled ? 'bg-border' : 'bg-primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`mt-4 rounded-xl px-4 py-3 ${rootClassName}`}
      style={({ pressed }) =>
        pressed && !isDisabled ? { opacity: 0.85 } : null
      }
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-center text-base font-semibold text-white">
          {label}
        </Text>
      )}
    </Pressable>
  );
}
