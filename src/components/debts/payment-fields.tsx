// Campos visuales del formulario de abono.

import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
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
  const statusColors = useStatusColors();

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
            borderColor: error ? statusColors.error : 'transparent',
          },
        ]}
      />

      <Pressable
        onPress={onPayAll}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel={`Pagar todo ${formatCents(balanceCents)}`}
        style={({ pressed }) => [
          styles.shortcut,
          { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold">Pagar todo ({formatCents(balanceCents)})</ThemedText>
      </Pressable>

      <TextInput
        value={note}
        onChangeText={onNoteChange}
        onFocus={onNoteFocus}
        placeholder="Nota (opcional)"
        placeholderTextColor={theme.textSecondary}
        maxLength={MAX_PAYMENT_NOTE_LENGTH}
        accessibilityLabel="Nota del abono"
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      {error ? (
        <ThemedText type="small" style={{ color: statusColors.error }}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={saving || confirming}
        accessibilityRole="button"
        accessibilityState={{ disabled: saving || confirming, busy: saving }}
        style={({ pressed }) => [
          styles.submit,
          { backgroundColor: theme.text },
          (pressed || saving || confirming) && styles.dimmed,
        ]}>
        {saving ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Registrar abono
          </ThemedText>
        )}
      </Pressable>
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
  shortcut: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  submit: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  dimmed: {
    opacity: 0.6,
  },
});
