// Pantalla Vender: cuadrícula de productos, filtros y carrito de la venta.

import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CartBar } from '@/components/sell/cart-bar';
import { SaleModal } from '@/components/sell/sale-modal';
import { SellBody } from '@/components/sell/sell-body';
import { SellFilters } from '@/components/sell/sell-filters';
import { SellGrid } from '@/components/sell/sell-grid';
import { UndoBanner } from '@/components/sell/undo-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSaleCart } from '@/hooks/use-sale-cart';
import { useSellableProducts } from '@/hooks/use-sellable-products';
import { useTheme } from '@/hooks/use-theme';
import { useUndoSale } from '@/hooks/use-undo-sale';
import { buildSellRows } from '@/lib/sell-grid-rows';
import { listCategories, selectSellable, splitFrequent } from '@/lib/sellable-order';
import { toCartProduct } from '@/lib/sellable-product';

export default function SellScreen() {
  const theme = useTheme();
  const { products, frequency, loading, error, reload } = useSellableProducts();
  const cart = useSaleCart();
  const undo = useUndoSale({ onVoided: reload });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const categories = useMemo(() => listCategories(products), [products]);
  // Si la categoría elegida desaparece del catálogo, se vuelve a "Todas" sin effect.
  const activeCategory =
    category !== null && categories.includes(category) ? category : null;
  const visibleProducts = useMemo(
    () => selectSellable(products, { query, category: activeCategory }),
    [products, query, activeCategory]
  );
  const { frequent, others } = useMemo(() => {
    if (query.trim() !== '' || activeCategory !== null) {
      return { frequent: [], others: visibleProducts };
    }
    return splitFrequent(visibleProducts, frequency);
  }, [visibleProducts, frequency, query, activeCategory]);
  const rows = useMemo(() => buildSellRows(frequent, others), [frequent, others]);

  useEffect(() => {
    if (!cart.error) {
      return;
    }
    Alert.alert('No se pudo actualizar la venta', cart.error, [
      { text: 'Entendido', onPress: cart.clearError },
    ]);
  }, [cart.error, cart.clearError]);

  const emptyMessage =
    products.length === 0 ? 'No hay productos para vender.'
    : query.trim() !== '' ? 'No hay productos con esa búsqueda.'
    : 'No hay productos en esa categoría.';

  const handleClear = () => {
    if (cart.unitCount === 0) {
      return;
    }
    Alert.alert('Vaciar la venta', '¿Quitar todos los artículos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: cart.clear },
    ]);
  };

  const handleCheckout = () => {
    if (cart.unitCount > 0) {
      setCheckoutOpen(true);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Vender</ThemedText>

        <SellFilters
          query={query}
          onQueryChange={setQuery}
          categories={categories}
          category={activeCategory}
          onCategoryChange={setCategory}
        />

        <SellBody
          loading={loading && products.length === 0}
          error={error}
          onRetry={reload}>
          <SellGrid
            rows={rows}
            onAdd={(product) => cart.add(toCartProduct(product))}
            emptyMessage={emptyMessage}
          />
        </SellBody>

        {undo.sale ? (
          <UndoBanner
            totalCents={undo.sale.totalCents}
            undoing={undo.undoing}
            onUndo={undo.undo}
          />
        ) : null}

        <CartBar
          unitCount={cart.unitCount}
          totalCents={cart.totalCents}
          onCheckout={handleCheckout}
          onClear={handleClear}
        />
      </ThemedView>

      <SaleModal
        visible={checkoutOpen}
        cart={cart.cart}
        totalCents={cart.totalCents}
        onClose={() => setCheckoutOpen(false)}
        onChangeQuantity={cart.changeQuantity}
        onRemoveLine={cart.removeLine}
        onSaved={(sale) => {
          cart.clear();
          setCheckoutOpen(false);
          undo.start(sale);
          void reload();
        }}
      />
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
});
