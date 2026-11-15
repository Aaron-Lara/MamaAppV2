// Pantalla de reportes por semana o mes: tarjetas, comparaciones, top 5
// e historial. Las pantallas no escriben SQL: todo pasa por los hooks.

import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PeriodHistoryRow } from '@/components/reports/period-history-row';
import { ReportsListHeader } from '@/components/reports/reports-list-header';
import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePeriodHistory } from '@/hooks/use-period-history';
import { usePeriodNavigation } from '@/hooks/use-period-navigation';
import { usePeriodReport } from '@/hooks/use-period-report';
import { useTheme } from '@/hooks/use-theme';
import type { PeriodHistoryRow as PeriodHistoryRowData } from '@/lib/period-history';

export default function ReportsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = usePeriodNavigation();
  const {
    report,
    loading,
    error,
    reload: reloadReport,
  } = usePeriodReport(navigation.range, navigation.previousRange);
  const history = usePeriodHistory(navigation.kind, navigation.today);
  const { range, goToPeriod } = navigation;

  const renderItem = useCallback(
    ({ item }: { item: PeriodHistoryRowData }) => (
      <PeriodHistoryRow
        row={item}
        selected={item.start === range.start}
        onPress={() => goToPeriod(item.start)}
      />
    ),
    [goToPeriod, range.start]
  );

  const header = (
    <ReportsListHeader
      navigation={navigation}
      report={report}
      loading={loading}
      error={error}
      onRetry={() => void reloadReport()}
      historyCount={history.count}
    />
  );

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <FlatList
          data={history.rows}
          keyExtractor={(row) => row.start}
          extraData={range.start}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={
            history.loading ? (
              <View style={styles.centered}>
                <ActivityIndicator
                  size="small"
                  color={theme.text}
                  accessibilityLabel="Cargando historial de periodos"
                />
              </View>
            ) : history.error ? (
              <RetryBlock
                message={history.error}
                onRetry={() => void history.reload()}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Todavía no hay periodos para mostrar.
              </ThemedText>
            )
          }
          ListFooterComponent={
            history.error && history.rows.length > 0 ? (
              <RetryBlock
                message={history.error}
                onRetry={() => void history.reload()}
              />
            ) : undefined
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
    gap: Spacing.two,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
});
