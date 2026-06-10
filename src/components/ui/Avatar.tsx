import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
};

function initials(name?: string | null): string {
  const n = name?.trim();
  if (!n) return '?';
  return n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const radius = size / 2;
  const label = name ?? 'avatar';

  if (uri) {
    return (
      <Image
        source={uri}
        style={{ width: size, height: size, borderRadius: radius }}
        contentFit="cover"
        transition={150}
        cachePolicy="memory-disk"
        accessibilityLabel={label}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-coral-light"
      style={{ width: size, height: size, borderRadius: radius }}
      accessibilityRole="image"
      accessibilityLabel={label}
    >
      <Text className="font-semibold text-coral" style={{ fontSize: size * 0.4 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
