import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Linking, Pressable, Text, TextInput, View } from 'react-native';
import { Button, Screen, ScreenHeader, TextField } from '@/components';
import { keycloakRegisterUrl } from '@/config/env';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthError } from '@/features/auth/keycloak';
import { loginSchema, LoginValues } from '@/features/auth/schemas';

export default function LoginScreen() {
  const passwordRef = useRef<TextInput>(null);
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await login(values.identifier.trim(), values.password);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'invalid_credentials') {
        setFormError('Identifiants invalides.');
      } else if (err instanceof AuthError && err.code === 'network') {
        setFormError('Connexion au serveur impossible.');
      } else {
        setFormError('Erreur inattendue. Réessaie.');
      }
    }
  };

  return (
    <Screen scrollable bottomInset>
      <ScreenHeader
        title="Bon retour"
        subtitle="Connecte-toi pour accéder à ton espace."
      />

      <View className="gap-1">
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Identifiant ou email"
              placeholder="user-freemium"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.identifier?.message}
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
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
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />

        {formError ? (
          <Text className="text-sm text-danger mb-2">{formError}</Text>
        ) : null}

        <Button
          label="Se connecter"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </View>

      <View className="flex-row justify-center items-center gap-1 mt-8">
        <Text className="text-base text-text-secondary">
          Pas encore de compte ?
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(keycloakRegisterUrl)}
        >
          <Text className="text-base font-semibold text-primary">
            Créer un compte
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
