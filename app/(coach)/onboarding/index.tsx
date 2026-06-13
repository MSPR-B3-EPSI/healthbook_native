import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useCoach } from '@/features/coach/CoachProvider';
import { OnboardingField, OnboardingScaffold } from '@/features/coach/components';
import {
  identitySchema,
  parseNumericInput,
  type IdentityValues,
} from '@/features/coach/schemas';

/**
 * Onboarding coach — étape 1/4 "Faisons connaissance !".
 * Le genre n'apparaît pas sur la maquette mais est requis par le moteur
 * (WeeklyProgramRequestDto.gender) : ajouté en sélecteur discret sous la taille.
 */
export default function OnboardingIdentityScreen() {
  const { draft, updateDraft } = useCoach();
  const ageRef = useRef<TextInput>(null);
  const weightRef = useRef<TextInput>(null);
  const heightRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      firstName: draft.firstName ?? '',
      age: draft.age != null ? String(draft.age) : '',
      weightKg: draft.weightKg != null ? String(draft.weightKg) : '',
      heightCm: draft.heightCm != null ? String(draft.heightCm) : '',
      // '' tant que rien n'est choisi : le schéma (enum) bloque la soumission.
      gender: draft.gender ?? ('' as never),
    },
    mode: 'onChange',
  });

  const onNext = (values: IdentityValues) => {
    updateDraft({
      firstName: values.firstName.trim(),
      age: parseNumericInput(values.age),
      weightKg: parseNumericInput(values.weightKg),
      heightCm: parseNumericInput(values.heightCm),
      gender: values.gender,
    });
    router.push('/(coach)/onboarding/objective');
  };

  return (
    <OnboardingScaffold
      step={0}
      showBack={false}
      title="Faisons connaissance !"
      subtitle="Ces informations servent à calibrer ton programme d'entraînement."
      ctaLabel="Suivant"
      onNext={handleSubmit(onNext)}
      ctaDisabled={!isValid}
    >
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <OnboardingField
            label="Ton prénom"
            placeholder="Ex: Elena"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.firstName?.message}
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="next"
            onSubmitEditing={() => ageRef.current?.focus()}
            submitBehavior="submit"
          />
        )}
      />

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, onBlur, value } }) => (
          <OnboardingField
            ref={ageRef}
            label="Ton âge"
            placeholder="Ex: 28"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.age?.message}
            keyboardType="number-pad"
            returnKeyType="next"
            onSubmitEditing={() => weightRef.current?.focus()}
            submitBehavior="submit"
          />
        )}
      />

      <Controller
        control={control}
        name="weightKg"
        render={({ field: { onChange, onBlur, value } }) => (
          <OnboardingField
            ref={weightRef}
            label="Ton poids (kg)"
            placeholder="Ex: 65"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.weightKg?.message}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => heightRef.current?.focus()}
            submitBehavior="submit"
          />
        )}
      />

      <Controller
        control={control}
        name="heightCm"
        render={({ field: { onChange, onBlur, value } }) => (
          <OnboardingField
            ref={heightRef}
            label="Ta taille (cm)"
            placeholder="Ex: 172"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.heightCm?.message}
            keyboardType="number-pad"
            returnKeyType="done"
          />
        )}
      />

      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value } }) => (
          <View className="mb-2">
            <Text className="mb-2 ml-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Ton genre
            </Text>
            <View className="flex-row gap-3">
              {(
                [
                  { key: 'Female', label: 'Femme' },
                  { key: 'Male', label: 'Homme' },
                ] as const
              ).map((opt) => {
                const selected = value === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => onChange(opt.key)}
                    className={`flex-1 items-center rounded-2xl border-2 py-3 ${
                      selected
                        ? 'border-coach bg-coach-soft'
                        : 'border-transparent bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selected ? 'text-coach' : 'text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender ? (
              <Text className="ml-2 mt-1 text-sm text-danger">
                {errors.gender.message}
              </Text>
            ) : null}
          </View>
        )}
      />
    </OnboardingScaffold>
  );
}
