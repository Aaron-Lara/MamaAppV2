// Encabezado del detalle: cliente, estado, fechas, notas y total.

import { StyleSheet, View } from 'react-native';

import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { OrderDetailHeaderView } from '@/lib/order-detail-view';

type Props = {
  header: OrderDetailHeaderView;
};

export function OrderDetailSummary({ header }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" style={styles.name}>
          {header.customerName}
        </ThemedText>
        <OrderStatusBadge status={header.status} />
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Pedido: {header.orderDateLabel}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Entrega: {header.dueDateLabel ?? 'Sin fecha'}
      </ThemedText>

      {header.deliveredAtLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          Entregado: {header.deliveredAtLabel}
        </ThemedText>
      ) : null}

      {header.cancelledAtLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          Cancelado: {header.cancelledAtLabel}
        </ThemedText>
      ) : null}

      {header.saleVoided ? (
        <ThemedText type="small" style={{ color: colors.error }}>
          La venta de este pedido fue anulada.
        </ThemedText>
      ) : null}

      {header.notes ? (
        <View style={[styles.info, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Notas</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {header.notes}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.totals, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.row}>
          <ThemedText type="small">Productos</ThemedText>
          <ThemedText type="smallBold">{header.itemsLabel}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText type="small">Total</ThemedText>
          <ThemedText type="smallBold">{header.totalLabel}</ThemedText>
        </View>
      </View>

      <ThemedText type="smallBold">Productos del pedido</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  info: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  totals: {
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
