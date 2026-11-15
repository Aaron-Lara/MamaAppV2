// Fila del historial de periodos. Toca para abrir ese periodo.
// Fondo distinto si está seleccionado; "Actual" marca el periodo de hoy.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type { PeriodHistoryRow as PeriodHistoryRowData } from '@/lib/period-history';

type Props = {
  row: PeriodHistoryRowData;
  selected: boolean;
  onPress: () => void;
};

function salesCountLabel(count: number): string {
  if (count === 0) return 'Sin ventas';
  return count === 1 ? '1 venta' : `${count} ventas`;
}

export function PeriodHistoryRow({ row, selected, onPress }: Props) {
  const theme = useTheme();
  const countLabel = salesCountLabel(row.salesCount);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${row.label}, ${formatCents(row.salesCents)}, ${countLabel}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <View style={styles.info}>
        <View style={styles.labelRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.label}>
            {row.label}
          </ThemedText>
          {row.isCurrent ? (
            <View style={[styles.badge, { backgroundColor: theme.background }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Actual
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {countLabel}
        </ThemedText>
      </View>
      <ThemedText type="smallBold">{formatCents(row.salesCents)}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
});
