// Botón para abrir el historial de gastos desde el encabezado de Resumen.

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function ExpensesEntryLink() {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push('/expenses' as Href)}
      accessibilityRole="button"
      accessibilityLabel="Gastos"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText type="smallBold">Gastos</ThemedText>
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
