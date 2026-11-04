// Botón y modal para elegir el producto de un renglón de compra.

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { PurchaseProductList } from '@/components/purchases/purchase-product-list';
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
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar buscador"
          />
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.sheetHeader}>
              <ThemedText type="subtitle">Elegir producto</ThemedText>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={styles.close}>
                <ThemedText type="smallBold">Cerrar</ThemedText>
              </Pressable>
            </View>
            <PurchaseProductList
              products={products}
              selectedProductId={selectedProductId}
              loading={loading}
              query={query}
              onQueryChange={setQuery}
              onSelect={choose}
            />
          </View>
        </View>
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.two },
});
