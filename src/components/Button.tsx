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
  const rootClassName = isDisabled ? 'bg-gray-400' : 'bg-primary';

  return (
    <Pressable
      accessibilityRole="button"
      className={`mt-4 rounded-xl px-4 py-3 ${rootClassName}`}
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
