import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type CoachButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Flèche → des CTA "Suivant" (maquettes). */
  arrow?: boolean;
};

/** CTA pilule violette de l'univers coach (vs Button bleu du reste de l'app). */
export default function CoachButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  arrow = false,
}: CoachButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      className={`flex-row items-center justify-center gap-2 rounded-full px-6 py-4 ${
        isDisabled ? 'bg-coach/40' : 'bg-coach'
      }`}
      style={({ pressed }) => (pressed && !isDisabled ? { opacity: 0.9 } : null)}
      disabled={isDisabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          <Text className="text-center text-lg font-bold text-white">{label}</Text>
          {arrow ? <Ionicons name="arrow-forward" size={20} color="#FFFFFF" /> : null}
        </>
      )}
    </Pressable>
  );
}
