import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
} from 'react-native';
import { Button, Screen, ScreenHeader, TextField } from '@/components';
import { createPost } from '@/features/publications/api';
import {
  createPostSchema,
  type CreatePostValues,
} from '@/features/publications/schemas';
import { HttpError } from '@/lib/http';

function MediaPreview({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Text className="mb-4 text-sm text-text-muted">Aperçu indisponible</Text>
    );
  }

  return (
    <Image
      source={uri}
      style={{
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: 12,
        marginBottom: 16,
      }}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}

export default function CreateScreen() {
  const contentRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', content: '', mediaUrl: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: CreatePostValues) => {
    setFormError(null);

    try {
      const media = values.mediaUrl?.trim();
      await createPost({
        title: values.title.trim(),
        content: values.content.trim(),
        ...(media ? { mediaUrl: media } : {}),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      reset();
      Alert.alert('Publication créée', 'Ton post est en ligne 🎉');
      router.replace('/(social)');
    } catch (err) {
      if (err instanceof HttpError) {
        setFormError(`Erreur API (${err.status}). Réessaie.`);
      } else {
        setFormError('Impossible de publier. Vérifie ta connexion.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <Screen scrollable keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Nouvelle publication"
          subtitle="Partage ce que tu as en tête avec la communauté Healthbook."
        />

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextField
                label="Titre"
                placeholder="Un titre accrocheur"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
                returnKeyType="next"
                onSubmitEditing={() => contentRef.current?.focus()}
                blurOnSubmit={false}
                maxLength={120}
              />
              {errors.title ? null : (
                <Text className="-mt-3 mb-3 text-right text-xs text-text-muted">
                  {value.length}/120
                </Text>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextField
                ref={contentRef}
                label="Contenu"
                placeholder="Raconte ton histoire…"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.content?.message}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="min-h-[140px]"
                maxLength={2000}
              />
              {errors.content ? null : (
                <Text className="-mt-3 mb-3 text-right text-xs text-text-muted">
                  {value.length}/2000
                </Text>
              )}
            </>
          )}
        />

        <Controller
          control={control}
          name="mediaUrl"
          render={({ field: { onChange, onBlur, value } }) => {
            const v = value ?? '';
            return (
              <>
                <TextField
                  label="Image (URL, optionnel)"
                  placeholder="https://…"
                  value={v}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.mediaUrl?.message}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {v.trim().startsWith('http') ? (
                  <MediaPreview key={v.trim()} uri={v.trim()} />
                ) : null}
              </>
            );
          }}
        />

        {formError ? (
          <Text className="text-sm text-danger mb-2">{formError}</Text>
        ) : null}

        <Button
          label="Publier"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
