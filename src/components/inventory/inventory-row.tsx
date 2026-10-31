// Fila de la lista de inventario. No es pulsable todavía (sin editar ni desactivar).

import { StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InventoryRow } from '@/lib/inventory-view';
import { formatCents } from '@/lib/money';
import { formatStockLabel } from '@/lib/stock-label';

// Colores de estado legibles en claro y oscuro (el texto también dice el estado).
const STATUS_COLORS = {
  light: { low: '#8a5a00', out: '#c62828' },
  dark: { low: '#f2c46d', out: '#ff8a80' },
} as const;

export function InventoryRowItem({ row }: { row: InventoryRow }) {
  const theme = useTheme();
  const scheme = useColorScheme();
  const colors = STATUS_COLORS[scheme === 'dark' ? 'dark' : 'light'];
  const { product, status } = row;

  const tracked = product.track_stock === 1;
  const showQuantity = tracked && (status === 'ok' || status === 'low');
  const statusLabel =
    status === 'low'
      ? 'Por agotarse'
      : status === 'out'
        ? product.stock < 0
          ? 'Agotado · revisar conteo'
          : 'Agotado'
        : null;
  const inactive = product.active !== 1;
  const price = formatCents(product.price_cents);

  const label = [
    product.name,
    price,
    showQuantity ? `Stock: ${formatStockLabel(product.stock)}` : null,
    statusLabel,
    inactive ? 'Desactivado' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={[styles.row, { backgroundColor: theme.backgroundElement }, inactive && styles.inactive]}>
      <View style={styles.main}>
        <ThemedText numberOfLines={2}>{product.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {price}
        </ThemedText>
      </View>

      {showQuantity || statusLabel || inactive ? (
        <View style={styles.side}>
          {showQuantity ? (
            <ThemedText type="smallBold">Stock: {formatStockLabel(product.stock)}</ThemedText>
          ) : null}
          {statusLabel ? (
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <ThemedText
                type="smallBold"
                style={{ color: status === 'out' ? colors.out : colors.low }}>
                {statusLabel}
              </ThemedText>
            </View>
          ) : null}
          {inactive ? (
            <ThemedText type="small" themeColor="textSecondary">
              Desactivado
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.two,
  },
  inactive: {
    opacity: 0.55,
  },
  main: {
    gap: Spacing.half,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 8,
  },
});
