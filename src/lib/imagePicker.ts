import * as ImagePicker from 'expo-image-picker';
import type { MediaFile } from '@/lib/upload';

function toMediaFile(asset: ImagePicker.ImagePickerAsset): MediaFile {
  const type = asset.mimeType ?? 'image/jpeg';
  const ext = type.split('/')[1] ?? 'jpg';
  const name = asset.fileName ?? `upload.${ext}`;
  return { uri: asset.uri, name, type };
}

/** Ouvre la galerie. Renvoie le fichier choisi, ou null si refus/annulation. */
export async function pickImageFromLibrary(): Promise<MediaFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toMediaFile(asset) : null;
}

/** Ouvre la caméra. Renvoie la photo prise, ou null si refus/annulation. */
export async function takePhoto(): Promise<MediaFile | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    allowsEditing: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toMediaFile(asset) : null;
}
