// theme.ts
// Direct port of the tailwind.config color/spacing/font tokens from
// create_account_boolok_gpt.html — keep this as the single source of truth
// so every screen (register, login, feed, etc.) stays visually consistent.

export type ColorTheme = {
  background: string;
  onBackground: string;
  inverseSurface: string;
  onSurface: string;
  onSurfaceVariant: string;
  secondary: string;
  secondaryContainer: string;
  primary: string;
  primaryFixed: string;
  primaryContainer: string;
  onPrimary: string;
  outline: string;
  outlineVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surface: string;
  error: string;
  success: string;
  isDark: boolean;
};

export const lightColors: ColorTheme = {
  background: '#FFFFFF',          // Clean white canvas per Task 2 spec
  onBackground: '#111827',        // Deep Charcoal 900
  inverseSurface: '#111827',
  onSurface: '#111827',           // Text primary #111827
  onSurfaceVariant: '#475569',    // Text secondary #475569
  secondary: '#F8FAFC',           // Surface secondary #F8FAFC
  secondaryContainer: '#F1F5F9',  // Light container
  primary: '#D97706',             // Brand primary #D97706
  primaryFixed: '#B45309',        // Brand hover #B45309
  primaryContainer: 'rgba(217, 119, 6, 0.1)',
  onPrimary: '#FFFFFF',           // Crisp white text on primary buttons
  outline: '#64748B',             // Text muted #64748B
  outlineVariant: '#E2E8F0',      // Border #E2E8F0
  surfaceContainerLowest: '#FFFFFF', // Pure white
  surfaceContainerLow: '#F8FAFC',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#F1F5F9',
  surface: '#FFFFFF',             // Pure white cards #FFFFFF
  error: '#EF4444',
  success: '#10B981',
  isDark: false,
};

export const darkColors: ColorTheme = {
  background: '#080D17',          // Dark Navy / Black canvas #080D17
  onBackground: '#F8FAFC',        // Text primary #F8FAFC
  inverseSurface: '#F8FAFC',
  onSurface: '#F8FAFC',           // Slate 50
  onSurfaceVariant: '#CBD5E1',    // Text secondary #CBD5E1
  secondary: '#111D30',           // Surface secondary #111D30
  secondaryContainer: '#172238',  // Surface elevated #172238
  primary: '#F59E0B',             // Brand primary #F59E0B
  primaryFixed: '#FBBF24',        // Brand hover #FBBF24
  primaryContainer: 'rgba(245, 158, 11, 0.14)',
  onPrimary: '#080D17',           // High contrast on primary
  outline: '#94A3B8',             // Text muted #94A3B8
  outlineVariant: '#293548',      // Border #293548
  surfaceContainerLowest: '#050A14',
  surfaceContainerLow: '#080D17',
  surfaceContainer: '#0B1424',     // Surface #0B1424
  surfaceContainerHigh: '#111D30',
  surface: '#0B1424',             // Surface card #0B1424
  error: '#EF4444',
  success: '#10B981',
  isDark: true,
};

// Cross-platform shadows (iOS shadow*, Android elevation, and Web boxShadow)
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
};

// Default export for backward compatibility where context isn't used yet
export const colors = lightColors;

export const spacing = {
  xs: 4,
  base: 8,
  sm: 12,
  md: 24,
  gutter: 24,
  lg: 40,
  xl: 64,
  xxl: 80,
};

export const radius = {
  default: 4,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

// fontFamily keys map to the Poppins weights loaded via
// @expo-google-fonts/poppins. Load these in App.tsx / _layout.tsx:
//   Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
//   Poppins_700Bold
export const typography = {
  headlineXl: { fontFamily: 'Poppins_700Bold', fontSize: 40, lineHeight: 48, letterSpacing: -0.4 },
  headlineLg: { fontFamily: 'Poppins_700Bold', fontSize: 28, lineHeight: 36, letterSpacing: -0.2 },
  headlineMd: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 26 },
  bodyLg: { fontFamily: 'Poppins_400Regular', fontSize: 17, lineHeight: 26 },
  bodyMd: { fontFamily: 'Poppins_400Regular', fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  labelLg: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, lineHeight: 20, letterSpacing: 0.4 },
  labelMd: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 15, letterSpacing: 0.6 },
};