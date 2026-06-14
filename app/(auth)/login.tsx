import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button, Screen, ScreenHeader, TextField } from '@/components';
import { keycloakRegisterUrl } from '@/config/env';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthError } from '@/features/auth/keycloak';
import { loginSchema, LoginValues } from '@/features/auth/schemas';

// Comptes de seed du realm Keycloak (cf. CLAUDE.md). Affichés en boutons de
// connexion rapide UNIQUEMENT en dev (`__DEV__`) pour ne pas retaper les
// identifiants à chaque test. Tous ont le même mot de passe « password ».
const DEV_ACCOUNTS = [
  { username: 'user-freemium', label: 'Freemium' },
  { username: 'user-premium', label: 'Premium' },
  { username: 'user-premium-plus', label: 'Premium+' },
] as const;

const DEV_PASSWORD = 'password';

export default function LoginScreen() {
  const passwordRef = useRef<TextInput>(null);
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  // username en cours de connexion via un bouton dev (pour le spinner), sinon null.
  const [devLoading, setDevLoading] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
    mode: 'onTouched',
  });

  const runLogin = async (identifier: string, password: string) => {
    setFormError(null);
    try {
      await login(identifier.trim(), password);
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

  const onSubmit = (values: LoginValues) =>
    runLogin(values.identifier, values.password);

  // Connexion automatique à un compte de seed (dev only).
  const quickLogin = async (username: string) => {
    setDevLoading(username);
    try {
      await runLogin(username, DEV_PASSWORD);
    } finally {
      setDevLoading(null);
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

      {__DEV__ ? (
        <View className="mt-10 border-t border-border pt-5">
          <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-text-muted">
            Dev · connexion rapide
          </Text>
          <View className="gap-2">
            {DEV_ACCOUNTS.map((acc) => {
              const busy = devLoading === acc.username;
              return (
                <Pressable
                  key={acc.username}
                  accessibilityRole="button"
                  accessibilityLabel={`Connexion dev ${acc.label}`}
                  disabled={devLoading !== null || isSubmitting}
                  onPress={() => quickLogin(acc.username)}
                  className="flex-row items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
                  style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
                >
                  <View>
                    <Text className="text-base font-semibold text-text-primary">
                      {acc.label}
                    </Text>
                    <Text className="text-xs text-text-muted">
                      {acc.username}
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator />
                  ) : (
                    <Text className="text-sm font-semibold text-primary">
                      Se connecter
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
