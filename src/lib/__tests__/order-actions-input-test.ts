// Pruebas puras de entrega, cancelación, atraso y renglones de pedido.

import {
  isOrderOverdue,
  validateCancelOrderInput,
  validateDeliverOrderInput,
} from '../order-input';
import { orderItemRowsToSaleItems, orderItemRowsTotalCents } from '../order-rows';

const TODAY = '2026-11-06';

describe('validateDeliverOrderInput', () => {
  test('valida efectivo y fiado con la fecha de hoy por defecto', () => {
    expect(
      validateDeliverOrderInput({ orderId: 7, paymentMethod: 'cash' }, TODAY)
    ).toEqual({ orderId: 7, paymentMethod: 'cash', deliveredAt: TODAY });
    expect(
      validateDeliverOrderInput(
        { orderId: 7, paymentMethod: 'credit', deliveredAt: '2026-11-04' },
        TODAY
      )
    ).toEqual({
      orderId: 7,
      paymentMethod: 'credit',
      deliveredAt: '2026-11-04',
    });
  });

  test('rechaza forma de pago, id y fecha inválidos', () => {
    expect(() =>
      validateDeliverOrderInput(
        { orderId: 1, paymentMethod: 'card' as 'cash' },
        TODAY
      )
    ).toThrow('forma de pago');
    expect(() =>
      validateDeliverOrderInput({ orderId: 0, paymentMethod: 'cash' }, TODAY)
    ).toThrow('pedido');
    expect(() =>
      validateDeliverOrderInput(
        { orderId: 1, paymentMethod: 'cash', deliveredAt: '2026-11-07' },
        TODAY
      )
    ).toThrow('futura');
  });
});

describe('validateCancelOrderInput', () => {
  test('cancela solo con el id y usa hoy por defecto', () => {
    expect(validateCancelOrderInput({ orderId: 3 }, TODAY)).toEqual({
      orderId: 3,
      cancelledAt: TODAY,
    });
    expect(
      validateCancelOrderInput({ orderId: 3, cancelledAt: '2026-11-04' }, TODAY)
    ).toEqual({ orderId: 3, cancelledAt: '2026-11-04' });
  });

  test('rechaza id y fechas inválidas', () => {
    expect(() => validateCancelOrderInput({ orderId: -1 }, TODAY)).toThrow('pedido');
    expect(() =>
      validateCancelOrderInput({ orderId: 3, cancelledAt: '2026-11-07' }, TODAY)
    ).toThrow('futura');
    expect(() =>
      validateCancelOrderInput({ orderId: 3, cancelledAt: 'ayer' }, TODAY)
    ).toThrow('válida');
  });
});

describe('order-rows', () => {
  test('convierte renglones de pedido al formato de venta', () => {
    expect(
      orderItemRowsToSaleItems([
        {
          product_id: 9,
          description: 'Pan',
          quantity: 2,
          unit_price_cents: 1500,
        },
      ])
    ).toEqual([
      { productId: 9, description: 'Pan', quantity: 2, unitPriceCents: 1500 },
    ]);
  });

  test('suma el total de los renglones guardados', () => {
    expect(
      orderItemRowsTotalCents([
        { product_id: 9, description: 'Pan', quantity: 2, unit_price_cents: 1500 },
        { product_id: null, description: 'Leche', quantity: 1, unit_price_cents: 2500 },
      ])
    ).toBe(5500);
  });
});

describe('isOrderOverdue', () => {
  test('solo marca pendientes con fecha vencida', () => {
    expect(isOrderOverdue('pending', '2026-11-05', TODAY)).toBe(true);
    expect(isOrderOverdue('pending', TODAY, TODAY)).toBe(false);
    expect(isOrderOverdue('pending', null, TODAY)).toBe(false);
    expect(isOrderOverdue('delivered', '2026-11-05', TODAY)).toBe(false);
    expect(isOrderOverdue('cancelled', '2026-11-05', TODAY)).toBe(false);
  });
});
