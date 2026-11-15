// Botón para abrir los reportes de periodo desde el encabezado de Resumen.

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ReportsEntryLink() {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/reports' as Href)}
      accessibilityRole="button"
      accessibilityLabel="Reportes"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText type="smallBold">Reportes</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
