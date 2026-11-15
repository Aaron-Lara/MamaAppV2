// Encabezado de la pantalla de reportes: selector, tarjetas, comparaciones
// y productos principales. Solo presentación; recibe datos ya calculados.

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PeriodComparisons } from '@/components/reports/period-comparisons';
import { PeriodSelector } from '@/components/reports/period-selector';
import { PeriodSummaryCards } from '@/components/reports/period-summary-cards';
import { RetryBlock } from '@/components/summary/retry-block';
import { TopProducts } from '@/components/summary/top-products';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { PeriodNavigation } from '@/hooks/use-period-navigation';
import { useTheme } from '@/hooks/use-theme';
import type { PeriodReport } from '@/hooks/use-period-report';

type Props = {
  navigation: PeriodNavigation;
  report: PeriodReport | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  historyCount: number;
};

export function ReportsListHeader({
  navigation,
  report,
  loading,
  error,
  onRetry,
  historyCount,
}: Props) {
  const theme = useTheme();
  const firstLoad = loading && report === null;
  const historyUnit = navigation.kind === 'week' ? 'semanas' : 'meses';

  return (
    <View style={styles.header}>
      <PeriodSelector
        kind={navigation.kind}
        label={navigation.label}
        canGoNext={navigation.canGoNext}
        isPartial={navigation.isPartial}
        onKindChange={navigation.setKind}
        onPrev={navigation.goPrev}
        onNext={navigation.goNext}
      />

      {firstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando reporte del periodo"
          />
        </View>
      ) : null}

      {error ? <RetryBlock message={error} onRetry={onRetry} /> : null}

      {report ? (
        <>
          <PeriodSummaryCards
            totals={report.totals}
            previous={report.previousTotals}
            profit={report.profit}
            previousProfit={report.previousProfit}
          />
          <PeriodComparisons
            totals={report.totals}
            previous={report.previousTotals}
            profit={report.profit}
            previousProfit={report.previousProfit}
            previousLabel={navigation.previousLabel}
          />
          <TopProducts
            products={report.topProducts}
            title="Productos principales"
            emptyMessage="Sin ventas en este periodo."
          />
        </>
      ) : null}

      <View style={styles.historyHeading}>
        <ThemedText type="smallBold">Historial</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {historyCount} {historyUnit}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  historyHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
