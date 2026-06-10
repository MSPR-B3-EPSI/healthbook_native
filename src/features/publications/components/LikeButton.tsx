import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type LikeButtonProps = {
  liked: boolean;
  count: number;
  onPress: () => void;
};

export default function LikeButton({ liked, count, onPress }: LikeButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 90 }),
      withSpring(1, { damping: 6, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={liked ? 'Je n’aime plus' : 'J’aime'}
      hitSlop={8}
      onPress={handlePress}
      className="flex-row items-center"
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={22}
          color={liked ? '#FC5200' : '#6B6B6B'}
        />
      </Animated.View>
      <Text
        className={`ml-1.5 text-sm font-medium ${
          liked ? 'text-coral' : 'text-text-secondary'
        }`}
      >
        {count}
      </Text>
    </Pressable>
  );
}
