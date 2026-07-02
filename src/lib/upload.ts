/** Fichier prêt pour un upload multipart (objet fichier React Native). */
export type MediaFile = { uri: string; name: string; type: string };

/** Construit un FormData avec le champ `file` attendu par le backend. */
export function fileFormData(file: MediaFile): FormData {
  const form = new FormData();
  // En React Native, FormData accepte un objet { uri, name, type } pour un fichier.
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
  return form;
}
