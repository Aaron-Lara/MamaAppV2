// Fila del historial de gastos. Toca para abrir el detalle.

import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExpenseStatusBadge } from '@/components/expenses/expense-status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ExpenseRow as ExpenseRowData } from '@/lib/expense-view';

type Props = {
  row: ExpenseRowData;
};

export function ExpenseRow({ row }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push(`/expense-detail?id=${row.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`Ver gasto ${row.categoryLabel}, ${row.amountLabel}, ${row.statusLabel}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement },
        row.isVoid && styles.voided,
        pressed && styles.pressed,
      ]}>
      <View style={styles.top}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.category}>
          {row.categoryLabel}
        </ThemedText>
        <ThemedText type="smallBold">{row.amountLabel}</ThemedText>
      </View>

      <View style={styles.meta}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {row.dateLabel}
        </ThemedText>
        <ExpenseStatusBadge status={row.isVoid ? 'void' : 'active'} />
      </View>

      {row.descriptionLabel ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {row.descriptionLabel}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
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
  category: {
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
  voided: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
});
