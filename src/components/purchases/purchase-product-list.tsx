// Lista buscable de productos activos para una compra.

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { TextField } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useTheme } from '@/hooks/use-theme';
import { matchesSearch } from '@/lib/inventory-rules';

type Props = {
  products: ProductWithStock[];
  selectedProductId: number | null;
  loading: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (product: ProductWithStock | null) => void;
};

export function PurchaseProductList({
  products,
  selectedProductId,
  loading,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  const theme = useTheme();
  const filtered = products.filter((product) => matchesSearch(product.name, query));

  return (
    <View style={styles.container}>
      <TextField
        label="Buscar producto"
        value={query}
        onChangeText={onQueryChange}
        placeholder="Escribe el nombre"
      />
      {loading ? (
        <ActivityIndicator
          color={theme.text}
          accessibilityLabel="Cargando productos"
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Pressable
              onPress={() => onSelect(null)}
              accessibilityRole="button"
              accessibilityLabel="Usar descripción libre"
              style={[styles.option, { borderColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Usar descripción libre</ThemedText>
            </Pressable>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onSelect(item)}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${item.name}`}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: theme.backgroundElement,
                  backgroundColor:
                    item.id === selectedProductId
                      ? theme.backgroundElement
                      : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              {item.track_stock === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No controla stock
                </ThemedText>
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No hay productos activos con ese nombre.
            </ThemedText>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, gap: Spacing.two },
  list: { flex: 1 },
  listContent: { paddingBottom: Spacing.four },
  option: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    gap: 2,
  },
  empty: { padding: Spacing.three, textAlign: 'center' },
  loading: { padding: Spacing.four },
});
