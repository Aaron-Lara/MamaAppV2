// Mensajes de carga, error y cliente no encontrado del detalle.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  loading?: boolean;
  text?: string;
  onRetry?: () => void;
};

export function DetailMessage({ loading, text, onRetry }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.centered}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.text} accessibilityLabel="Cargando detalle" />
        ) : (
          <>
            <ThemedText style={styles.centeredText}>{text}</ThemedText>
            {onRetry ? (
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
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
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
