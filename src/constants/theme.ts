/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform, type TextStyle } from 'react-native';

export const Colors = {
  light: {
    // Colores base del rediseño.
    text: '#1C1B18',
    background: '#FBF8F3',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EDE5D8',
    textSecondary: '#5F5B54',

    // Colores semánticos del rediseño.
    border: '#E2D8C8',
    primary: '#2F6B4F',
    primaryPressed: '#24543E',
    onPrimary: '#FFFFFF',
    primarySoft: '#E1EFE7',
    accent: '#E9A23B',
    accentSoft: '#FBEFDA',
    onAccent: '#4A3208',
    success: '#2F6B4F',
    successSoft: '#E1EFE7',
    warning: '#8A5A00',
    warningSoft: '#FBEFDA',
    danger: '#B3261E',
    dangerSoft: '#FBE9E7',
    onDanger: '#FFFFFF',
    link: '#2A5C8A',
    overlay: 'rgba(28, 27, 24, 0.45)',
  },
  dark: {
    // Colores base del rediseño.
    text: '#F6F1E7',
    background: '#16140F',
    backgroundElement: '#211E18',
    backgroundSelected: '#2E2A22',
    textSecondary: '#C3BAAC',

    // Colores semánticos del rediseño.
    border: '#3A342B',
    primary: '#86CFA8',
    primaryPressed: '#A5DCBC',
    onPrimary: '#12301F',
    primarySoft: '#223A2C',
    accent: '#F0BE7A',
    accentSoft: '#3A2C17',
    onAccent: '#2A1C05',
    success: '#86CFA8',
    successSoft: '#223A2C',
    warning: '#F2C46D',
    warningSoft: '#3A2C17',
    danger: '#FFB4AB',
    dangerSoft: '#44201D',
    onDanger: '#3B0906',
    link: '#9CC7F0',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Escala tipográfica centralizada.
export const Typography = {
  title: { fontSize: 36, lineHeight: 44, fontWeight: 700 },
  subtitle: { fontSize: 32, lineHeight: 40, fontWeight: 700 },
  body: { fontSize: 17, lineHeight: 26, fontWeight: 500 },
  bodySmall: { fontSize: 15, lineHeight: 22, fontWeight: 500 },
  bodySmallBold: { fontSize: 15, lineHeight: 22, fontWeight: 700 },
  sectionTitle: { fontSize: 17, lineHeight: 24, fontWeight: 700 },
  buttonLarge: { fontSize: 19, lineHeight: 26, fontWeight: 700 },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: 500 },
  price: { fontSize: 26, lineHeight: 32, fontWeight: 700 },
  link: { fontSize: 17, lineHeight: 26, fontWeight: 600 },
  linkPrimary: { fontSize: 17, lineHeight: 26, fontWeight: 700 },
} as const satisfies Record<string, TextStyle>;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const TouchTarget = {
  min: 48,
} as const;

export const IconSize = {
  sm: 20,
  md: 24,
  lg: 32,
} as const;

// Sombra única para barras y modales. Las tarjetas usan borde, no sombra.
export const Shadows = {
  card: {
    shadowColor: '#1C1B18',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
