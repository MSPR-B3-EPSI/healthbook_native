import React from 'react';
import {
  ScrollView,
  ScrollViewProps,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
  /** Ajoute l'inset bas — uniquement pour les écrans plein-écran hors tabs (ex. login). */
  bottomInset?: boolean;
} & Omit<ViewProps, 'children'> &
  Omit<ScrollViewProps, 'children'>;

export default function Screen({
  children,
  scrollable = false,
  className,
  bottomInset = false,
  style,
  contentContainerStyle,
  ...rest
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  // Padding haut = inset système (status bar / notch) + marge visuelle constante.
  // Inset bas opt-in : sur les écrans de tabs, la tab bar consomme déjà l'inset bas.
  const insetStyle: StyleProp<ViewStyle> = {
    paddingTop: insets.top + 12,
    ...(bottomInset ? { paddingBottom: insets.bottom + 12 } : null),
  };

  const rootClassName = ['flex-1 px-5', className].filter(Boolean).join(' ');

  if (scrollable) {
    return (
      <ScrollView
        className={rootClassName}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[insetStyle, contentContainerStyle]}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={rootClassName} style={[insetStyle, style]} {...rest}>
      {children}
    </View>
  );
}
