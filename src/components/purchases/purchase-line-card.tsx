// Tarjeta de un producto de compra: descripción, unidades y costo.

import { Pressable, StyleSheet, View } from 'react-native';

import { TextField } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { PurchaseProductPicker } from '@/components/purchases/purchase-product-picker';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type {
  PurchaseLineErrors,
  PurchaseLineForm,
  PurchaseLineTotals,
} from '@/lib/purchase-form';
import type { PurchaseLinePatch } from '@/lib/purchase-form-state';
import type { PurchaseCurrency } from '@/lib/purchase-types';

type Props = {
  line: PurchaseLineForm;
  index: number;
  errors?: PurchaseLineErrors;
  totals?: PurchaseLineTotals;
  currency: PurchaseCurrency;
  products: ProductWithStock[];
  productsLoading: boolean;
  canRemove: boolean;
  onChange: (patch: PurchaseLinePatch) => void;
  onSelectProduct: (product: ProductWithStock | null) => void;
  onRemove: () => void;
  onFocusLast?: () => void;
};

export function PurchaseLineCard({
  line,
  index,
  errors,
  totals,
  currency,
  products,
  productsLoading,
  canRemove,
  onChange,
  onSelectProduct,
  onRemove,
  onFocusLast,
}: Props) {
  const theme = useTheme();
  const status = useStatusColors();
  const unitCost = totals?.unitCostMxnCents;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Producto {index + 1}</ThemedText>
        <Pressable
          onPress={onRemove}
          disabled={!canRemove}
          accessibilityRole="button"
          accessibilityLabel={`Quitar producto ${index + 1}`}
          accessibilityState={{ disabled: !canRemove }}
          style={({ pressed }) => [
            styles.remove,
            { opacity: !canRemove ? 0.35 : pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: status.error }}>
            Quitar
          </ThemedText>
        </Pressable>
      </View>

      <PurchaseProductPicker
        products={products}
        selectedProductId={line.productId}
        selectedName={line.productName}
        loading={productsLoading}
        onSelect={onSelectProduct}
      />

      {errors?.product ? (
        <ThemedText type="small" style={{ color: status.error }}>
          {errors.product}
        </ThemedText>
      ) : null}
      {line.productId !== null && line.trackStock === false ? (
        <ThemedText type="small" style={{ color: status.warning }}>
          Este producto no controla stock: solo se guardará el costo.
        </ThemedText>
      ) : null}

      <TextField
        label="Descripción"
        value={line.description}
        onChangeText={(description) => onChange({ description })}
        error={errors?.description}
        maxLength={60}
        placeholder="Ejemplo: caja de galletas"
        onFocus={onFocusLast}
      />
      <TextField
        label="Unidades"
        value={line.units}
        onChangeText={(units) => onChange({ units })}
        error={errors?.units}
        keyboardType="number-pad"
        placeholder="24"
        onFocus={onFocusLast}
      />
      <TextField
        label={`Costo total (${currency})`}
        value={line.cost}
        onChangeText={(cost) => onChange({ cost })}
        error={errors?.cost}
        keyboardType="decimal-pad"
        placeholder="120.00"
        onFocus={onFocusLast}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {unitCost == null
          ? 'Costo de cada unidad: —'
          : `Costo de cada unidad: ${formatCents(unitCost)}`}
      </ThemedText>
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
  },
  remove: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
});
