import React from 'react';
import { Pressable, Text, View } from 'react-native';

type SegmentedToggleProps<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
};

/** Bascule Jour / Semaine de l'accueil coach : pilule grise, segment actif violet. */
export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: SegmentedToggleProps<T>) {
  return (
    <View className="flex-row rounded-full bg-border/40 p-1">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.key)}
            className={`flex-1 items-center rounded-full py-2 ${
              active ? 'bg-coach' : ''
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                active ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
