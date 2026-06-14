import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthProvider';
import { analyzeMeal, type VisionPrediction } from '@/features/coach/api';
import { useCoach } from '@/features/coach/CoachProvider';
import {
  CoachHeader,
  MealAnalysisCard,
  ScanMealCard,
} from '@/features/coach/components';
import { userFacingError } from '@/features/coach/errors';
import {
  dailyCalorieTarget,
  dailyProteinTarget,
} from '@/features/coach/metrics';
import { floatingShadow } from '@/lib/shadows';

/**
 * Onglet Nutrition : scan de plat (photo → POST /brain/vision/analyze) et
 * repères caloriques calculés depuis le profil onboarding. Le journal des
 * repas viendra avec le futur tracking-api.
 */
export default function CoachNutritionScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useCoach();

  const [scanUri, setScanUri] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<VisionPrediction[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const runAnalysis = async (asset: ImagePicker.ImagePickerAsset) => {
    setScanning(true);
    setScanError(null);
    setPredictions(null);
    setScanUri(asset.uri);
    try {
      const result = await analyzeMeal({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      setPredictions(result.predictions);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec analyse photo :', err);
      setScanError(
        userFacingError(
          err,
          'L’analyse de la photo a échoué. Réessaie avec une autre image.',
        ),
      );
    } finally {
      setScanning(false);
    }
  };

  // Les pickers peuvent rejeter (image illisible, fichier cloud non téléchargé,
  // permission révoquée…) : tout est rattrapé ici pour éviter un crash.
  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setScanError(
          'L’accès à la caméra est désactivé. Autorise-le dans les réglages du téléphone.',
        );
        return;
      }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!res.canceled && res.assets[0]) await runAnalysis(res.assets[0]);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec caméra :', err);
      setScanError('Impossible de lire cette photo. Réessaie avec une autre image.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (!res.canceled && res.assets[0]) await runAnalysis(res.assets[0]);
    } catch (err) {
      if (__DEV__) console.log('[Coach] Échec galerie :', err);
      setScanError('Impossible de lire cette photo. Réessaie avec une autre image.');
    }
  };

  const onScanPress = () => {
    Alert.alert('Scanner ton plat', 'Choisis la source de la photo.', [
      { text: 'Caméra', onPress: () => void pickFromCamera() },
      { text: 'Galerie', onPress: () => void pickFromLibrary() },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const calories = profile ? dailyCalorieTarget(profile) : null;
  const proteins = profile ? dailyProteinTarget(profile) : null;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <CoachHeader name={profile?.firstName ?? user?.username} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
      >
        <Text className="mt-2 text-3xl font-extrabold text-text-primary">
          Nutrition
        </Text>
        <Text className="mb-5 mt-1 text-base text-text-secondary">
          Tes repères du jour et l&apos;analyse de tes repas.
        </Text>

        <ScanMealCard onPress={onScanPress} loading={scanning} />

        {scanError ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-danger/10 p-4">
            <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
            <Text className="flex-1 text-sm text-danger">{scanError}</Text>
          </View>
        ) : null}

        {/* Repères du jour, calculés depuis le profil (Mifflin-St Jeor). */}
        {calories != null ? (
          <View
            className="mt-5 flex-row items-center rounded-3xl bg-coach p-5"
            style={floatingShadow}
          >
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                Apport calorique conseillé
              </Text>
              <Text className="mt-1 text-3xl font-extrabold text-white">
                {calories.toLocaleString('fr-FR')} kcal
              </Text>
              <Text className="mt-1 text-xs text-white/80">
                Estimation basée sur ton profil et ton objectif.
              </Text>
            </View>
            <View className="items-center rounded-2xl bg-white/15 px-4 py-3">
              <Text className="text-[11px] font-bold uppercase text-white/80">
                Protéines
              </Text>
              <Text className="mt-0.5 text-xl font-extrabold text-white">
                {proteins} g
              </Text>
            </View>
          </View>
        ) : null}

        {scanUri && predictions ? (
          <View className="mt-5">
            <MealAnalysisCard imageUri={scanUri} predictions={predictions} />
            <Text className="mt-2 text-center text-xs text-text-muted">
              Résultats indicatifs issus de la reconnaissance d&apos;image.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
