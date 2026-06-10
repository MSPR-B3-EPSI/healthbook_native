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
  NutritionTipCard,
  ScanMealCard,
} from '@/features/coach/components';
import {
  dailyCalorieTarget,
  dailyProteinTarget,
} from '@/features/coach/metrics';
import { floatingShadow } from '@/lib/shadows';

/**
 * Onglet Nutrition : scan de plat (photo → POST /brain/vision/analyze, modèle
 * nateraw/food) + objectifs caloriques calculés depuis le profil onboarding.
 * Les repas planifiés de la maquette viendront avec le futur tracking-api.
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
    } catch {
      setScanError(
        'Analyse impossible. Vérifie que le backend tourne, puis réessaie.',
      );
    } finally {
      setScanning(false);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets[0]) void runAnalysis(res.assets[0]);
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!res.canceled && res.assets[0]) void runAnalysis(res.assets[0]);
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
          Ton Plan Nutritionnel
        </Text>
        <Text className="mb-5 mt-1 text-base text-text-secondary">
          Garde le cap sur tes objectifs aujourd&apos;hui. Ton corps est ton
          sanctuaire.
        </Text>

        <ScanMealCard onPress={onScanPress} loading={scanning} />

        {scanError ? (
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-danger/10 p-4">
            <Ionicons name="alert-circle-outline" size={18} color="#E53935" />
            <Text className="flex-1 text-sm text-danger">{scanError}</Text>
          </View>
        ) : null}

        {/* Objectifs du jour, calculés depuis le profil (Mifflin-St Jeor). */}
        {calories != null ? (
          <View
            className="mt-5 flex-row items-center rounded-3xl bg-coach p-5"
            style={floatingShadow}
          >
            <View className="flex-1">
              <Text className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                Objectif calories du jour
              </Text>
              <Text className="mt-1 text-3xl font-extrabold text-white">
                {calories.toLocaleString('fr-FR')} kcal
              </Text>
              <Text className="mt-1 text-xs text-white/80">
                Estimation selon ton profil et ton objectif.
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
              Reconnaissance d&apos;aliments par IA — les valeurs nutritionnelles
              détaillées arrivent bientôt.
            </Text>
          </View>
        ) : null}

        <View className="mt-5">
          <NutritionTipCard tip="Pense à consommer 30g de protéines dans les 60 min après ta séance pour optimiser ta récupération musculaire." />
        </View>
      </ScrollView>
    </View>
  );
}
