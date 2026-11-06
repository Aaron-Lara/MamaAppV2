// Fila de un producto dentro de la revisión de una compra.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseReviewLine } from '@/lib/purchase-review';

type Props = {
  row: PurchaseReviewLine;
};

export function PurchaseReviewLineRow({ row }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{row.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {row.unitsLabel}
      </ThemedText>

      <View style={styles.row}>
        <ThemedText type="small">Costo total</ThemedText>
        <ThemedText type="smallBold">{row.totalLabel}</ThemedText>
      </View>
      {row.totalMxnLabel ? (
        <View style={styles.row}>
          <ThemedText type="small">Costo total en pesos</ThemedText>
          <ThemedText type="small">{row.totalMxnLabel}</ThemedText>
        </View>
      ) : null}

      <View style={styles.row}>
        <ThemedText type="small">Costo de cada unidad</ThemedText>
        <ThemedText type="smallBold">{row.unitLabel}</ThemedText>
      </View>
      {row.unitMxnLabel ? (
        <View style={styles.row}>
          <ThemedText type="small">Costo de cada unidad en pesos</ThemedText>
          <ThemedText type="small">{row.unitMxnLabel}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
