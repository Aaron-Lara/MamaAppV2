// Pruebas puras de los mensajes de anulación de gastos.

import { translateVoidExpenseError } from '../expense-void-messages';

describe('translateVoidExpenseError', () => {
  test('traduce un gasto ya anulado', () => {
    expect(
      translateVoidExpenseError(new Error('El gasto ya está anulado.'))
    ).toBe('Ese gasto ya está anulado.');
  });

  test('traduce un gasto que no existe', () => {
    expect(translateVoidExpenseError(new Error('El gasto 9 no existe.'))).toBe(
      'Ese gasto ya no existe.'
    );
  });

  test('usa un mensaje genérico para otros errores', () => {
    expect(translateVoidExpenseError(new Error('fallo técnico'))).toBe(
      'No se pudo anular el gasto. Inténtalo de nuevo.'
    );
    expect(translateVoidExpenseError(null)).toBe(
      'No se pudo anular el gasto. Inténtalo de nuevo.'
    );
  });
});
