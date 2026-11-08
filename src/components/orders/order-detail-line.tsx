// Renglón del detalle: descripción, cantidad, precio unitario y total.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { OrderDetailLineView } from '@/lib/order-detail-view';

type Props = {
  row: OrderDetailLineView;
};

export function OrderDetailLine({ row }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">{row.title}</ThemedText>
      {row.productLabel ? (
        <ThemedText type="small" themeColor="textSecondary">
          {row.productLabel}
        </ThemedText>
      ) : null}
      <ThemedText type="small" themeColor="textSecondary">
        {row.quantityLabel} · {row.unitPriceLabel} c/u
      </ThemedText>

      <View style={styles.row}>
        <ThemedText type="small">Total del renglón</ThemedText>
        <ThemedText type="smallBold">{row.lineTotalLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
