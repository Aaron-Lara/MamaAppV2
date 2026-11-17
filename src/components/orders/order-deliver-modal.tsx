// Modal para entregar un pedido: efectivo o fiado y confirmación final.

import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { PaymentMethodPicker } from '@/components/sell/payment-method-picker';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
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
              <ThemedText type="small" style={{ color: theme.danger }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.footer}>
              <AppButton
                label="Volver"
                variant="secondary"
                disabled={delivering}
                onPress={close}
                accessibilityLabel="Volver"
              />
              <AppButton
                label="Entregar"
                loading={delivering}
                disabled={delivering}
                onPress={requestDeliver}
                accessibilityLabel="Entregar pedido"
              />
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
});
