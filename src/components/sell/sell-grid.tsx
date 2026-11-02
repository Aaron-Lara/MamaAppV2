// Cuadrícula de productos: filas de dos tarjetas grandes dentro de un FlatList.

import { FlatList, StyleSheet, View } from 'react-native';

import { SellProductCard } from '@/components/sell/sell-product-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { SellGridRow } from '@/lib/sell-grid-rows';
import type { SellableProduct } from '@/lib/sellable-product';

export type SellGridProps = {
  rows: readonly SellGridRow[];
  onAdd: (product: SellableProduct) => void;
  emptyMessage: string;
};

export function SellGrid({ rows, onAdd, emptyMessage }: SellGridProps) {
  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={styles.list}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            {emptyMessage}
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return (
            <ThemedText type="smallBold" themeColor="textSecondary">
              {item.title}
            </ThemedText>
          );
        }
        return (
          <View style={styles.row}>
            {item.products.map((product) => (
              <SellProductCard key={product.id} product={product} onAdd={onAdd} />
            ))}
            {item.products.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
  },
});
