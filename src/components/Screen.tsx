import React from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';

type ScreenProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  className?: string;
} & Omit<ViewProps, 'children'> &
  Omit<ScrollViewProps, 'children'>;

export default function Screen({
  children,
  scrollable = false,
  className,
  ...rest
}: ScreenProps) {
  const rootClassName = ['flex-1 px-5 pt-8', className]
    .filter(Boolean)
    .join(' ');

  if (scrollable) {
    return (
      <ScrollView
        className={rootClassName}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={rootClassName} {...rest}>
      {children}
    </View>
  );
}
