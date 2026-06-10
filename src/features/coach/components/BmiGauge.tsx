import React from 'react';
import { Text, View } from 'react-native';

type BmiGaugeProps = {
  /** Position du curseur, 0 → 1 (échelle 15–35 kg/m², cf. metrics.ts). */
  position: number;
};

/**
 * Jauge IMC : bande verte/jaune/rouge avec curseur positionné (maquette Stats).
 * Segments proportionnels à l'échelle 15–35 : normal jusqu'à 25, surpoids
 * jusqu'à 30, obésité au-delà.
 */
export default function BmiGauge({ position }: BmiGaugeProps) {
  return (
    <View className="mt-3">
      <View className="h-2.5 flex-row overflow-hidden rounded-full">
        <View className="bg-mint" style={{ flex: 50 }} />
        <View className="bg-sun" style={{ flex: 25 }} />
        <View className="bg-danger/70" style={{ flex: 25 }} />
      </View>
      <View
        className="absolute -top-1 h-5 w-5 rounded-full border-[3px] border-coach bg-white"
        style={{ left: `${position * 100}%`, marginLeft: -10 }}
      />
      <View className="mt-1.5 flex-row justify-between">
        <Text className="text-xs text-text-muted">18.5</Text>
        <Text className="text-xs text-text-muted">25</Text>
        <Text className="text-xs text-text-muted">30</Text>
      </View>
    </View>
  );
}
