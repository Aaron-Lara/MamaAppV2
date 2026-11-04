import {
  SUMMARY_SALE_TEXTS,
  translateVoidSaleError,
  UNDO_SALE_TEXTS,
  VOID_FROM_SUMMARY_REASON,
  voidConfirmMessage,
} from '../sale-void-messages';

describe('translateVoidSaleError', () => {
  test('traduce una venta ya anulada', () => {
    expect(
      translateVoidSaleError(new Error('La venta 5 ya está anulada.'), SUMMARY_SALE_TEXTS)
    ).toBe('Esa venta ya no se puede anular.');
  });

  test('traduce una venta que no existe', () => {
    expect(
      translateVoidSaleError(new Error('La venta 5 no existe.'), SUMMARY_SALE_TEXTS)
    ).toBe('Esa venta ya no se puede anular.');
  });

  test('traduce el bloqueo por abonos del cliente', () => {
    expect(
      translateVoidSaleError(
        new Error('Primero anula los abonos de ese cliente'),
        SUMMARY_SALE_TEXTS
      )
    ).toBe('No se puede anular: ese cliente ya tiene abonos.');
  });

  test('no distingue mayúsculas', () => {
    expect(
      translateVoidSaleError(new Error('LA VENTA YA ESTÁ ANULADA.'), SUMMARY_SALE_TEXTS)
    ).toBe('Esa venta ya no se puede anular.');
  });

  test('cualquier otro error usa el mensaje general', () => {
    expect(
      translateVoidSaleError(new Error('SQLITE_BUSY: database is locked'), SUMMARY_SALE_TEXTS)
    ).toBe('No se pudo anular la venta. Inténtalo de nuevo.');
  });

  test('un valor que no es Error usa el mensaje general', () => {
    expect(translateVoidSaleError('falló', SUMMARY_SALE_TEXTS)).toBe(
      'No se pudo anular la venta. Inténtalo de nuevo.'
    );
  });

  test('conserva los textos que usa el hook de deshacer', () => {
    expect(
      translateVoidSaleError(new Error('La venta ya está anulada.'), UNDO_SALE_TEXTS)
    ).toBe('Esa venta ya no se puede deshacer.');
    expect(
      translateVoidSaleError(new Error('Primero anula los abonos'), UNDO_SALE_TEXTS)
    ).toBe('No se puede deshacer: ese cliente ya tiene abonos.');
    expect(translateVoidSaleError(new Error('otro'), UNDO_SALE_TEXTS)).toBe(
      'No se pudo deshacer la venta. Inténtalo de nuevo.'
    );
  });
});

describe('voidConfirmMessage', () => {
  test('pregunta con el total de la venta', () => {
    expect(voidConfirmMessage(4500, false)).toBe('¿Anular la venta de $45.00?');
  });

  test('avisa cuando la venta es de otro día', () => {
    expect(voidConfirmMessage(4500, true)).toBe(
      '¿Anular la venta de $45.00? Esta venta es de otro día: cambiará los totales de ese día.'
    );
  });
});

describe('VOID_FROM_SUMMARY_REASON', () => {
  test('es el motivo fijo de la anulación desde el Resumen', () => {
    expect(VOID_FROM_SUMMARY_REASON).toBe('Anulada desde el Resumen.');
  });
});
