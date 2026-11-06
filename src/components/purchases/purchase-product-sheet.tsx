// Hoja inferior para elegir producto: buscador fijo y lista desplazable.

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PurchaseProductList } from '@/components/purchases/purchase-product-list';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  products: ProductWithStock[];
  selectedProductId: number | null;
  loading: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (product: ProductWithStock | null) => void;
  onClose: () => void;
};

export function PurchaseProductSheet({
  products,
  selectedProductId,
  loading,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // La hoja flota sobre el área segura y deja ver el fondo bajo el borde.
  const bottomGap = insets.bottom + Spacing.two;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar buscador"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'height' : undefined}
        style={styles.avoider}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, marginBottom: bottomGap },
          ]}>
          <View style={styles.sheetHeader}>
            <ThemedText type="subtitle">Elegir producto</ThemedText>
            <Pressable
              onPress={onClose}
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
            onQueryChange={onQueryChange}
            onSelect={onSelect}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    // Altura definida: da a la lista un viewport real y desplazable.
    height: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
