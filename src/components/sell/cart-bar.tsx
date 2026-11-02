// Barra inferior fija de Vender: artículos, total, vaciar y cobrar.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

export type CartBarProps = {
  unitCount: number;
  totalCents: number;
  onCheckout: () => void;
  onClear: () => void;
};

export function CartBar({ unitCount, totalCents, onCheckout, onClear }: CartBarProps) {
  const theme = useTheme();
  const empty = unitCount === 0;
  const countLabel = unitCount === 1 ? '1 artículo' : `${unitCount} artículos`;

  return (
    <View style={[styles.bar, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText
        type="smallBold"
        accessibilityLiveRegion="polite"
        style={styles.summary}>
        {countLabel} · {formatCents(totalCents)}
      </ThemedText>

      <View style={styles.actions}>
        <Pressable
          onPress={onClear}
          disabled={empty}
          accessibilityRole="button"
          accessibilityLabel="Vaciar la venta"
          accessibilityState={{ disabled: empty }}
          style={({ pressed }) => [
            styles.secondary,
            { backgroundColor: theme.backgroundSelected, opacity: empty ? 0.5 : pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold">Vaciar</ThemedText>
        </Pressable>

        <Pressable
          onPress={onCheckout}
          disabled={empty}
          accessibilityRole="button"
          accessibilityLabel={`Cobrar ${countLabel}, total ${formatCents(totalCents)}`}
          accessibilityState={{ disabled: empty }}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.text, opacity: empty ? 0.5 : pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            Cobrar
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  summary: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  secondary: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  primary: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
