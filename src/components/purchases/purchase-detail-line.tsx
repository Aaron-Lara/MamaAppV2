// Renglón del detalle de una compra: descripción, unidades y costos.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseDetailRow } from '@/lib/purchase-rows';

type Props = {
  row: PurchaseDetailRow;
};

export function PurchaseDetailLine({ row }: Props) {
  const theme = useTheme();
  const showMxn = row.currency === 'USD';

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{row.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {row.unitsLabel}
      </ThemedText>

      <View style={styles.row}>
        <ThemedText type="small">Costo del renglón</ThemedText>
        <ThemedText type="smallBold">{row.costLabel}</ThemedText>
      </View>
      {showMxn ? (
        <View style={styles.row}>
          <ThemedText type="small">En pesos</ThemedText>
          <ThemedText type="smallBold">{row.costMxnLabel}</ThemedText>
        </View>
      ) : null}
      <View style={styles.row}>
        <ThemedText type="small">Costo por unidad</ThemedText>
        <ThemedText type="smallBold">{row.unitCostLabel}</ThemedText>
      </View>
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
