import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/components';
import { formatRelativeTime } from '@/lib/relativeTime';
import type { Comment } from '../api';
import LikeButton from './LikeButton';

type CommentItemProps = {
  comment: Comment;
  authorLabel: string;
  isMine: boolean;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onDelete?: () => void;
};

export default function CommentItem({
  comment,
  authorLabel,
  isMine,
  liked,
  likeCount,
  onToggleLike,
  onDelete,
}: CommentItemProps) {
  return (
    <View className="flex-row py-3">
      <Avatar size={32} name={authorLabel} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-text-primary">
            {authorLabel}
          </Text>
          <Text className="ml-2 text-xs text-text-muted">
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>
        <Text className="mt-0.5 text-base leading-5 text-text-primary">
          {comment.content}
        </Text>
        <View className="mt-1.5 flex-row items-center">
          <LikeButton liked={liked} count={likeCount} onPress={onToggleLike} />
          {isMine && onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Supprimer le commentaire"
              className="ml-4"
            >
              <Ionicons name="trash-outline" size={18} color="#6B6B6B" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
