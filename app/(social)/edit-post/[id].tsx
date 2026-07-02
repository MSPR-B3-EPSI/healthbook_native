import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, TextField } from '@/components';
import {
  deletePostMedia,
  getPost,
  updatePost,
  uploadPostMedia,
  type Post,
} from '@/features/publications/api';
import {
  createPostSchema,
  type CreatePostValues,
} from '@/features/publications/schemas';
import { HttpError } from '@/lib/http';
import { pickImageFromLibrary, takePhoto } from '@/lib/imagePicker';
import type { MediaFile } from '@/lib/upload';

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<Post | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);

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

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const p = await getPost(id);
        if (!active) return;
        setPost(p);
        reset({ title: p.title, content: p.content });
      } catch (err) {
        if (active)
          setLoadError(
            err instanceof HttpError
              ? `Erreur API (${err.status})`
              : 'Impossible de joindre le serveur',
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [id, reset]);

  const chooseFrom = async (pick: () => Promise<MediaFile | null>) => {
    const file = await pick();
    if (!file) return;
    setMediaBusy(true);
    try {
      setPost(await uploadPostMedia(id, file));
    } catch {
      Alert.alert('Oups', 'Impossible d’envoyer l’image (taille ou format).');
    } finally {
      setMediaBusy(false);
    }
  };

  const changeImage = () => {
    Alert.alert('Image de la publication', undefined, [
      { text: 'Galerie', onPress: () => void chooseFrom(pickImageFromLibrary) },
      { text: 'Caméra', onPress: () => void chooseFrom(takePhoto) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const removeImage = () => {
    setMediaBusy(true);
    void (async () => {
      try {
        setPost(await deletePostMedia(id));
      } catch {
        Alert.alert('Oups', 'Suppression de l’image impossible.');
      } finally {
        setMediaBusy(false);
      }
    })();
  };

  const onSubmit = async (values: CreatePostValues) => {
    setFormError(null);
    try {
      await updatePost(id, {
        title: values.title.trim(),
        content: values.content.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      setFormError(
        err instanceof HttpError
          ? `Erreur API (${err.status}). Réessaie.`
          : 'Impossible d’enregistrer. Vérifie ta connexion.',
      );
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-2">
        <IconButton
          name="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          color="#1A1A1A"
        />
        <Text className="ml-2 text-lg font-semibold text-text-primary">
          Modifier la publication
        </Text>
      </View>

      {loadError ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-danger">{loadError}</Text>
        </View>
      ) : !post ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Titre"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.title?.message}
                  maxLength={120}
                />
              )}
            />

            <Controller
              control={control}
              name="content"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Contenu"
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

            {post.mediaUrl ? (
              <>
                <Image
                  source={post.mediaUrl}
                  style={{
                    width: '100%',
                    aspectRatio: 16 / 9,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                  contentFit="cover"
                  transition={200}
                />
                <View className="mb-4 flex-row">
                  <Pressable
                    onPress={changeImage}
                    disabled={mediaBusy}
                    className="mr-5"
                    hitSlop={6}
                  >
                    <Text className="text-sm font-medium text-primary">
                      Changer l’image
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={removeImage}
                    disabled={mediaBusy}
                    hitSlop={6}
                  >
                    <Text className="text-sm font-medium text-danger">
                      Retirer
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                onPress={changeImage}
                disabled={mediaBusy}
                className="mb-4 flex-row items-center justify-center rounded-xl border border-dashed border-border bg-surface py-4"
              >
                <Ionicons name="image-outline" size={20} color="#6B6B6B" />
                <Text className="ml-2 text-sm font-medium text-text-secondary">
                  Ajouter une image
                </Text>
              </Pressable>
            )}

            {mediaBusy ? <ActivityIndicator className="mb-3" /> : null}

            {formError ? (
              <Text className="mb-2 text-sm text-danger">{formError}</Text>
            ) : null}

            <Button
              label="Enregistrer"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
