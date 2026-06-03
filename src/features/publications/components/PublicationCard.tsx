import React from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/components';
import type { Post } from '../api';

type PublicationCardProps = {
  post: Post;
  isMine?: boolean;
};

export default function PublicationCard({ post, isMine }: PublicationCardProps) {
  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-xs font-medium text-text-muted uppercase">
          {isMine ? 'Toi' : 'Membre Healthbook'}
        </Text>
        {!post.published ? (
          <Text className="text-xs font-medium text-danger uppercase">
            Brouillon
          </Text>
        ) : null}
      </View>

      <Text className="text-lg font-semibold text-text-primary mb-1">
        {post.title}
      </Text>

      {post.content ? (
        <Text className="text-base text-text-primary leading-6">
          {post.content}
        </Text>
      ) : null}
    </Card>
  );
}
