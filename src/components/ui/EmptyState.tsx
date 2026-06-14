import React from 'react';
import { Text, View } from 'react-native';

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description?: string;
};

export default function EmptyState({
  emoji = '✨',
  title,
  description,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-6xl mb-4">{emoji}</Text>
      <Text className="text-xl font-semibold text-text-primary mb-2 text-center">
        {title}
      </Text>
      {description ? (
        <Text className="text-base text-text-secondary text-center">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
