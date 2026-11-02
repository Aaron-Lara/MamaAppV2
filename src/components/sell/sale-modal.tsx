// Modal de cobro: renglones, pago en efectivo, confirmación y guardado.

import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CashPayment, resolveCashPayment } from '@/components/sell/cash-payment';
import { CheckoutFooter } from '@/components/sell/checkout-footer';
import { SaleLines } from '@/components/sell/sale-lines';
import { SaleModalHeader } from '@/components/sell/sale-modal-header';
import { Spacing } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useRecordSale, type RecordedSale } from '@/hooks/use-record-sale';
import { useTheme } from '@/hooks/use-theme';
import { hasUnusualQuantity, type Cart } from '@/lib/cart';
import { formatCents } from '@/lib/money';

export type SaleModalProps = {
  visible: boolean;
  cart: Cart;
  totalCents: number;
  onClose: () => void;
  onChangeQuantity: (key: string, delta: number) => void;
  onRemoveLine: (key: string) => void;
  onSaved: (sale: RecordedSale) => void;
};

export function SaleModal({
  visible,
  cart,
  totalCents,
  onClose,
  onChangeQuantity,
  onRemoveLine,
  onSaved,
}: SaleModalProps) {
  const theme = useTheme();
  const keyboardHeight = useKeyboardHeight();
  const { record, saving, error, clearError } = useRecordSale();
  const [tendered, setTendered] = useState('');
  const payment = useMemo(
    () => resolveCashPayment(totalCents, tendered),
    [totalCents, tendered]
  );

  const handleTendered = useCallback(
    (text: string) => {
      setTendered(text);
      clearError();
    },
    [clearError]
  );

  const save = useCallback(async () => {
    const saved = await record(cart);
    if (saved) {
      setTendered('');
      onSaved(saved);
    }
  }, [cart, record, onSaved]);

  const handleConfirm = useCallback(() => {
    if (saving || !payment.ok || cart.lines.length === 0) {
      return;
    }
    if (!hasUnusualQuantity(cart)) {
      void save();
      return;
    }
    Alert.alert(
      'Confirmar venta',
      `Hay cantidades muy altas. Total: ${formatCents(totalCents)}. ¿Cobrar de todos modos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void save() },
      ]
    );
  }, [cart, payment.ok, save, saving, totalCents]);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    setTendered('');
    clearError();
    onClose();
  }, [clearError, onClose, saving]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.safe, { backgroundColor: theme.background }]}>
        {/* El teclado empuja el bloque de cobro para que el campo quede visible. */}
        <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
          <SaleModalHeader saving={saving} onClose={handleClose} />

          <SaleLines
            lines={cart.lines}
            onChangeQuantity={onChangeQuantity}
            onRemoveLine={onRemoveLine}
          />

          <CashPayment
            totalCents={totalCents}
            value={tendered}
            payment={payment}
            onChangeText={handleTendered}
            disabled={saving}
          />

          <CheckoutFooter
            totalCents={totalCents}
            error={payment.ok ? error : payment.error}
            saving={saving}
            disabled={cart.lines.length === 0 || !payment.ok}
            onConfirm={handleConfirm}
          />
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
});
