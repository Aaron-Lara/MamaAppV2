// Pantalla de inventario: solo lista y filtros (sin crear, editar ni desactivar).

import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InventoryFilters } from '@/components/inventory/inventory-filters';
import { InventoryRowLink } from '@/components/inventory/inventory-row-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useInventoryProducts } from '@/hooks/use-inventory-products';
import { useTheme } from '@/hooks/use-theme';
import type { InventoryFilter } from '@/lib/inventory-rules';
import { InventoryCreateButton } from '@/components/inventory/inventory-create-button';

import {
  buildInventoryRows,
  countInventoryFilters,
  selectInventoryRows,
} from '@/lib/inventory-view';

export default function InventoryScreen() {
  const theme = useTheme();
  const { products, loading, error, reload } = useInventoryProducts();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('all');
  const [showInactive, setShowInactive] = useState(false);

  const rows = useMemo(() => buildInventoryRows(products), [products]);
  const counts = useMemo(() => countInventoryFilters(rows), [rows]);
  const visibleRows = useMemo(
    () => selectInventoryRows(rows, { query, filter, showInactive }),
    [rows, query, filter, showInactive]
  );

  const emptyMessage =
    rows.length === 0 ? 'No hay productos' : 'No hay productos con esos filtros';
  const firstLoad = loading && products.length === 0;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Inventario</ThemedText>
          <InventoryCreateButton />
        </View>

        <InventoryFilters
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          showInactive={showInactive}
          onShowInactiveChange={setShowInactive}
          counts={counts}
        />

        {firstLoad ? (
          <View style={styles.centered}>
            <ActivityIndicator
              size="large"
              color={theme.text}
              accessibilityLabel="Cargando inventario"
            />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.centeredText}>{error}</ThemedText>
            <Pressable
              onPress={reload}
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
            keyExtractor={(row) => String(row.product.id)}
            renderItem={({ item }) => <InventoryRowLink row={item} />}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centered}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                  {emptyMessage}
                </ThemedText>
              </View>
            }
          />
        )}
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
    gap: Spacing.three,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.two,
    paddingBottom: Spacing.four,
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
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
});
