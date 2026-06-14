import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Avatar, Card, IconButton } from '@/components';
import { formatRelativeTime } from '@/lib/relativeTime';
import { cardShadow } from '@/lib/shadows';
import type { Post } from '../api';
import PostActionBar from './PostActionBar';

type PostCardProps = {
  post: Post;
  isMine?: boolean;
  liked: boolean;
  likeCount: number;
  onToggleLike: () => void;
  onDelete?: () => void;
  /** Override l'action « commenter » (par défaut : ouvrir le détail). */
  onComment?: () => void;
  index?: number;
  /** Vue détail : pas de troncature, carte non cliquable. */
  expanded?: boolean;
};

export default function PostCard({
  post,
  isMine,
  liked,
  likeCount,
  onToggleLike,
  onDelete,
  onComment,
  index = 0,
  expanded = false,
}: PostCardProps) {
  const router = useRouter();
  const [mediaFailed, setMediaFailed] = useState(false);
  const authorLabel = isMine ? 'Toi' : 'Membre Healthbook';

  // Chemin agnostique au groupe de routes : les groupes (parenthèses) sont
  // transparents dans l'URL → marche que le groupe s'appelle (app) ou (social).
  const openDetail = () => router.push(`/post/${post.id}`);

  const confirmDelete = () => {
    Alert.alert('Supprimer', 'Supprimer cette publication ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: onDelete },
    ]);
  };

  const body = (
    <Card className="mb-3" style={cardShadow}>
      <View className="flex-row items-center">
        <Avatar size={40} name={authorLabel} />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-text-primary">{authorLabel}</Text>
          <Text className="text-xs text-text-muted">
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
        {isMine && onDelete ? (
          <IconButton
            name="ellipsis-horizontal"
            onPress={confirmDelete}
            accessibilityLabel="Options de la publication"
          />
        ) : null}
      </View>

      <Text className="mt-3 text-lg font-semibold text-text-primary">
        {post.title}
      </Text>
      {post.content ? (
        <Text
          className="mt-1 text-base text-text-primary leading-6"
          numberOfLines={expanded ? undefined : 6}
        >
          {post.content}
        </Text>
      ) : null}

      {post.mediaUrl && !mediaFailed ? (
        <Image
          source={post.mediaUrl}
          style={{
            width: '100%',
            aspectRatio: 16 / 9,
            borderRadius: 12,
            marginTop: 12,
          }}
          contentFit="cover"
          transition={200}
          onError={() => setMediaFailed(true)}
        />
      ) : null}

      <PostActionBar
        post={post}
        liked={liked}
        likeCount={likeCount}
        onToggleLike={onToggleLike}
        onComment={onComment ?? openDetail}
      />
    </Card>
  );

  if (expanded) {
    return body;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 60).duration(350)}
    >
      <Pressable onPress={openDetail}>{body}</Pressable>
    </Animated.View>
  );
}
