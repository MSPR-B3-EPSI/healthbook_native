/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          dark: '#0056B3',
        },
        // Accent coral (Strava) : CTA + engagement (likes). cf. lib/shadows.ts.
        coral: {
          DEFAULT: '#FC5200',
          dark: '#E04800',
          light: '#FFF1EB',
        },
        like: '#FC5200',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#E1E4E8',
          focus: '#007AFF',
        },
        input: '#FAFAFA',
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B6B',
          inverse: '#FFFFFF',
          muted: '#9AA0A6',
        },
        danger: '#E53935',
        success: '#2E7D32',
        // Palette HealthAI (univers coach) : violet signature des maquettes.
        // Tints light/soft pour fonds d'icones et etats selectionnes.
        coach: {
          DEFAULT: '#5B2EE5',
          dark: '#4A24C2',
          light: '#EDE8FC',
          soft: '#F6F4FE',
        },
        // Tints des tuiles d'icones onboarding + carte conseil nutrition.
        mint: { DEFAULT: '#22B573', light: '#D8F5E5' },
        sun: { DEFAULT: '#E8A800', light: '#FCF3D2' },
      },
    },
  },
  plugins: [],
};
