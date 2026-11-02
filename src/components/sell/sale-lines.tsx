// Renglones del carrito con cantidad editable y opción de quitar.

import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CartLine } from '@/lib/cart';
import { formatCents, lineTotalCents } from '@/lib/money';

export type SaleLinesProps = {
  lines: readonly CartLine[];
  onChangeQuantity: (key: string, delta: number) => void;
  onRemoveLine: (key: string) => void;
};

export function SaleLines({ lines, onChangeQuantity, onRemoveLine }: SaleLinesProps) {
  const theme = useTheme();

  return (
    <FlatList
      data={lines}
      keyExtractor={(line) => line.key}
      keyboardShouldPersistTaps="handled"
      style={styles.list}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText type="small" themeColor="textSecondary">
            No hay artículos en la venta.
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.line, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.topRow}>
            <ThemedText type="smallBold" numberOfLines={2} style={styles.description}>
              {item.description}
            </ThemedText>
            <ThemedText type="smallBold">
              {formatCents(lineTotalCents(item.quantity, item.unitPriceCents))}
            </ThemedText>
          </View>

          <View style={styles.controls}>
            <ThemedText type="small" themeColor="textSecondary">
              {formatCents(item.unitPriceCents)} c/u
            </ThemedText>
            <View style={styles.spacer} />

            <Pressable
              onPress={() => onChangeQuantity(item.key, -1)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar una unidad de ${item.description}`}
              style={({ pressed }) => [
                styles.step,
                { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold">−</ThemedText>
            </Pressable>

            <ThemedText type="smallBold" style={styles.quantity}>
              {item.quantity}
            </ThemedText>

            <Pressable
              onPress={() => onChangeQuantity(item.key, 1)}
              accessibilityRole="button"
              accessibilityLabel={`Agregar una unidad de ${item.description}`}
              style={({ pressed }) => [
                styles.step,
                { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold">+</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => onRemoveLine(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.description} de la venta`}
              style={({ pressed }) => [
                styles.remove,
                { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="small">Quitar</ThemedText>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.two,
  },
  line: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  description: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  spacer: {
    flex: 1,
  },
  step: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  quantity: {
    minWidth: 28,
    textAlign: 'center',
  },
  remove: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
});
