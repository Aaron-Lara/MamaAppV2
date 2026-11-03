// Pestaña de Fiados: clientes con deuda, búsqueda, filtros y alta rápida.

import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DebtorRow } from '@/components/debts/debtor-row';
import { DebtsFilters } from '@/components/debts/debts-filters';
import { DebtsHeader } from '@/components/debts/debts-header';
import { NewCustomerView } from '@/components/debts/new-customer-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { DebtFilter } from '@/hooks/use-debtors';
import { useDebtors } from '@/hooks/use-debtors';
import { useTheme } from '@/hooks/use-theme';
import { matchesSearch } from '@/lib/inventory-rules';
import { totalOwedCents } from '@/lib/debtor-rows';

function emptyMessage(query: string, filter: DebtFilter): string {
  if (query.trim()) return 'No hay clientes con esa búsqueda.';
  return filter === 'debt' ? 'No hay deudas pendientes.' : 'No hay clientes.';
}

export default function DebtsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DebtFilter>('debt');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const { rows, loading, error, reload } = useDebtors(filter);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesSearch(row.name, query)),
    [rows, query]
  );
  // Los clientes sin deuda suman 0, así que el total no cambia con el filtro.
  const totalCents = totalOwedCents(rows);
  const firstLoad = loading && rows.length === 0;

  const handleCreated = useCallback(() => {
    setCreating(false);
    void reload();
  }, [reload]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      {creating ? (
        <NewCustomerView onCreated={handleCreated} onCancel={() => setCreating(false)} />
      ) : (
        <ThemedView style={styles.container}>
          <DebtsHeader totalCents={totalCents} onCreate={() => setCreating(true)} />
          <DebtsFilters
            query={query}
            onQueryChange={setQuery}
            filter={filter}
            onFilterChange={setFilter}
          />

          {firstLoad ? (
            <View style={styles.centered}>
              <ActivityIndicator
                size="large"
                color={theme.text}
                accessibilityLabel="Cargando fiados"
              />
            </View>
          ) : error ? (
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
          ) : (
            <FlatList
              data={visibleRows}
              keyExtractor={(row) => String(row.id)}
              renderItem={({ item }) => <DebtorRow row={item} />}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                { paddingBottom: insets.bottom + Spacing.four },
              ]}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                    {emptyMessage(query, filter)}
                  </ThemedText>
                </View>
              }
            />
          )}
        </ThemedView>
      )}
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
    gap: Spacing.three,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
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
});
