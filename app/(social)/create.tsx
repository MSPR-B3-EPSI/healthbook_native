import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Screen, ScreenHeader, TextField } from '@/components';
import { createPost, uploadPostMedia } from '@/features/publications/api';
import {
  createPostSchema,
  type CreatePostValues,
} from '@/features/publications/schemas';
import { HttpError } from '@/lib/http';
import { pickImageFromLibrary, takePhoto } from '@/lib/imagePicker';
import type { MediaFile } from '@/lib/upload';

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
        marginBottom: 12,
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
  const [image, setImage] = useState<MediaFile | null>(null);

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

  const chooseFrom = async (pick: () => Promise<MediaFile | null>) => {
    const file = await pick();
    if (file) setImage(file);
  };

  const pickImage = () => {
    Alert.alert('Ajouter une image', undefined, [
      { text: 'Galerie', onPress: () => void chooseFrom(pickImageFromLibrary) },
      { text: 'Caméra', onPress: () => void chooseFrom(takePhoto) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const onSubmit = async (values: CreatePostValues) => {
    setFormError(null);

    try {
      const post = await createPost({
        title: values.title.trim(),
        content: values.content.trim(),
      });

      if (image) {
        try {
          await uploadPostMedia(post.id, image);
        } catch {
          // Post créé mais image refusée (taille/format) : on ne bloque pas.
          reset();
          setImage(null);
          Alert.alert(
            'Publié sans image',
            "Le post est en ligne, mais l’image n’a pas pu être envoyée.",
          );
          router.replace('/(social)');
          return;
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      reset();
      setImage(null);
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

        {image ? (
          <>
            <MediaPreview key={image.uri} uri={image.uri} />
            <View className="mb-4 flex-row">
              <Pressable onPress={pickImage} className="mr-5" hitSlop={6}>
                <Text className="text-sm font-medium text-primary">Changer</Text>
              </Pressable>
              <Pressable onPress={() => setImage(null)} hitSlop={6}>
                <Text className="text-sm font-medium text-text-secondary">
                  Retirer
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            onPress={pickImage}
            className="mb-4 flex-row items-center justify-center rounded-xl border border-dashed border-border bg-surface py-4"
          >
            <Ionicons name="image-outline" size={20} color="#6B6B6B" />
            <Text className="ml-2 text-sm font-medium text-text-secondary">
              Ajouter une image (optionnel)
            </Text>
          </Pressable>
        )}

        {formError ? (
          <Text className="mb-2 text-sm text-danger">{formError}</Text>
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
