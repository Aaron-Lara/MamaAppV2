// Encabezado del detalle de una compra: datos, totales y estado.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseDetailHeader } from '@/lib/purchase-rows';

type Props = {
  header: PurchaseDetailHeader;
};

export function PurchaseDetailSummary({ header }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">{header.storeLabel}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {header.dateLabel} · {header.itemsLabel}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Moneda: {header.currencyLabel}
      </ThemedText>
      {header.exchangeRateLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          Tipo de cambio: {header.exchangeRateLabel} pesos por dólar
        </ThemedText>
      ) : null}

      <View style={[styles.totals, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.row}>
          <ThemedText type="small">Total en {header.currencyLabel}</ThemedText>
          <ThemedText type="smallBold">{header.totalLabel}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText type="small">Total en pesos</ThemedText>
          <ThemedText type="smallBold">{header.totalMxnLabel}</ThemedText>
        </View>
      </View>

      {header.isVoid ? (
        <View style={styles.voidInfo}>
          <ThemedText type="smallBold" style={{ color: statusColors.error }}>
            Anulada
          </ThemedText>
          {header.voidReasonLabel ? (
            <ThemedText type="small" themeColor="textSecondary">
              {header.voidReasonLabel}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <ThemedText type="smallBold">Renglones</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  totals: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  voidInfo: {
    gap: Spacing.half,
  },
});
