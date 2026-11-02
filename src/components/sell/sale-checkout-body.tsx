// Cuerpo del cobro: renglones, forma de pago y pie de confirmación.

import { CashPayment } from '@/components/sell/cash-payment';
import { CheckoutFooter } from '@/components/sell/checkout-footer';
import { CreditPayment } from '@/components/sell/credit-payment';
import { PaymentMethodPicker } from '@/components/sell/payment-method-picker';
import { SaleLines } from '@/components/sell/sale-lines';
import type { CustomerWithBalance } from '@/db/customers-list';
import type { Cart } from '@/lib/cart';
import type { ChangeResult, PaymentMethod } from '@/lib/checkout';

export type SaleCheckoutBodyProps = {
  cart: Cart;
  totalCents: number;
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (method: PaymentMethod) => void;
  tendered: string;
  payment: ChangeResult;
  onChangeTendered: (text: string) => void;
  customer: CustomerWithBalance | null;
  onChooseCustomer: () => void;
  error: string | null;
  saving: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onChangeQuantity: (key: string, delta: number) => void;
  onRemoveLine: (key: string) => void;
};

export function SaleCheckoutBody({
  cart,
  totalCents,
  paymentMethod,
  onChangePaymentMethod,
  tendered,
  payment,
  onChangeTendered,
  customer,
  onChooseCustomer,
  error,
  saving,
  disabled,
  onConfirm,
  onChangeQuantity,
  onRemoveLine,
}: SaleCheckoutBodyProps) {
  return (
    <>
      <SaleLines
        lines={cart.lines}
        onChangeQuantity={onChangeQuantity}
        onRemoveLine={onRemoveLine}
      />

      <PaymentMethodPicker
        method={paymentMethod}
        onChange={onChangePaymentMethod}
        disabled={saving}
      />

      {paymentMethod === 'cash' ? (
        <CashPayment
          totalCents={totalCents}
          value={tendered}
          payment={payment}
          onChangeText={onChangeTendered}
          disabled={saving}
        />
      ) : (
        <CreditPayment customer={customer} onChoose={onChooseCustomer} disabled={saving} />
      )}

      <CheckoutFooter
        totalCents={totalCents}
        totalLabel={paymentMethod === 'credit' ? 'Total fiado' : 'Total'}
        error={error}
        saving={saving}
        disabled={disabled}
        onConfirm={onConfirm}
      />
    </>
  );
}
