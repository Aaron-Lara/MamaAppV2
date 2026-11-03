// Encabezado del detalle: nombre, deuda y formulario de abono.

import { StyleSheet, View } from 'react-native';

import { PaymentForm } from '@/components/debts/payment-form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatCents } from '@/lib/money';

type Props = {
  name: string;
  customerId: number;
  balanceCents: number;
  onChanged: () => Promise<void>;
  onFieldFocus?: () => void;
};

export function CustomerDetailHeader({
  name,
  customerId,
  balanceCents,
  onChanged,
  onFieldFocus,
}: Props) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">{name}</ThemedText>

      {balanceCents > 0 ? (
        <>
          <ThemedText type="smallBold">Debe {formatCents(balanceCents)}</ThemedText>
          <View style={styles.section}>
            <ThemedText type="smallBold">Abonar</ThemedText>
            <PaymentForm
              customerId={customerId}
              balanceCents={balanceCents}
              onChanged={onChanged}
              onFieldFocus={onFieldFocus}
            />
          </View>
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No debe nada.
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
});
