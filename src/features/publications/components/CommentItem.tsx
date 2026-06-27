import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/components';
import { profileLabel, useUser } from '@/features/users/useUser';
import { formatRelativeTime } from '@/lib/relativeTime';
import type { Comment } from '../api';
import LikeButton from './LikeButton';

type CommentItemProps = {
  comment: Comment;
  isMine: boolean;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onDelete?: () => void;
};

export default function CommentItem({
  comment,
  isMine,
  liked,
  likeCount,
  onToggleLike,
  onDelete,
}: CommentItemProps) {
  const router = useRouter();
  const author = useUser(comment.authorId);
  const label = profileLabel(author, isMine ? 'Toi' : 'Membre Healthbook');
  const openAuthor = () => router.push(`/user/${comment.authorId}`);

  return (
    <View className="flex-row py-3">
      <Pressable onPress={openAuthor} hitSlop={4}>
        <Avatar
          size={32}
          uri={author?.profilePictureUrl ?? undefined}
          name={label}
        />
      </Pressable>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Pressable onPress={openAuthor} hitSlop={4}>
            <Text className="text-sm font-semibold text-text-primary">
              {label}
            </Text>
          </Pressable>
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
