import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import { Button, Screen, TextField } from '@/components';
import { useAuth } from '@/features/auth/AuthProvider';
import { createAndPublishPost } from '@/features/publications/api';
import {
  createPostSchema,
  type CreatePostValues,
} from '@/features/publications/schemas';
import { HttpError } from '@/lib/http';

export default function CreateScreen() {
  const { user } = useAuth();
  const contentRef = useRef<TextInput>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', content: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: CreatePostValues) => {
    setFormError(null);

    if (!user?.email) {
      setFormError(
        'Ton compte n’a pas d’email enregistré — impossible de publier pour l’instant.',
      );
      return;
    }

    try {
      await createAndPublishPost({
        title: values.title.trim(),
        content: values.content?.trim() || undefined,
        authorEmail: user.email,
      });
      reset();
      Alert.alert('Publication créée', 'Ton post est en ligne 🎉');
      router.replace('/(app)');
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
        <View className="mt-6 mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-1">
            Nouvelle publication
          </Text>
          <Text className="text-base text-text-secondary">
            Partage ce que tu as en tête avec la communauté Healthbook.
          </Text>
        </View>

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
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
          )}
        />

        <Controller
          control={control}
          name="content"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={contentRef}
              label="Contenu (optionnel)"
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
          )}
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
