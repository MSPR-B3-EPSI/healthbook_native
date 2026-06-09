import React from 'react';
import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export default function ScreenHeader({
  title,
  subtitle,
  className,
}: ScreenHeaderProps) {
  return (
    <View className={['mb-6', className].filter(Boolean).join(' ')}>
      <Text className="text-3xl font-bold text-text-primary">{title}</Text>
      {subtitle ? (
        <Text className="text-base text-text-secondary mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}
