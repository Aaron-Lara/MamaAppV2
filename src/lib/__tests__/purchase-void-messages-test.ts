// Pruebas de los textos de anulación de compras.

import {
  PURCHASE_VOID_REASON,
  purchaseVoidConfirmMessage,
  translateVoidPurchaseError,
} from '../purchase-void-messages';

describe('purchaseVoidConfirmMessage', () => {
  test('incluye el total en pesos y el aviso de inventario', () => {
    const message = purchaseVoidConfirmMessage(17500);
    expect(message).toContain('$175.00');
    expect(message).toContain(
      'Se restarán del inventario las unidades que sumó.'
    );
    expect(message).toContain("Sin stock · revisar conteo");
  });
});

describe('translateVoidPurchaseError', () => {
  test('traduce una compra ya anulada', () => {
    expect(
      translateVoidPurchaseError(new Error('La compra ya está anulada.'))
    ).toBe('Esa compra ya se anuló.');
  });

  test('traduce una compra que no existe', () => {
    expect(
      translateVoidPurchaseError(new Error('La compra 7 no existe.'))
    ).toBe('Esa compra ya no existe.');
  });

  test('usa el respaldo sin texto técnico', () => {
    expect(translateVoidPurchaseError(new Error('SQLITE_BUSY'))).toBe(
      'No se pudo anular la compra. Inténtalo de nuevo.'
    );
    expect(translateVoidPurchaseError('otra cosa')).toBe(
      'No se pudo anular la compra. Inténtalo de nuevo.'
    );
  });
});

describe('PURCHASE_VOID_REASON', () => {
  test('es el motivo fijo de la anulación', () => {
    expect(PURCHASE_VOID_REASON).toBe('Compra registrada por error.');
  });
});
