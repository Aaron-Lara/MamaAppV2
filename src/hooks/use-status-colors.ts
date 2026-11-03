// Colores de estado legibles en claro y oscuro.
// Los mismos tonos que usan inventory-row y text-field, sin tocar theme.ts.

import { useColorScheme } from 'react-native';

const STATUS_COLORS = {
  light: { error: '#c62828', warning: '#8a5a00' },
  dark: { error: '#ff8a80', warning: '#f2c46d' },
} as const;

export function useStatusColors(): { error: string; warning: string } {
  return STATUS_COLORS[useColorScheme() === 'dark' ? 'dark' : 'light'];
}
