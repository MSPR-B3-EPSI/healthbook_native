import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, TextInput, View } from 'react-native';
import { Button, Screen, TextField } from '../../src/components';
import { loginSchema, LoginValues } from '../../src/features/auth/schemas';

export default function LoginScreen() {
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: LoginValues) => {
    // TODO: brancher l'API d'auth (POST /login)
    await new Promise((r) => setTimeout(r, 600));
    Alert.alert('Connexion', `Bienvenue ${values.email}`);
  };

  return (
    <Screen scrollable>
      <View className="mt-8 mb-8">
        <Text className="text-3xl font-bold text-text-primary mb-1">
          Bon retour
        </Text>
        <Text className="text-base text-text-secondary">
          Connecte-toi pour accéder à ton espace.
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
        <Link href="/(auth)/register" asChild>
          <Text className="text-base font-semibold text-primary">
            S’inscrire
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
