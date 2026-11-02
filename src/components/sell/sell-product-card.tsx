// Tarjeta grande de producto: un toque agrega una unidad a la venta.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { isSoldOut, type SellableProduct } from '@/lib/sellable-product';

export type SellProductCardProps = {
  product: SellableProduct;
  onAdd: (product: SellableProduct) => void;
};

export function SellProductCard({ product, onAdd }: SellProductCardProps) {
  const theme = useTheme();
  const soldOut = isSoldOut(product);
  const price = formatCents(product.priceCents);
  const label = soldOut
    ? `${product.name}, ${price}, agotado, se puede vender`
    : `${product.name}, ${price}`;

  return (
    <Pressable
      onPress={() => onAdd(product)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText type="smallBold" numberOfLines={2}>
        {product.name}
      </ThemedText>
      <View style={styles.bottom}>
        <ThemedText type="small">{price}</ThemedText>
        {soldOut ? (
          <ThemedText type="small" themeColor="textSecondary">
            Agotado
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
