// Tarjetas del reporte de un periodo: solo texto grande, sin gráficas.
// Suma la tarjeta de caja desde cashInDrawerCents, ya calculado por la consulta.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type { PeriodTotals } from '@/lib/period-summary';
import { buildPeriodCards, type PeriodCard } from '@/lib/period-view';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  totals: PeriodTotals;
  previous: PeriodTotals;
  profit: NetProfitEstimate;
  previousProfit: NetProfitEstimate;
};

const WIDE_KEYS = new Set(['sales', 'drawer', 'profit']);

export function PeriodSummaryCards({
  totals,
  previous,
  profit,
  previousProfit,
}: Props) {
  const theme = useTheme();
  const cards = useMemo<PeriodCard[]>(() => {
    const base = buildPeriodCards({ totals, previous, profit, previousProfit });
    const drawer: PeriodCard = {
      key: 'drawer',
      label: 'Efectivo en caja',
      value: formatCents(totals.cashInDrawerCents),
      note: 'efectivo + abonos',
    };
    // La caja va justo después de las ventas, antes de los demás importes.
    const index = base.findIndex((card) => card.key === 'sales') + 1;
    return [...base.slice(0, index), drawer, ...base.slice(index)];
  }, [totals, previous, profit, previousProfit]);

  return (
    <View style={styles.grid}>
      {cards.map((card) => (
        <View
          key={card.key}
          style={[
            styles.card,
            WIDE_KEYS.has(card.key) ? styles.wide : styles.half,
            { backgroundColor: theme.backgroundElement },
          ]}>
          <ThemedText type="small" themeColor="textSecondary">
            {card.label}
          </ThemedText>
          <ThemedText type="subtitle" numberOfLines={1}>
            {card.value}
          </ThemedText>
          {card.note ? (
            <ThemedText type="small" themeColor="textSecondary">
              {card.note}
            </ThemedText>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.half,
  },
  wide: {
    flexBasis: '100%',
  },
  half: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
