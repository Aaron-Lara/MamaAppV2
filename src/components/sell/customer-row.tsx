// Fila de cliente con su deuda, para el selector del cobro fiado.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

export type CustomerRowProps = {
  customer: CustomerWithBalance;
  selected: boolean;
  onPress: () => void;
};

export function CustomerRow({ customer, selected, onPress }: CustomerRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={customer.name}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <View style={styles.info}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {customer.name}
        </ThemedText>
        {customer.balanceCents > 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Debe {formatCents(customer.balanceCents)}
          </ThemedText>
        ) : null}
      </View>
      {selected ? <ThemedText type="smallBold">Elegido</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
});
