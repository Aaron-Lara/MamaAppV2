// Fila de la lista de compras. Toca para abrir el detalle.

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseRow as PurchaseRowData } from '@/lib/purchase-rows';

type Props = {
  row: PurchaseRowData;
};

export function PurchaseRow({ row }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  return (
    <Pressable
      onPress={() => router.push(`/purchase-detail?id=${row.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Ver compra de ${row.storeLabel}, ${row.totalLabel}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        row.isVoid && styles.voided,
        pressed && styles.pressed,
      ]}>
      <View style={styles.info}>
        <View style={styles.line}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.store}>
            {row.storeLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {row.dateLabel}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{row.totalLabel}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {row.itemsLabel}
        </ThemedText>
        {row.isVoid ? (
          <ThemedText type="smallBold" style={{ color: statusColors.error }}>
            {row.statusLabel}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  voided: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  store: {
    flexShrink: 1,
  },
});
