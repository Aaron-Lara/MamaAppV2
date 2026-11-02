// Pie del cobro: total, error y botón de confirmar la venta.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

export type CheckoutFooterProps = {
  totalCents: number;
  totalLabel?: string;
  error: string | null;
  saving: boolean;
  disabled: boolean;
  onConfirm: () => void;
};

export function CheckoutFooter({
  totalCents,
  totalLabel = 'Total',
  error,
  saving,
  disabled,
  onConfirm,
}: CheckoutFooterProps) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const blocked = saving || disabled;

  return (
    <View style={styles.container}>
      <View style={styles.totalRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {totalLabel}
        </ThemedText>
        <ThemedText type="subtitle">{formatCents(totalCents)}</ThemedText>
      </View>

      {error ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: errorColor }}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={onConfirm}
        disabled={blocked}
        accessibilityRole="button"
        accessibilityLabel="Confirmar venta"
        accessibilityState={{ disabled: blocked, busy: saving }}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.text },
          (pressed || blocked) && styles.dimmed,
        ]}>
        {saving ? (
          <ActivityIndicator color={theme.background} />
        ) : (
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Confirmar venta
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  button: {
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
