// Ombres via la prop CSS `boxShadow` (RN 0.81 + new arch). NativeWind n'expose pas
// d'utilitaire d'ombre, donc on les applique en `style={...}` inline.

export const cardShadow = {
  boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.08)',
} as const;

export const floatingShadow = {
  boxShadow: '0px 4px 12px rgba(16, 24, 40, 0.12)',
} as const;
