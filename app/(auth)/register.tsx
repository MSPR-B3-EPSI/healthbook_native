import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, TextInput, View } from 'react-native';
import { Button, Screen, TextField } from '../../src/components';
import {
  registerSchema,
  RegisterValues,
} from '../../src/features/auth/schemas';

export default function RegisterScreen() {
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const onSubmit = async (values: RegisterValues) => {
    // TODO: brancher l'API d'auth (POST /register)
    await new Promise((r) => setTimeout(r, 600));
    Alert.alert('Inscription', `Compte créé pour ${values.username}`);
  };

  return (
    <Screen scrollable>
      <View className="mt-6 mb-6">
        <Text className="text-3xl font-bold text-text-primary mb-1">
          Créer un compte
        </Text>
        <Text className="text-base text-text-secondary">
          Rejoins Healthbook en quelques secondes.
        </Text>
      </View>

      <View className="gap-1">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Email"
              placeholder="ton@email.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => usernameRef.current?.focus()}
              blurOnSubmit={false}
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={usernameRef}
              label="Nom d’utilisateur"
              placeholder="ton_pseudo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.username?.message}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={passwordRef}
              label="Mot de passe"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              blurOnSubmit={false}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              ref={confirmRef}
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.confirmPassword?.message}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />

        <Button
          label="Créer mon compte"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </View>

      <View className="flex-row justify-center items-center gap-1 mt-6">
        <Text className="text-base text-text-secondary">Déjà un compte ?</Text>
        <Link href="/(auth)/login" asChild>
          <Text className="text-base font-semibold text-primary">
            Se connecter
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
