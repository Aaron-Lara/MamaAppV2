// Encabezado y total de la revisión de una compra.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseReview } from '@/lib/purchase-review';

export function PurchaseReviewHeader({ review }: { review: PurchaseReview }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">Fecha: {review.dateLabel}</ThemedText>
      {review.storeLabel ? (
        <ThemedText type="small">Proveedor: {review.storeLabel}</ThemedText>
      ) : null}
      <ThemedText type="small">Moneda: {review.currencyLabel}</ThemedText>
      {review.exchangeRateLabel ? (
        <ThemedText type="small">Tipo de cambio: {review.exchangeRateLabel}</ThemedText>
      ) : null}
      <ThemedText type="smallBold" style={styles.productsTitle}>
        Productos
      </ThemedText>
    </View>
  );
}

export function PurchaseReviewTotal({ review }: { review: PurchaseReview }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, styles.total, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.row}>
        <ThemedText type="smallBold">Total de la compra</ThemedText>
        <ThemedText type="smallBold">{review.totalLabel}</ThemedText>
      </View>
      {review.totalMxnLabel ? (
        <View style={styles.row}>
          <ThemedText type="small">Equivale en pesos</ThemedText>
          <ThemedText type="smallBold">{review.totalMxnLabel}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  productsTitle: { marginTop: Spacing.two },
  total: { marginTop: Spacing.two },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
