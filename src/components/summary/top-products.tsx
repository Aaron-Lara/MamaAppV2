// "Lo más vendido": hasta cinco productos por unidades, solo texto.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { DayTopProduct } from '@/db/day-summary';

type Props = { products: DayTopProduct[] };

export function TopProducts({ products }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Lo más vendido</ThemedText>
      {products.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Sin ventas este día.
        </ThemedText>
      ) : (
        products.map((product, index) => (
          <View
            key={product.productId}
            style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.position}>
              {index + 1}
            </ThemedText>
            <ThemedText numberOfLines={1} style={styles.name}>
              {product.name}
            </ThemedText>
            <ThemedText type="smallBold">
              {product.units} {product.units === 1 ? 'unidad' : 'unidades'}
            </ThemedText>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  position: {
    minWidth: 20,
  },
  name: {
    flex: 1,
  },
});
