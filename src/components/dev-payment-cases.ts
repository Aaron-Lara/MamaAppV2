// TEMPORAL: casos n) a s) de abonos del panel de pruebas. Se borra con el panel.

export type DevPaymentCaseId =
  | 'creditSale'
  | 'payTen'
  | 'overpay'
  | 'voidPay'
  | 'badPayments'
  | 'voidCreditSale';

export type DevPaymentCase = { id: DevPaymentCaseId; label: string; expected: string };

export const DEV_PAYMENT_CASES: DevPaymentCase[] = [
  { id: 'creditSale', label: 'n) Fiado de 2 x $15.00 a "TEST cliente"', expected: 'Debe sube $30.00' },
  { id: 'payTen', label: 'o) Abono de $10.00', expected: 'Debe baja $10.00' },
  { id: 'overpay', label: 'p) Abono mayor que el saldo', expected: 'error, nada cambia' },
  { id: 'voidPay', label: 'q) Anular el abono de o)', expected: 'Debe sube $10.00' },
  { id: 'badPayments', label: 'r) Abono de $0 y cliente 999999', expected: 'errores, nada cambia' },
  { id: 'voidCreditSale', label: 's) Anular la venta de n) con abonos', expected: 'error, nada cambia' },
];

export function isPaymentCase(id: string): id is DevPaymentCaseId {
  return DEV_PAYMENT_CASES.some((testCase) => testCase.id === id);
}
