// Tarjeta de un producto del pedido: producto, descripción, cantidad y precio.

import { Pressable, StyleSheet, View } from 'react-native';

import { TextField } from '@/components/products/text-field';
import { PurchaseProductPicker } from '@/components/purchases/purchase-product-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type { OrderLineErrors, OrderLineForm } from '@/lib/order-form-types';
import type { OrderLinePatch } from '@/lib/order-form-state';

type Props = {
  line: OrderLineForm;
  index: number;
  errors?: OrderLineErrors;
  lineTotalCents: number | null;
  products: ProductWithStock[];
  productsLoading: boolean;
  canRemove: boolean;
  onChange: (patch: OrderLinePatch) => void;
  onSelectProduct: (product: ProductWithStock | null) => void;
  onRemove: () => void;
  onFocusLast?: () => void;
};

export function OrderLineCard({
  line,
  index,
  errors,
  lineTotalCents,
  products,
  productsLoading,
  canRemove,
  onChange,
  onSelectProduct,
  onRemove,
  onFocusLast,
}: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Producto {index + 1}</ThemedText>
        {canRemove ? (
          <Pressable
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Quitar producto ${index + 1}`}
            style={({ pressed }) => [styles.remove, { opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: colors.error }}>
              Quitar
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <PurchaseProductPicker
        products={products}
        selectedProductId={line.productId}
        selectedName={line.productName}
        loading={productsLoading}
        onSelect={onSelectProduct}
      />

      <TextField
        label="Descripción"
        value={line.description}
        onChangeText={(description) => onChange({ description })}
        error={errors?.description}
        placeholder="Nombre del producto"
        onFocus={onFocusLast}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <TextField
            label="Cantidad"
            value={line.quantity}
            onChangeText={(quantity) => onChange({ quantity })}
            error={errors?.quantity}
            keyboardType="number-pad"
            onFocus={onFocusLast}
          />
        </View>
        <View style={styles.half}>
          <TextField
            label="Precio unitario"
            value={line.unitPrice}
            onChangeText={(unitPrice) => onChange({ unitPrice })}
            error={errors?.unitPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            onFocus={onFocusLast}
          />
        </View>
      </View>

      <View style={styles.totalRow}>
        <ThemedText type="small">Total del producto</ThemedText>
        <ThemedText type="smallBold">
          {lineTotalCents === null ? '—' : formatCents(lineTotalCents)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  remove: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  half: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
