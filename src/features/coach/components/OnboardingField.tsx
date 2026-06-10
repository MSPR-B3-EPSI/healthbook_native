import React, { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { cardShadow } from '@/lib/shadows';

type OnboardingFieldProps = {
  label: string;
  error?: string;
} & TextInputProps;

/**
 * Champ de l'étape "Faisons connaissance !" : carte blanche arrondie avec
 * libellé en petites capitales au-dessus de la saisie (cf. maquette), à la
 * différence du TextField générique (libellé hors du champ).
 */
const OnboardingField = forwardRef<TextInput, OnboardingFieldProps>(
  ({ label, error, ...rest }, ref) => {
    return (
      <View className="mb-4">
        <View
          className={`rounded-2xl border-2 bg-surface px-5 py-3 ${
            error ? 'border-danger' : 'border-transparent'
          }`}
          style={cardShadow}
        >
          <Text className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {label}
          </Text>
          <TextInput
            ref={ref}
            className="pb-1 pt-1 text-lg font-semibold text-text-primary"
            placeholderTextColor="#C2C6CE"
            {...rest}
          />
        </View>
        {error ? <Text className="ml-2 mt-1 text-sm text-danger">{error}</Text> : null}
      </View>
    );
  },
);

OnboardingField.displayName = 'OnboardingField';

export default OnboardingField;
