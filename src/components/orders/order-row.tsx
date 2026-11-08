// Fila de la lista de pedidos. Toca para abrir el detalle.

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { OrderListRow } from '@/lib/order-list-view';

type Props = {
  row: OrderListRow;
};

export function OrderRow({ row }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  return (
    <Pressable
      onPress={() => router.push(`/order-detail?id=${row.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Ver pedido de ${row.customerName}, ${row.totalLabel}, ${row.statusLabel}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        row.isOverdue && { borderLeftWidth: 4, borderLeftColor: colors.error },
        row.status === 'cancelled' && styles.cancelled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.top}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
          {row.customerName}
        </ThemedText>
        <ThemedText type="smallBold">{row.totalLabel}</ThemedText>
      </View>

      <View style={styles.meta}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {row.orderDateLabel} · {row.itemsLabel}
        </ThemedText>
        <OrderStatusBadge status={row.status} />
      </View>

      {row.dueDateLabel ? (
        <ThemedText
          type="small"
          themeColor="textSecondary"
          style={row.isOverdue ? { color: colors.error } : undefined}>
          {row.dueDateLabel}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  name: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  metaText: {
    flex: 1,
  },
  cancelled: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.7,
  },
});
