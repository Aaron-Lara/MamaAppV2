// Pruebas de la validación pura de abonos. No importan expo-sqlite.

import {
  MAX_PAYMENT_CENTS,
  MAX_PAYMENT_NOTE_LENGTH,
  validatePaymentInput,
} from '../payment-input';

describe('validatePaymentInput', () => {
  it('acepta un abono válido y recorta la nota', () => {
    expect(validatePaymentInput(7, 1000, '  abono  ')).toEqual({
      customerId: 7,
      amountCents: 1000,
      note: 'abono',
    });
  });

  it('acepta el monto máximo', () => {
    expect(validatePaymentInput(1, MAX_PAYMENT_CENTS)).toEqual({
      customerId: 1,
      amountCents: MAX_PAYMENT_CENTS,
      note: null,
    });
  });

  it('convierte una nota vacía o de solo espacios en null', () => {
    expect(validatePaymentInput(1, 100, '   ').note).toBeNull();
    expect(validatePaymentInput(1, 100, '').note).toBeNull();
    expect(validatePaymentInput(1, 100).note).toBeNull();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rechaza el cliente %p',
    (customerId) => {
      expect(() => validatePaymentInput(customerId, 100)).toThrow(
        'El cliente del abono no es válido.'
      );
    }
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el monto %p',
    (amountCents) => {
      expect(() => validatePaymentInput(1, amountCents)).toThrow();
    }
  );

  it('rechaza un monto mayor al tope', () => {
    expect(() => validatePaymentInput(1, MAX_PAYMENT_CENTS + 1)).toThrow(
      'El abono no puede pasar de $10,000.00.'
    );
  });

  it(`acepta una nota de ${MAX_PAYMENT_NOTE_LENGTH} caracteres`, () => {
    const note = 'a'.repeat(MAX_PAYMENT_NOTE_LENGTH);
    expect(validatePaymentInput(1, 100, note).note).toBe(note);
  });

  it(`rechaza una nota de ${MAX_PAYMENT_NOTE_LENGTH + 1} caracteres`, () => {
    const note = 'a'.repeat(MAX_PAYMENT_NOTE_LENGTH + 1);
    expect(() => validatePaymentInput(1, 100, note)).toThrow(
      `La nota no puede pasar de ${MAX_PAYMENT_NOTE_LENGTH} caracteres.`
    );
  });

  it('rechaza una nota que no es texto', () => {
    expect(() => validatePaymentInput(1, 100, 123 as unknown as string)).toThrow(
      'La nota del abono no es válida.'
    );
  });
});
