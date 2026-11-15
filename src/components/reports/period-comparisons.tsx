// Comparación contra el periodo anterior equivalente. Solo texto.
// La ganancia se rotula como estimada en la capa de presentación.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PeriodTotals } from '@/lib/period-summary';
import {
  buildPeriodComparisons,
  type ComparisonRow,
} from '@/lib/period-view';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  totals: PeriodTotals;
  previous: PeriodTotals;
  profit: NetProfitEstimate;
  previousProfit: NetProfitEstimate;
  previousLabel: string;
};

function rowLabel(row: ComparisonRow): string {
  return row.key === 'profit' ? 'Ganancia neta estimada' : row.label;
}

export function PeriodComparisons({
  totals,
  previous,
  profit,
  previousProfit,
  previousLabel,
}: Props) {
  const theme = useTheme();
  const rows = useMemo(
    () =>
      buildPeriodComparisons({ totals, previous, profit, previousProfit }),
    [totals, previous, profit, previousProfit]
  );

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <ThemedText type="smallBold">Comparación</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          vs. {previousLabel}
        </ThemedText>
      </View>

      {rows.map((row) => (
        <View
          key={row.key}
          style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.topRow}>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.label}
              numberOfLines={1}>
              {rowLabel(row)}
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={1}>
              {row.currentLabel}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Antes {row.previousLabel} · {row.changeLabel}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    gap: Spacing.half,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  label: {
    flex: 1,
  },
});
