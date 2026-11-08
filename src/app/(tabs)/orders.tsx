// Pestaña de Pedidos: listado con estados, atrasados, búsqueda y filtros.

import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderRow } from '@/components/orders/order-row';
import { OrdersFilters } from '@/components/orders/orders-filters';
import { OrdersHeader } from '@/components/orders/orders-header';
import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useOrders } from '@/hooks/use-orders';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/dates';
import {
  buildOrderListRows,
  countOrderListRows,
  filterOrderListRows,
  type OrderListFilter,
} from '@/lib/order-list-view';

function emptyMessage(query: string, filter: OrderListFilter): string {
  if (query.trim()) {
    return 'No hay pedidos de ese cliente.';
  }
  return filter === 'all'
    ? 'Todavía no hay pedidos.'
    : 'No hay pedidos con ese estado.';
}

export default function OrdersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading, error, reload } = useOrders();
  const [filter, setFilter] = useState<OrderListFilter>('all');
  const [query, setQuery] = useState('');
  const today = localDateString();
  const rows = useMemo(() => buildOrderListRows(items, today), [items, today]);
  const counts = useMemo(() => countOrderListRows(rows), [rows]);
  const visible = useMemo(
    () => filterOrderListRows(rows, filter, query),
    [rows, filter, query]
  );
  const firstLoad = loading && items.length === 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <OrdersHeader
          overdueCount={counts.overdue}
          onCreate={() => router.push('/order-form' as Href)}
        />
        <OrdersFilters
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
        />
      </View>

      {firstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando pedidos"
          />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <RetryBlock message={error} onRetry={() => void reload()} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(row) => String(row.id)}
          renderItem={({ item }) => <OrderRow row={item} />}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Spacing.four },
          ]}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                {emptyMessage(query, filter)}
              </ThemedText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
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
    padding: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  empty: {
    textAlign: 'center',
  },
});
