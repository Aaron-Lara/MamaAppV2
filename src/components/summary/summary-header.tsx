// Encabezado del Resumen: título, selector, tarjetas, top y "por revisar".

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DaySelector } from '@/components/summary/day-selector';
import { RetryBlock } from '@/components/summary/retry-block';
import { StockReviewSection } from '@/components/summary/stock-review';
import { SummaryCards } from '@/components/summary/summary-cards';
import { TopProducts } from '@/components/summary/top-products';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DaySummary } from '@/db/day-summary';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  summary: DaySummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
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
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">Resumen</ThemedText>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
});
