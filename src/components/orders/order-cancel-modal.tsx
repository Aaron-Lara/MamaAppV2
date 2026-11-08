// Modal para cancelar un pedido: solo se pide confirmación.

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCancelOrder } from '@/hooks/use-cancel-order';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

type Props = {
  visible: boolean;
  orderId: number;
  customerName: string;
  totalCents: number;
  onClose: () => void;
  onCancelled: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export function OrderCancelModal({
  visible,
  orderId,
  customerName,
  totalCents,
  onClose,
  onCancelled,
  onRefresh,
}: Props) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const colors = useStatusColors();
  const { cancelling, error, clearError, requestCancel } = useCancelOrder({
    orderId,
    onCancelled,
    onRefresh,
  });

  const close = () => {
    if (!cancelling) {
      clearError();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top', 'left', 'right', 'bottom']}
          style={[styles.safe, { backgroundColor: theme.background }]}>
          <View style={styles.container}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Cancelar pedido</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {customerName} · {formatCents(totalCents)}
              </ThemedText>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              El pedido no se borra: queda como cancelado. ¿Confirmas?
            </ThemedText>

            {error ? (
              <ThemedText type="small" style={{ color: errorColor }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.footer}>
              <Pressable
                onPress={close}
                disabled={cancelling}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                accessibilityState={{ disabled: cancelling }}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: cancelling || pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText type="smallBold">Volver</ThemedText>
              </Pressable>

              <Pressable
                onPress={requestCancel}
                disabled={cancelling}
                accessibilityRole="button"
                accessibilityLabel="Cancelar pedido"
                accessibilityState={{ disabled: cancelling, busy: cancelling }}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: cancelling || pressed ? 0.7 : 1,
                  },
                ]}>
                {cancelling ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: colors.error }}>
                    Cancelar pedido
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
