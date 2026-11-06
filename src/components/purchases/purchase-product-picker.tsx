// Botón y modal para elegir el producto de una compra.

import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PurchaseProductSheet } from '@/components/purchases/purchase-product-sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  products: ProductWithStock[];
  selectedProductId: number | null;
  selectedName: string | null;
  loading: boolean;
  onSelect: (product: ProductWithStock | null) => void;
};

export function PurchaseProductPicker({
  products,
  selectedProductId,
  selectedName,
  loading,
  onSelect,
}: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const choose = (product: ProductWithStock | null) => {
    onSelect(product);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Elegir producto"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.picker,
          { backgroundColor: theme.backgroundElement },
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {selectedName ?? 'Buscar producto (opcional)'}
        </ThemedText>
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="slide"
        onRequestClose={() => setOpen(false)}>
        {/* Provider propio: los insets del Modal no son los de la pantalla. */}
        <SafeAreaProvider>
          <PurchaseProductSheet
            products={products}
            selectedProductId={selectedProductId}
            loading={loading}
            query={query}
            onQueryChange={setQuery}
            onSelect={choose}
            onClose={() => setOpen(false)}
          />
        </SafeAreaProvider>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
