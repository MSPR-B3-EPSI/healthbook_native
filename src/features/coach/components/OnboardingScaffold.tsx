import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CoachButton from './CoachButton';

const TOTAL_STEPS = 4;

type OnboardingScaffoldProps = {
  /** Étape courante, 0-indexée (0 → 3). */
  step: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  ctaLabel: string;
  onNext: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  /** Masqué sur la première étape, remplacé par une croix de sortie. */
  showBack?: boolean;
  hint?: string;
};

/**
 * Gabarit commun des 4 étapes d'onboarding coach : navigation (retour ou
 * sortie vers le hub), indicateur de progression, titre/sous-titre centrés,
 * contenu scrollable, CTA pilule + mention en bas.
 */
export default function OnboardingScaffold({
  step,
  title,
  subtitle,
  children,
  ctaLabel,
  onNext,
  ctaDisabled = false,
  ctaLoading = false,
  showBack = true,
  hint = 'Tu pourras modifier ces informations à tout moment depuis ton profil.',
}: OnboardingScaffoldProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-background px-5"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }}
    >
      {/* Barre du haut : retour (ou sortie) + progression centrée. */}
      <View
        className="h-10 flex-row items-center"
        accessibilityLabel={`Étape ${step + 1} sur ${TOTAL_STEPS}`}
      >
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Revenir à l'étape précédente"
            onPress={() => router.back()}
            hitSlop={12}
            className="absolute left-0 z-10"
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitter la configuration"
            onPress={() => router.navigate('/(hub)')}
            hitSlop={12}
            className="absolute left-0 z-10"
          >
            <Ionicons name="close" size={24} color="#6B6B6B" />
          </Pressable>
        )}
        <View className="flex-1 flex-row items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              className={
                i === step
                  ? 'h-2 w-8 rounded-full bg-coach'
                  : i < step
                    ? 'h-2 w-2 rounded-full bg-coach/60'
                    : 'h-2 w-2 rounded-full bg-coach/25'
              }
            />
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <Text className="mt-8 text-center text-3xl font-extrabold text-text-primary">
          {title}
        </Text>
        <Text className="mb-8 mt-3 text-center text-base leading-6 text-text-secondary">
          {subtitle}
        </Text>
        {children}
      </ScrollView>

      <View className="pt-3">
        <CoachButton
          label={ctaLabel}
          onPress={onNext}
          disabled={ctaDisabled}
          loading={ctaLoading}
          arrow
        />
        <Text className="mt-3 text-center text-xs text-text-muted">{hint}</Text>
      </View>
    </View>
  );
}
