// Aviso de la última venta guardada, con opción de deshacerla.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { UndoableSale } from '@/hooks/use-undo-sale';
import { formatCents } from '@/lib/money';

export type UndoBannerProps = {
  sale: UndoableSale;
  undoing: boolean;
  onUndo: () => void;
};

export function UndoBanner({ sale, undoing, onUndo }: UndoBannerProps) {
  const theme = useTheme();
  const label = sale.customerName
    ? `Venta fiada a ${sale.customerName}: ${formatCents(sale.totalCents)}`
    : `Venta guardada: ${formatCents(sale.totalCents)}`;

  return (
    <View style={[styles.banner, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText
        type="smallBold"
        accessibilityLiveRegion="polite"
        style={styles.text}>
        {label}
      </ThemedText>

      <Pressable
        onPress={onUndo}
        disabled={undoing}
        accessibilityRole="button"
        accessibilityLabel="Deshacer la venta"
        accessibilityState={{ disabled: undoing, busy: undoing }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.backgroundSelected,
            opacity: undoing ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        {undoing ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <ThemedText type="smallBold">Deshacer</ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  text: {
    flex: 1,
  },
  button: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
