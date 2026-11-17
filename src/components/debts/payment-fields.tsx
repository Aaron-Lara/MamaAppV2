// Campos visuales del formulario de abono.

import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { MAX_PAYMENT_NOTE_LENGTH } from '@/lib/payment-input';

type Props = {
  amountText: string;
  onAmountChange: (text: string) => void;
  onAmountFocus?: () => void;
  note: string;
  onNoteChange: (text: string) => void;
  onNoteFocus?: () => void;
  error: string | null;
  saving: boolean;
  confirming: boolean;
  balanceCents: number;
  onPayAll: () => void;
  onSubmit: () => void;
};

export function PaymentFields({
  amountText,
  onAmountChange,
  onAmountFocus,
  note,
  onNoteChange,
  onNoteFocus,
  error,
  saving,
  confirming,
  balanceCents,
  onPayAll,
  onSubmit,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextInput
        value={amountText}
        onChangeText={onAmountChange}
        onFocus={onAmountFocus}
        placeholder="Monto"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
        accessibilityLabel="Monto del abono"
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: error ? theme.danger : theme.textSecondary,
          },
        ]}
      />

      <AppButton
        label={`Pagar todo (${formatCents(balanceCents)})`}
        variant="secondary"
        disabled={saving}
        onPress={onPayAll}
        accessibilityLabel={`Pagar todo ${formatCents(balanceCents)}`}
      />

      <TextInput
        value={note}
        onChangeText={onNoteChange}
        onFocus={onNoteFocus}
        placeholder="Nota (opcional)"
        placeholderTextColor={theme.textSecondary}
        maxLength={MAX_PAYMENT_NOTE_LENGTH}
        accessibilityLabel="Nota del abono"
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: theme.textSecondary,
          },
        ]}
      />

      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}

      <AppButton
        label="Registrar abono"
        loading={saving}
        disabled={saving || confirming}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
});
