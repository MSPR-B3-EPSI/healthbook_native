import React from 'react';
import { Text, View } from 'react-native';
import { Avatar } from '@/components';
import { formatRelativeTime } from '@/lib/relativeTime';
import type { Comment } from '../api';

type CommentItemProps = { comment: Comment };

export default function CommentItem({ comment }: CommentItemProps) {
  const label = comment.authorLabel ?? 'Membre Healthbook';

  return (
    <View className="flex-row py-3">
      <Avatar size={32} name={label} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-text-primary">
            {label}
          </Text>
          <Text className="ml-2 text-xs text-text-muted">
            {formatRelativeTime(comment.createdAt)}
          </Text>
        </View>
        <Text className="mt-0.5 text-base text-text-primary leading-5">
          {comment.content}
        </Text>
      </View>
    </View>
  );
}
