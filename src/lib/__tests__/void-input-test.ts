// Pruebas de la validación pura de anulación. No importan expo-sqlite.

import { MAX_VOID_REASON_LENGTH, validateVoidInput } from '../void-input';

describe('validateVoidInput', () => {
  it.each([0, -1, 1.5, Number.NaN])('rechaza el id %p', (saleId) => {
    expect(() => validateVoidInput(saleId, 'prueba')).toThrow(
      'El número de venta no es válido.'
    );
  });

  it('rechaza un motivo vacío', () => {
    expect(() => validateVoidInput(1, '')).toThrow(
      'El motivo de la anulación no puede quedar vacío.'
    );
  });

  it('rechaza un motivo de solo espacios', () => {
    expect(() => validateVoidInput(1, '   ')).toThrow(
      'El motivo de la anulación no puede quedar vacío.'
    );
  });

  it(`acepta un motivo de ${MAX_VOID_REASON_LENGTH} caracteres`, () => {
    const reason = 'a'.repeat(MAX_VOID_REASON_LENGTH);
    expect(validateVoidInput(7, reason)).toEqual({ saleId: 7, reason });
  });

  it(`rechaza un motivo de ${MAX_VOID_REASON_LENGTH + 1} caracteres`, () => {
    const reason = 'a'.repeat(MAX_VOID_REASON_LENGTH + 1);
    expect(() => validateVoidInput(7, reason)).toThrow(
      `El motivo no puede pasar de ${MAX_VOID_REASON_LENGTH} caracteres.`
    );
  });

  it('recorta los espacios de los extremos', () => {
    expect(validateVoidInput(3, '  prueba  ')).toEqual({ saleId: 3, reason: 'prueba' });
  });
});
