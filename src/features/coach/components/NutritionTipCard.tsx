import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type NutritionTipCardProps = {
  tip: string;
};

/** Encart vert "Conseil Nutrition" sous la liste d'exercices (cf. maquette). */
export default function NutritionTipCard({ tip }: NutritionTipCardProps) {
  return (
    <View className="flex-row items-start gap-3 rounded-2xl bg-mint-light p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-mint">
        <Ionicons name="restaurant-outline" size={18} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-bold text-text-primary">
          Conseil Nutrition
        </Text>
        <Text className="mt-1 text-sm leading-5 text-text-secondary">{tip}</Text>
      </View>
    </View>
  );
}
