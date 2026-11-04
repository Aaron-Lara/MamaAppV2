// Tarjetas del Resumen del día: solo texto grande, sin gráficas.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DaySummary } from '@/db/day-summary';
import { buildDaySummaryCards, buildDaySummaryView } from '@/lib/day-summary-view';

type Props = { summary: DaySummary };

export function SummaryCards({ summary }: Props) {
  const theme = useTheme();
  const cards = buildDaySummaryCards(buildDaySummaryView(summary));

  return (
    <View style={styles.grid}>
      {cards.map((card) => {
        const wide = card.key === 'sales' || card.key === 'drawer';
        return (
          <View
            key={card.key}
            style={[
              styles.card,
              wide ? styles.wide : styles.half,
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
        );
      })}
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
