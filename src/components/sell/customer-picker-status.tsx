// Estado de carga o error del selector de clientes.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CustomerPickerStatusProps = {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export function CustomerPickerStatus({
  loading,
  error,
  onRetry,
}: CustomerPickerStatusProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.text} accessibilityLabel="Cargando clientes" />
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <ThemedText style={styles.centeredText}>{error}</ThemedText>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Reintentar"
        style={({ pressed }) => [
          styles.retry,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold">Reintentar</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  centeredText: {
    textAlign: 'center',
  },
  retry: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
