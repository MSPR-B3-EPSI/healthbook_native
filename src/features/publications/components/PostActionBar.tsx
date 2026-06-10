import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { IconButton } from '@/components';
import type { Post } from '../api';
import LikeButton from './LikeButton';

type PostActionBarProps = {
  post: Post;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onComment: () => void;
};

export default function PostActionBar({
  post,
  liked,
  likeCount,
  onToggleLike,
  onComment,
}: PostActionBarProps) {
  const share = () => {
    void Share.share({ message: `${post.title}\n\n${post.content}` });
  };

  return (
    <View className="mt-3 flex-row items-center">
      <LikeButton liked={liked} count={likeCount} onPress={onToggleLike} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Commenter"
        hitSlop={8}
        onPress={onComment}
        className="ml-6 flex-row items-center"
      >
        <Ionicons name="chatbubble-outline" size={20} color="#6B6B6B" />
        <Text className="ml-1.5 text-sm font-medium text-text-secondary">
          {post.commentsCount}
        </Text>
      </Pressable>

      <View className="ml-auto">
        <IconButton
          name="share-outline"
          onPress={share}
          accessibilityLabel="Partager"
        />
      </View>
    </View>
  );
}
