import type { LedgerItem } from '../../db/customer-ledger';
import {
  buildLedgerRows,
  payAllAmount,
  validatePaymentAmount,
} from '../ledger-rows';
import { formatCents } from '../money';
import { MAX_PAYMENT_CENTS } from '../payment-input';

const venta: LedgerItem = {
  id: 3,
  type: 'sale',
  date: '2026-01-10',
  amountCents: 4500,
  status: 'active',
  voidReason: null,
  items: [
    { quantity: 2, description: 'Coca Cola' },
    { quantity: 1, description: 'Lonche' },
  ],
};

const abono: LedgerItem = {
  id: 8,
  type: 'payment',
  date: '2026-01-12',
  amountCents: 2000,
  status: 'active',
  voidReason: null,
};

describe('buildLedgerRows', () => {
  test('arma el título de la venta con sus renglones', () => {
    const rows = buildLedgerRows([venta, abono]);

    expect(rows.map((row) => row.key)).toEqual(['sale-3', 'payment-8']);
    expect(rows[0].title).toBe('Fiado: 2 x Coca Cola, 1 x Lonche');
    expect(rows[0].amountCents).toBe(4500);
    expect(rows[0].date).toBe('2026-01-10');
    expect(rows[0].isVoid).toBe(false);
    expect(rows[1].title).toBe('Abono');
  });

  test('conserva el orden recibido, del más reciente al más antiguo', () => {
    const rows = buildLedgerRows([abono, venta]);
    expect(rows.map((row) => row.type)).toEqual(['payment', 'sale']);
  });

  test('marca los anulados y conserva su motivo', () => {
    const rows = buildLedgerRows([
      { ...abono, status: 'void', voidReason: 'Abono registrado por error.' },
    ]);

    expect(rows[0].isVoid).toBe(true);
    expect(rows[0].voidReason).toBe('Abono registrado por error.');
  });

  test('una venta sin renglones solo dice Fiado', () => {
    const rows = buildLedgerRows([{ ...venta, items: [] }]);
    expect(rows[0].title).toBe('Fiado');
  });
});

describe('validatePaymentAmount', () => {
  test('acepta un monto válido y lo convierte a centavos', () => {
    expect(validatePaymentAmount('50.00', 10000)).toEqual({ ok: true, amountCents: 5000 });
    expect(validatePaymentAmount('50', 10000)).toEqual({ ok: true, amountCents: 5000 });
    expect(validatePaymentAmount('100', 10000)).toEqual({ ok: true, amountCents: 10000 });
  });

  test('pide ayuda cuando el texto no es un monto', () => {
    expect(validatePaymentAmount('', 1000)).toEqual({
      ok: false,
      error: 'Escribe un monto válido, por ejemplo 50.00.',
    });
    expect(validatePaymentAmount('abc', 1000)).toEqual({
      ok: false,
      error: 'Escribe un monto válido, por ejemplo 50.00.',
    });
  });

  test('rechaza cero', () => {
    expect(validatePaymentAmount('0', 1000)).toEqual({
      ok: false,
      error: 'El abono debe ser mayor a cero.',
    });
  });

  test('rechaza un monto mayor que el saldo', () => {
    expect(validatePaymentAmount('100.01', 10000)).toEqual({
      ok: false,
      error: 'El abono no puede ser mayor que lo que debe',
    });
  });

  test('rechaza un monto mayor al máximo por abono', () => {
    const result = validatePaymentAmount('10000.01', MAX_PAYMENT_CENTS + 100);
    expect(result).toEqual({
      ok: false,
      error: `El abono no puede pasar de ${formatCents(MAX_PAYMENT_CENTS)}.`,
    });
  });
});

describe('payAllAmount', () => {
  test('devuelve el saldo cuando cabe en un solo abono', () => {
    expect(payAllAmount(4500)).toBe(4500);
    expect(payAllAmount(MAX_PAYMENT_CENTS)).toBe(MAX_PAYMENT_CENTS);
  });

  test('devuelve null cuando el saldo supera el máximo', () => {
    expect(payAllAmount(MAX_PAYMENT_CENTS + 1)).toBeNull();
  });

  test('sin deuda devuelve cero', () => {
    expect(payAllAmount(0)).toBe(0);
  });
});
