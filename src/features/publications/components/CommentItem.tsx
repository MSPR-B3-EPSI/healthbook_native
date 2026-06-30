import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
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
  onUpdate?: (content: string) => void;
};

export default function CommentItem({
  comment,
  isMine,
  liked,
  likeCount,
  onToggleLike,
  onDelete,
  onUpdate,
}: CommentItemProps) {
  const router = useRouter();
  const author = useUser(comment.authorId);
  const label = profileLabel(author, isMine ? 'Toi' : 'Membre Healthbook');
  const openAuthor = () => router.push(`/user/${comment.authorId}`);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const startEdit = () => {
    setDraft(comment.content);
    setEditing(true);
  };

  const save = () => {
    const text = draft.trim();
    setEditing(false);
    if (text && text !== comment.content) onUpdate?.(text);
  };

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

        {editing ? (
          <View className="mt-1">
            <TextInput
              className="rounded-xl bg-input px-3 py-2 text-base text-text-primary"
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              maxLength={255}
            />
            <View className="mt-1.5 flex-row">
              <Pressable onPress={() => setEditing(false)} hitSlop={6} className="mr-5">
                <Text className="text-sm font-medium text-text-secondary">
                  Annuler
                </Text>
              </Pressable>
              <Pressable onPress={save} hitSlop={6}>
                <Text className="text-sm font-medium text-primary">
                  Enregistrer
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text className="mt-0.5 text-base leading-5 text-text-primary">
              {comment.content}
            </Text>
            <View className="mt-1.5 flex-row items-center">
              <LikeButton
                liked={liked}
                count={likeCount}
                onPress={onToggleLike}
              />
              {isMine && onUpdate ? (
                <Pressable
                  onPress={startEdit}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Modifier le commentaire"
                  className="ml-4"
                >
                  <Ionicons name="pencil-outline" size={18} color="#6B6B6B" />
                </Pressable>
              ) : null}
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
          </>
        )}
      </View>
    </View>
  );
}
