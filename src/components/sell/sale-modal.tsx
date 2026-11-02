// Modal esqueleto del cobro: renglones del carrito y total.
// El pago se agrega en la siguiente ronda.

import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SaleLines } from '@/components/sell/sale-lines';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Cart } from '@/lib/cart';
import { formatCents } from '@/lib/money';

export type SaleModalProps = {
  visible: boolean;
  cart: Cart;
  totalCents: number;
  onClose: () => void;
  onChangeQuantity: (key: string, delta: number) => void;
  onRemoveLine: (key: string) => void;
};

export function SaleModal({
  visible,
  cart,
  totalCents,
  onClose,
  onChangeQuantity,
  onRemoveLine,
}: SaleModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Carrito</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar carrito"
              style={({ pressed }) => [
                styles.close,
                { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold">Cerrar</ThemedText>
            </Pressable>
          </View>

          <SaleLines
            lines={cart.lines}
            onChangeQuantity={onChangeQuantity}
            onRemoveLine={onRemoveLine}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Total
              </ThemedText>
              <ThemedText type="subtitle">{formatCents(totalCents)}</ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Seguir vendiendo"
              style={({ pressed }) => [
                styles.primary,
                { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.background }}>
                Seguir vendiendo
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  close: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  footer: {
    gap: Spacing.two,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  primary: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
