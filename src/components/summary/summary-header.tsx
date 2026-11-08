// Encabezado del Resumen: título, selector, tarjetas, top y "por revisar".

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ExpensesEntryLink } from '@/components/expenses/expenses-entry-link';
import { DaySelector } from '@/components/summary/day-selector';
import { ProfitEstimateCard } from '@/components/summary/profit-estimate-card';
import { RetryBlock } from '@/components/summary/retry-block';
import { StockReviewSection } from '@/components/summary/stock-review';
import { SummaryCards } from '@/components/summary/summary-cards';
import { TopProducts } from '@/components/summary/top-products';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DaySummary } from '@/db/day-summary';
import type { ProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  summary: DaySummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  profit: ProfitEstimate | null;
  profitLoading: boolean;
  profitError: string | null;
  onRetryProfit: () => void;
};

export function SummaryHeader({
  label,
  canGoNext,
  onPrev,
  onNext,
  summary,
  loading,
  error,
  onRetry,
  profit,
  profitLoading,
  profitError,
  onRetryProfit,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">Resumen</ThemedText>
        <ExpensesEntryLink />
      </View>
      <DaySelector label={label} canGoNext={canGoNext} onPrev={onPrev} onNext={onNext} />

      {loading && !summary ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando resumen"
          />
        </View>
      ) : null}

      {error ? <RetryBlock message={error} onRetry={onRetry} /> : null}

      {summary ? (
        <>
          <SummaryCards summary={summary} />
          <ProfitEstimateCard
            profit={profit}
            loading={profitLoading}
            error={profitError}
            onRetry={onRetryProfit}
          />
          <TopProducts products={summary.topProducts} />
          <StockReviewSection review={summary.stockReview} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
});
