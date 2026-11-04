// Pestaña Resumen: selector de día, tarjetas, top de productos y "por revisar".
// La lista de ventas del día se agrega en la siguiente ronda.

import { Link } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySelector } from '@/components/summary/day-selector';
import { StockReviewSection } from '@/components/summary/stock-review';
import { SummaryCards } from '@/components/summary/summary-cards';
import { TopProducts } from '@/components/summary/top-products';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useDaySummary } from '@/hooks/use-day-summary';
import { useTheme } from '@/hooks/use-theme';

function salesCountLabel(active: number, voided: number): string {
  const sales = active === 1 ? '1 venta' : `${active} ventas`;
  const voidedSales = voided === 1 ? '1 anulada' : `${voided} anuladas`;
  return `${sales} · ${voidedSales}`;
}

export default function SummaryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { date, label, canGoNext, goPrev, goNext } = useDayNavigation();
  const { summary, loading, error, reload } = useDaySummary(date);
  const firstLoad = loading && !summary;

  const header = (
    <View style={styles.header}>
      <ThemedText type="subtitle">Resumen</ThemedText>
      <DaySelector label={label} canGoNext={canGoNext} onPrev={goPrev} onNext={goNext} />

      {firstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando resumen"
          />
        </View>
      ) : null}

      {error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.centeredText}>{error}</ThemedText>
          <Pressable
            onPress={() => void reload()}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold">Reintentar</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {summary ? (
        <>
          <SummaryCards summary={summary} />
          <TopProducts products={summary.topProducts} />
          <StockReviewSection review={summary.stockReview} />
          <View style={styles.salesHeader}>
            <ThemedText type="smallBold">Ventas del día</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {salesCountLabel(summary.activeSalesCount, summary.voidedSalesCount)}
            </ThemedText>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={header}
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
  header: {
    gap: Spacing.three,
  },
  salesHeader: {
    gap: Spacing.half,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  centeredText: {
    textAlign: 'center',
  },
  retry: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  link: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: Spacing.two,
  },
});
