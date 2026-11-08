// Pruebas puras de creación de pedidos: fechas, renglones y totales.

import {
  MAX_ORDER_ITEMS,
  validateNewOrder,
  type NewOrderInput,
  type NewOrderItem,
} from '../order-input';

const TODAY = '2026-11-06';

function line(overrides: Partial<NewOrderItem> = {}): NewOrderItem {
  return { description: 'Pan', quantity: 2, unitPriceCents: 1500, ...overrides };
}

function order(overrides: Partial<NewOrderInput> = {}): NewOrderInput {
  return {
    customerId: 1,
    orderDate: '2026-11-05',
    items: [line()],
    ...overrides,
  };
}

describe('validateNewOrder: casos válidos', () => {
  test('normaliza el pedido y calcula su total', () => {
    const result = validateNewOrder(
      order({
        dueDate: '2026-11-07',
        notes: '  para el recreo  ',
        items: [
          line({ productId: 3, description: '  Pan  ', quantity: 2 }),
          line({ productId: null, description: 'Leche', quantity: 1, unitPriceCents: 2500 }),
        ],
      }),
      TODAY
    );

    expect(result.customerId).toBe(1);
    expect(result.orderDate).toBe('2026-11-05');
    expect(result.dueDate).toBe('2026-11-07');
    expect(result.notes).toBe('para el recreo');
    expect(result.totalCents).toBe(5500);
    expect(result.items[0]).toEqual({
      productId: 3,
      description: 'Pan',
      quantity: 2,
      unitPriceCents: 1500,
      lineTotalCents: 3000,
    });
  });

  test('sin fecha usa el día recibido, no el reloj del sistema', () => {
    const result = validateNewOrder(order({ orderDate: undefined }), TODAY);
    expect(result.orderDate).toBe(TODAY);
  });

  test('las notas vacías se guardan como null y la fecha vacía como null', () => {
    const result = validateNewOrder(order({ notes: '   ', dueDate: '   ' }), TODAY);
    expect(result.notes).toBeNull();
    expect(result.dueDate).toBeNull();
  });

  test('acepta hoy como fecha del pedido', () => {
    expect(() => validateNewOrder(order({ orderDate: TODAY }), TODAY)).not.toThrow();
  });
});

describe('validateNewOrder: rechazos', () => {
  test('rechaza fechas futuras o inválidas', () => {
    expect(() => validateNewOrder(order({ orderDate: '2026-11-07' }), TODAY)).toThrow(
      'futura'
    );
    expect(() => validateNewOrder(order({ orderDate: '2026-02-30' }), TODAY)).toThrow(
      'no es válida'
    );
  });

  test('rechaza una entrega anterior al pedido', () => {
    expect(() => validateNewOrder(order({ dueDate: '2026-11-04' }), TODAY)).toThrow(
      'anterior'
    );
  });

  test('rechaza cliente inválido', () => {
    expect(() => validateNewOrder(order({ customerId: 0 }), TODAY)).toThrow('cliente');
  });

  test('rechaza pedido sin renglones o con demasiados', () => {
    expect(() => validateNewOrder(order({ items: [] }), TODAY)).toThrow('al menos un renglón');
    const tooMany = Array.from({ length: MAX_ORDER_ITEMS + 1 }, () => line());
    expect(() => validateNewOrder(order({ items: tooMany }), TODAY)).toThrow('renglones');
  });

  test('rechaza cantidades, precios y descripciones inválidas', () => {
    expect(() => validateNewOrder(order({ items: [line({ quantity: 0 })] }), TODAY)).toThrow(
      'cantidad'
    );
    expect(() => validateNewOrder(order({ items: [line({ quantity: 1.5 })] }), TODAY)).toThrow(
      'cantidad'
    );
    expect(() =>
      validateNewOrder(order({ items: [line({ unitPriceCents: -1 })] }), TODAY)
    ).toThrow('precio');
    expect(() =>
      validateNewOrder(order({ items: [line({ description: '   ' })] }), TODAY)
    ).toThrow('descripción');
  });

  test('rechaza un producto inválido', () => {
    expect(() => validateNewOrder(order({ items: [line({ productId: 0 })] }), TODAY)).toThrow(
      'producto'
    );
  });

  test('rechaza notas demasiado largas', () => {
    expect(() => validateNewOrder(order({ notes: 'a'.repeat(301) }), TODAY)).toThrow('300');
  });
});
