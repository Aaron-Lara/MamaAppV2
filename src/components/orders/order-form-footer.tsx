// Pie del formulario: total, agregar producto y guardar el pedido.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { MAX_ORDER_ITEMS } from '@/lib/order-item-input';

type Props = {
  totalCents: number;
  lineCount: number;
  generalError: string;
  saving: boolean;
  onAddLine: () => void;
  onSave: () => void;
};

export function OrderFormFooter({
  totalCents,
  lineCount,
  generalError,
  saving,
  onAddLine,
  onSave,
}: Props) {
  const theme = useTheme();
  const colors = useStatusColors();
  const canAdd = lineCount < MAX_ORDER_ITEMS;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        El pedido no mueve stock hasta que se entregue.
      </ThemedText>

      <View style={[styles.total, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small">Total del pedido</ThemedText>
        <ThemedText type="smallBold">{formatCents(totalCents)}</ThemedText>
      </View>

      {generalError ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          {generalError}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onAddLine}
        disabled={!canAdd || saving}
        accessibilityRole="button"
        accessibilityLabel="Agregar producto"
        accessibilityState={{ disabled: !canAdd || saving }}
        style={({ pressed }) => [
          styles.secondary,
          {
            backgroundColor: theme.backgroundElement,
            opacity: !canAdd || saving ? 0.35 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">
          + Agregar producto ({lineCount} de {MAX_ORDER_ITEMS})
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={onSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Guardar pedido"
        accessibilityState={{ disabled: saving, busy: saving }}
        style={({ pressed }) => [
          styles.primary,
          { backgroundColor: theme.text, opacity: saving || pressed ? 0.7 : 1 },
        ]}>
        {saving ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Guardar pedido
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  total: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
