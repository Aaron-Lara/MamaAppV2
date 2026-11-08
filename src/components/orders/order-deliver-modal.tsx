// Modal para entregar un pedido: efectivo o fiado y confirmación final.

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useErrorColor } from '@/components/products/text-field';
import { PaymentMethodPicker } from '@/components/sell/payment-method-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDeliverOrder } from '@/hooks/use-deliver-order';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

type Props = {
  visible: boolean;
  orderId: number;
  customerName: string;
  totalCents: number;
  onClose: () => void;
  onDelivered: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export function OrderDeliverModal({
  visible,
  orderId,
  customerName,
  totalCents,
  onClose,
  onDelivered,
  onRefresh,
}: Props) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const {
    method,
    setMethod,
    delivering,
    error,
    clearError,
    requestDeliver,
  } = useDeliverOrder({
    orderId,
    customerName,
    totalCents,
    onDelivered,
    onRefresh,
  });

  const close = () => {
    if (!delivering) {
      setMethod('cash');
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
              <ThemedText type="subtitle">Entregar pedido</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {customerName} · {formatCents(totalCents)}
              </ThemedText>
            </View>

            <ThemedText type="smallBold">Forma de cobro</ThemedText>
            <PaymentMethodPicker
              method={method}
              onChange={setMethod}
              disabled={delivering}
            />

            <ThemedText type="small" themeColor="textSecondary">
              {method === 'cash'
                ? 'Se registrará una venta en efectivo y se descontará el stock.'
                : `Se cargará al saldo de ${customerName}.`}
            </ThemedText>

            {error ? (
              <ThemedText type="small" style={{ color: errorColor }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.footer}>
              <Pressable
                onPress={close}
                disabled={delivering}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                accessibilityState={{ disabled: delivering }}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: delivering || pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText type="smallBold">Volver</ThemedText>
              </Pressable>

              <Pressable
                onPress={requestDeliver}
                disabled={delivering}
                accessibilityRole="button"
                accessibilityLabel="Entregar pedido"
                accessibilityState={{ disabled: delivering, busy: delivering }}
                style={({ pressed }) => [
                  styles.primary,
                  {
                    backgroundColor: theme.text,
                    opacity: delivering || pressed ? 0.7 : 1,
                  },
                ]}>
                {delivering ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: theme.background }}>
                    Entregar
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
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
