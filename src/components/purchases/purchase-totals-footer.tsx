// Pie del formulario: totales, ayuda, agregar renglón y guardar.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { MAX_PURCHASE_LINES, type PurchaseCurrency } from '@/lib/purchase-types';

type Props = {
  currency: PurchaseCurrency;
  totalCents: number;
  totalMxnCents: number;
  lineCount: number;
  generalError?: string;
  saving: boolean;
  onAddLine: () => void;
  onSave: () => void;
};

export function PurchaseTotalsFooter({
  currency,
  totalCents,
  totalMxnCents,
  lineCount,
  generalError,
  saving,
  onAddLine,
  onSave,
}: Props) {
  const theme = useTheme();
  const status = useStatusColors();
  const canAdd = lineCount < MAX_PURCHASE_LINES;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Si compraste una caja de 24, escribe 24 unidades.
      </ThemedText>

      <View style={[styles.totals, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.row}>
          <ThemedText type="small">Total en {currency}</ThemedText>
          <ThemedText type="smallBold">{formatCents(totalCents)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText type="small">Total en pesos</ThemedText>
          <ThemedText type="smallBold">{formatCents(totalMxnCents)}</ThemedText>
        </View>
      </View>

      {generalError ? (
        <ThemedText type="small" style={{ color: status.error }}>
          {generalError}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onAddLine}
        disabled={!canAdd}
        accessibilityRole="button"
        accessibilityLabel="Agregar renglón"
        accessibilityState={{ disabled: !canAdd }}
        style={({ pressed }) => [
          styles.secondary,
          {
            backgroundColor: theme.backgroundElement,
            opacity: !canAdd ? 0.35 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">
          + Agregar renglón ({lineCount} de {MAX_PURCHASE_LINES})
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={onSave}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Guardar compra"
        accessibilityState={{ disabled: saving }}
        style={({ pressed }) => [
          styles.save,
          { backgroundColor: theme.text, opacity: saving || pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.background }}>
          {saving ? 'Guardando…' : 'Guardar compra'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three, paddingTop: Spacing.two },
  totals: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  save: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
