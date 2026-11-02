// Cobro en efectivo: campo "Paga con", atajos de billetes y cambio.
// Vacío significa que paga el total exacto.

import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { calculateChange, suggestTenders, type ChangeResult } from '@/lib/checkout';
import { formatCents } from '@/lib/money';
import { centsToInputText } from '@/lib/money-input';

export type CashPaymentProps = {
  totalCents: number;
  value: string;
  payment: ChangeResult;
  onChangeText: (text: string) => void;
  onFieldFocus?: () => void;
  disabled?: boolean;
};

/** Vacío es pago exacto; con texto, el cambio se calcula con checkout. */
export function resolveCashPayment(totalCents: number, tenderedText: string): ChangeResult {
  if (tenderedText.trim() === '') {
    return { ok: true, changeCents: 0 };
  }
  return calculateChange(totalCents, tenderedText);
}

export function CashPayment({
  totalCents,
  value,
  payment,
  onChangeText,
  onFieldFocus,
  disabled = false,
}: CashPaymentProps) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const tenders = suggestTenders(totalCents);
  const showChange = value.trim() !== '' && payment.ok;

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <ThemedText type="smallBold">Paga con</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder={formatCents(totalCents)}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Paga con"
          onFocus={onFieldFocus}
          editable={!disabled}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: payment.ok ? 'transparent' : errorColor,
            },
          ]}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Deja vacío para cobrar el total exacto.
        </ThemedText>
      </View>

      {tenders.length > 0 ? (
        <View style={styles.tenders}>
          {tenders.map((cents) => (
            <Pressable
              key={cents}
              onPress={() => onChangeText(centsToInputText(cents))}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={`Paga con ${formatCents(cents)}`}
              style={({ pressed }) => [
                styles.tender,
                {
                  backgroundColor: theme.backgroundSelected,
                  opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type="smallBold">{formatCents(cents)}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {payment.ok ? (
        showChange ? (
          <ThemedText type="smallBold" accessibilityLiveRegion="polite">
            Cambio: {formatCents(payment.changeCents)}
          </ThemedText>
        ) : null
      ) : (
        <ThemedText
          type="small"
          accessibilityLiveRegion="polite"
          style={{ color: errorColor }}>
          {payment.error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  tenders: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tender: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
