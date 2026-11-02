// Modal de cobro: efectivo o fiado, elección de cliente y confirmación.

import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerCreateForm } from '@/components/sell/customer-create-form';
import { CustomerPicker } from '@/components/sell/customer-picker';
import { SaleCheckoutBody } from '@/components/sell/sale-checkout-body';
import { SaleModalHeader } from '@/components/sell/sale-modal-header';
import { Spacing } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useSaleCheckout } from '@/hooks/use-sale-checkout';
import { useTheme } from '@/hooks/use-theme';
import type { Cart } from '@/lib/cart';
import type { RecordedSale } from '@/hooks/use-record-sale';

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
  const checkout = useSaleCheckout({ cart, totalCents, onClose, onSaved });
  const { reload: reloadCustomers } = checkout;

  // Al abrir se refrescan los saldos (pueden cambiar por ventas o abonos).
  useEffect(() => {
    if (visible) {
      void reloadCustomers();
    }
  }, [visible, reloadCustomers]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={checkout.handleClose}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.safe, { backgroundColor: theme.background }]}>
        {/* El teclado empuja el contenido para que el campo quede visible. */}
        <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
          {checkout.view === 'cart' ? (
            <>
              <SaleModalHeader saving={checkout.saving} onClose={checkout.handleClose} />
              <SaleCheckoutBody
                cart={cart}
                totalCents={totalCents}
                paymentMethod={checkout.paymentMethod}
                onChangePaymentMethod={checkout.changeMethod}
                tendered={checkout.tendered}
                payment={checkout.payment}
                onChangeTendered={checkout.handleTendered}
                customer={checkout.customer}
                onChooseCustomer={() => checkout.setView('customers')}
                error={checkout.footerError}
                saving={checkout.saving}
                disabled={checkout.disabled}
                onConfirm={checkout.handleConfirm}
                onChangeQuantity={onChangeQuantity}
                onRemoveLine={onRemoveLine}
              />
            </>
          ) : checkout.view === 'customers' ? (
            <CustomerPicker
              customers={checkout.customers}
              loading={checkout.loading}
              error={checkout.loadError}
              selectedId={checkout.customer?.id ?? null}
              onSelect={checkout.handleCustomer}
              onCreate={() => checkout.setView('create')}
              onBack={() => checkout.setView('cart')}
              onRetry={checkout.reload}
            />
          ) : (
            <CustomerCreateForm
              onCreated={checkout.handleCreated}
              onCancel={() => checkout.setView('customers')}
            />
          )}
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
