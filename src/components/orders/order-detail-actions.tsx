// Acciones del detalle de un pedido pendiente: entregar o cancelar.
// Entregado o cancelado ya no muestran botones.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  canDeliver: boolean;
  canCancel: boolean;
  onDeliver: () => void;
  onCancel: () => void;
};

export function OrderDetailActions({
  canDeliver,
  canCancel,
  onDeliver,
  onCancel,
}: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  if (!canDeliver && !canCancel) {
    return null;
  }

  return (
    <View style={styles.container}>
      {canDeliver ? (
        <Pressable
          onPress={onDeliver}
          accessibilityRole="button"
          accessibilityLabel="Entregar pedido"
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Entregar pedido
          </ThemedText>
        </Pressable>
      ) : null}

      {canCancel ? (
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancelar pedido"
          style={({ pressed }) => [
            styles.secondary,
            {
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <ThemedText type="smallBold" style={{ color: colors.error }}>
            Cancelar pedido
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
