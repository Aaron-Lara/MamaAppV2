// Cliente elegido para una venta fiada.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

export type CreditPaymentProps = {
  customer: CustomerWithBalance | null;
  onChoose: () => void;
  disabled?: boolean;
};

export function CreditPayment({ customer, onChoose, disabled = false }: CreditPaymentProps) {
  const theme = useTheme();
  const owes = customer !== null && customer.balanceCents > 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.info}>
        <ThemedText type="small" themeColor="textSecondary">
          Cliente
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={2}>
          {customer ? customer.name : 'Sin cliente elegido'}
        </ThemedText>
        {owes ? (
          <ThemedText type="small" themeColor="textSecondary">
            Debe {formatCents(customer.balanceCents)}
          </ThemedText>
        ) : null}
      </View>

      <Pressable
        onPress={onChoose}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={customer ? 'Cambiar cliente' : 'Elegir cliente'}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.backgroundSelected,
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">
          {customer ? 'Cambiar cliente' : 'Elegir cliente'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
