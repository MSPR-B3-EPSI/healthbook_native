import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { Avatar, Button, IconButton, TextField } from '@/components';
import {
  deleteAvatar,
  getMe,
  updateMe,
  uploadAvatar,
  type Profile,
} from '@/features/users/api';
import { HttpError } from '@/lib/http';
import { pickImageFromLibrary, takePhoto } from '@/lib/imagePicker';
import type { MediaFile } from '@/lib/upload';

const editProfileSchema = z.object({
  displayName: z.string().trim().max(50, 'Trop long (50 caractères max)'),
});

type EditProfileValues = z.infer<typeof editProfileSchema>;

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { displayName: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const me = await getMe();
        if (!active) return;
        setProfile(me);
        reset({ displayName: me.displayName ?? '' });
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
  }, [reset]);

  const chooseFrom = async (pick: () => Promise<MediaFile | null>) => {
    const file = await pick();
    if (!file) return;
    setAvatarBusy(true);
    try {
      setProfile(await uploadAvatar(file));
    } catch {
      Alert.alert('Oups', 'Impossible d’envoyer la photo (taille ou format).');
    } finally {
      setAvatarBusy(false);
    }
  };

  const changeAvatar = () => {
    Alert.alert('Photo de profil', undefined, [
      { text: 'Galerie', onPress: () => void chooseFrom(pickImageFromLibrary) },
      { text: 'Caméra', onPress: () => void chooseFrom(takePhoto) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const removeAvatar = () => {
    setAvatarBusy(true);
    void (async () => {
      try {
        setProfile(await deleteAvatar());
      } catch {
        Alert.alert('Oups', 'Suppression de la photo impossible.');
      } finally {
        setAvatarBusy(false);
      }
    })();
  };

  const onSubmit = async (values: EditProfileValues) => {
    try {
      const name = values.displayName.trim();
      const updated = await updateMe(name ? { displayName: name } : {});
      setProfile(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      router.back();
    } catch (err) {
      Alert.alert(
        'Oups',
        err instanceof HttpError
          ? `Échec de l’enregistrement (${err.status}).`
          : 'Vérifie ta connexion.',
      );
    }
  };

  const label = profile?.displayName || profile?.username || 'Profil';

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
          Éditer le profil
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-2 items-center">
          <Avatar
            size={96}
            uri={profile?.profilePictureUrl ?? undefined}
            name={label}
          />
          <View className="mt-3 flex-row">
            <Pressable
              onPress={changeAvatar}
              disabled={avatarBusy}
              className="mr-5"
              hitSlop={6}
            >
              <Text className="text-sm font-medium text-primary">
                Changer la photo
              </Text>
            </Pressable>
            {profile?.profilePictureUrl ? (
              <Pressable onPress={removeAvatar} disabled={avatarBusy} hitSlop={6}>
                <Text className="text-sm font-medium text-danger">
                  Supprimer
                </Text>
              </Pressable>
            ) : null}
          </View>
          {avatarBusy ? <ActivityIndicator className="mt-2" /> : null}
        </View>

        {loadError ? (
          <Text className="mt-4 text-sm text-danger">{loadError}</Text>
        ) : null}

        <View className="mt-7">
          <Controller
            control={control}
            name="displayName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Nom affiché"
                placeholder="Ton nom public"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.displayName?.message}
                maxLength={50}
              />
            )}
          />
        </View>

        <Button
          label="Enregistrer"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </ScrollView>
    </View>
  );
}
