// Estado y acciones del cobro del modal: efectivo, fiado y cliente elegido.

import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { resolveCashPayment } from '@/components/sell/cash-payment';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useCustomers } from '@/hooks/use-customers';
import { useRecordSale, type RecordedSale } from '@/hooks/use-record-sale';
import { hasUnusualQuantity, type Cart } from '@/lib/cart';
import type { PaymentMethod } from '@/lib/checkout';
import { formatCents } from '@/lib/money';
import { SALE_CUSTOMER_REQUIRED } from '@/lib/sell-messages';

export type ModalView = 'cart' | 'customers' | 'create';

type Options = {
  cart: Cart;
  totalCents: number;
  onClose: () => void;
  onSaved: (sale: RecordedSale) => void;
};

export function useSaleCheckout({ cart, totalCents, onClose, onSaved }: Options) {
  const { customers, loading, error: loadError, reload } = useCustomers();
  const { record, saving, error, clearError } = useRecordSale();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [view, setView] = useState<ModalView>('cart');
  const [tendered, setTendered] = useState('');
  const payment = useMemo(
    () => resolveCashPayment(totalCents, tendered),
    [totalCents, tendered]
  );
  const reset = useCallback(() => {
    setTendered('');
    setPaymentMethod('cash');
    setCustomer(null);
    setView('cart');
    clearError();
  }, [clearError]);
  const handleTendered = useCallback(
    (text: string) => {
      setTendered(text);
      clearError();
    },
    [clearError]
  );
  const changeMethod = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethod(method);
      clearError();
    },
    [clearError]
  );
  const save = useCallback(async () => {
    const saved = await record(
      cart,
      paymentMethod,
      paymentMethod === 'credit' ? customer : null
    );
    if (saved) {
      reset();
      onSaved(saved);
    }
  }, [cart, customer, onSaved, paymentMethod, record, reset]);
  const handleConfirm = useCallback(() => {
    if (saving || cart.lines.length === 0) {
      return;
    }
    if (paymentMethod === 'cash' && !payment.ok) {
      return;
    }
    if (paymentMethod === 'credit' && !customer) {
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
  }, [cart, customer, payment.ok, paymentMethod, save, saving, totalCents]);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    reset();
    onClose();
  }, [onClose, reset, saving]);

  const handleCustomer = useCallback(
    (next: CustomerWithBalance) => {
      setCustomer(next);
      setView('cart');
      clearError();
    },
    [clearError]
  );

  const handleCreated = useCallback(
    (next: CustomerWithBalance) => {
      setCustomer(next);
      setView('cart');
      clearError();
      void reload();
    },
    [clearError, reload]
  );

  const missingCustomer = paymentMethod === 'credit' && customer === null;
  const disabled =
    cart.lines.length === 0 || (paymentMethod === 'cash' && !payment.ok) || missingCustomer;
  const footerError = missingCustomer
    ? SALE_CUSTOMER_REQUIRED
    : paymentMethod === 'cash' && !payment.ok
      ? payment.error
      : error;

  return {
    view,
    setView,
    paymentMethod,
    changeMethod,
    customer,
    tendered,
    payment,
    saving,
    footerError,
    disabled,
    customers,
    loading,
    loadError,
    reload,
    handleTendered,
    handleConfirm,
    handleClose,
    handleCustomer,
    handleCreated,
  };
}
