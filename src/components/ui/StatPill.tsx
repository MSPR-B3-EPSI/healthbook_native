import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type StatPillProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number | string;
  label?: string;
};

export default function StatPill({ icon, value, label }: StatPillProps) {
  return (
    <View className="flex-row items-center rounded-full bg-input px-3 py-1.5">
      <Ionicons name={icon} size={16} color="#6B6B6B" />
      <Text className="ml-1.5 text-sm font-semibold text-text-primary">
        {value}
      </Text>
      {label ? (
        <Text className="ml-1 text-sm text-text-secondary">{label}</Text>
      ) : null}
    </View>
  );
}
