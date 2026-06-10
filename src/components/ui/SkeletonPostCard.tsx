import React from 'react';
import { View } from 'react-native';
import { cardShadow } from '@/lib/shadows';
import Card from './Card';
import Skeleton from './Skeleton';

export default function SkeletonPostCard() {
  return (
    <Card className="mb-3" style={cardShadow}>
      <View className="flex-row items-center">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="ml-3 flex-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-2 h-2.5 w-20" />
        </View>
      </View>
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-4 h-6 w-40" />
    </Card>
  );
}
