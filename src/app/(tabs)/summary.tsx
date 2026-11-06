// Pestaña Resumen: selector, tarjetas, top, revisión y ventas del día.

import { Link } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySaleRow } from '@/components/summary/day-sale-row';
import { RetryBlock } from '@/components/summary/retry-block';
import { SummaryListHeader } from '@/components/summary/summary-list-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useDayProfit } from '@/hooks/use-day-profit';
import { useDaySales } from '@/hooks/use-day-sales';
import { useDaySummary } from '@/hooks/use-day-summary';
import { useTheme } from '@/hooks/use-theme';
import { useVoidDaySale } from '@/hooks/use-void-day-sale';

export default function SummaryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { date, label, isToday, canGoNext, goPrev, goNext } = useDayNavigation();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    reload: reloadSummary,
  } = useDaySummary(date);
  const {
    profit,
    loading: profitLoading,
    error: profitError,
    reload: reloadProfit,
  } = useDayProfit(date);
  const {
    rows,
    loading: salesLoading,
    error: salesError,
    reload: reloadSales,
  } = useDaySales(date);

  const handleVoided = useCallback(() => {
    void reloadSummary();
    void reloadSales();
    void reloadProfit();
  }, [reloadSummary, reloadSales, reloadProfit]);

  const { voidingId, requestVoid } = useVoidDaySale({
    isOtherDay: !isToday,
    onVoided: handleVoided,
  });

  const activeCount = summary?.activeSalesCount ?? rows.filter((row) => !row.isVoid).length;
  const voidedCount = summary?.voidedSalesCount ?? rows.filter((row) => row.isVoid).length;

  const header = (
    <SummaryListHeader
      label={label}
      canGoNext={canGoNext}
      onPrev={goPrev}
      onNext={goNext}
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      onRetrySummary={() => void reloadSummary()}
      profit={profit}
      profitLoading={profitLoading}
      profitError={profitError}
      onRetryProfit={() => void reloadProfit()}
      activeCount={activeCount}
      voidedCount={voidedCount}
    />
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <FlatList
          data={rows}
          keyExtractor={(row) => String(row.id)}
          renderItem={({ item }) => (
            <DaySaleRow row={item} voiding={voidingId === item.id} onVoid={requestVoid} />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            summary ? (
              salesLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator
                    size="small"
                    color={theme.text}
                    accessibilityLabel="Cargando ventas del día"
                  />
                </View>
              ) : salesError ? (
                <RetryBlock message={salesError} onRetry={() => void reloadSales()} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  No hubo ventas este día.
                </ThemedText>
              )
            ) : undefined
          }
          ListFooterComponent={
            <Link href="/dev" style={styles.link}>
              <ThemedText type="link" themeColor="textSecondary">
                Pruebas (temporal)
              </ThemedText>
            </Link>
          }
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + Spacing.four },
          ]}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  content: {
    gap: Spacing.three,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  link: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: Spacing.two,
  },
});
