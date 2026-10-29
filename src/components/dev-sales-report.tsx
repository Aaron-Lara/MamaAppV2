// TEMPORAL: conteos y últimas ventas para el panel de pruebas.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { SalesSummary } from '@/db/sales-summary';
import { formatCents } from '@/lib/money';

const PAYMENT_LABELS = { cash: 'Efectivo', credit: 'Fiado' } as const;

export function DevSalesReport({ summary }: { summary: SalesSummary }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">
        sales: {summary.salesCount} · sale_items: {summary.saleItemsCount} · customers:{' '}
        {summary.customersCount}
      </ThemedText>
      <ThemedText type="smallBold">Últimas 5 ventas</ThemedText>
      {summary.recentSales.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Todavía no hay ventas.
        </ThemedText>
      ) : null}
      {summary.recentSales.map((sale) => {
        const matches = sale.items_sum_cents === sale.total_cents;
        return (
          <View key={sale.id} style={styles.row}>
            <ThemedText type="small">
              #{sale.id} · {formatCents(sale.total_cents)} · {PAYMENT_LABELS[sale.payment_method]} ·{' '}
              {sale.customer_name ?? 'sin cliente'}
            </ThemedText>
            <ThemedText type="code" themeColor={matches ? 'textSecondary' : 'text'}>
              renglones {formatCents(sale.items_sum_cents)} {matches ? '✔' : '✖'}
            </ThemedText>
          </View>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
  },
  row: {
    gap: Spacing.half,
  },
});
