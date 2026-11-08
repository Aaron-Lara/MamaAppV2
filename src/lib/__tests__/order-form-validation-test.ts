// Pruebas de la validación del formulario de pedidos.

import {
  parseOrderPrice,
  parseOrderQuantity,
  validateOrderForm,
} from '../order-form-validation';
import type { OrderFormValues, OrderLineForm } from '../order-form-types';

const TODAY = '2026-11-06';

function line(overrides: Partial<OrderLineForm> = {}): OrderLineForm {
  return {
    key: 'line-1',
    productId: 3,
    productName: 'Pan',
    description: 'Pan',
    quantity: '2',
    unitPrice: '12.50',
    ...overrides,
  };
}

function values(overrides: Partial<OrderFormValues> = {}): OrderFormValues {
  return {
    customerId: 1,
    customerName: 'Ana',
    orderDate: '2026-11-05',
    dueDate: '2026-11-07',
    notes: '',
    lines: [line()],
    ...overrides,
  };
}

describe('parseOrderQuantity y parseOrderPrice', () => {
  test('acepta cantidades enteras dentro del rango', () => {
    expect(parseOrderQuantity('1')).toBe(1);
    expect(parseOrderQuantity('100')).toBe(100);
    expect(parseOrderQuantity('0')).toBeNull();
    expect(parseOrderQuantity('1.5')).toBeNull();
    expect(parseOrderQuantity('')).toBeNull();
  });

  test('convierte precios y devuelve el mensaje de error', () => {
    expect(parseOrderPrice('12.50')).toEqual({ cents: 1250, error: null });
    expect(parseOrderPrice('$7')).toEqual({ cents: 700, error: null });
    expect(parseOrderPrice('')).toEqual({
      cents: null,
      error: 'Escribe el precio unitario.',
    });
    expect(parseOrderPrice('abc').cents).toBeNull();
    expect(parseOrderPrice('abc').error).toContain('números');
  });
});

describe('validateOrderForm: casos válidos', () => {
  test('arma el pedido con fechas, notas y total', () => {
    const result = validateOrderForm(
      values({
        notes: '  para el recreo  ',
        lines: [
          line({ quantity: '2', unitPrice: '12.50' }),
          line({ key: 'line-2', description: 'Leche', quantity: '1', unitPrice: '25' }),
        ],
      }),
      TODAY
    );

    expect(result.ok).toBe(true);
    expect(result.input).toEqual({
      customerId: 1,
      orderDate: '2026-11-05',
      dueDate: '2026-11-07',
      notes: 'para el recreo',
      items: [
        { productId: 3, description: 'Pan', quantity: 2, unitPriceCents: 1250 },
        { productId: 3, description: 'Leche', quantity: 1, unitPriceCents: 2500 },
      ],
    });
    expect(result.totalCents).toBe(5000);
    expect(result.lineTotals['line-1']).toBe(2500);
  });

  test('la fecha de entrega vacía se guarda como null', () => {
    const result = validateOrderForm(values({ dueDate: '   ' }), TODAY);
    expect(result.ok).toBe(true);
    expect(result.input?.dueDate).toBeNull();
  });
});

describe('validateOrderForm: errores', () => {
  test('exige cliente', () => {
    const result = validateOrderForm(values({ customerId: null }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.errors.customer).toBe('Elige un cliente.');
  });

  test('rechaza fechas futuras, inválidas o de entrega anterior', () => {
    expect(validateOrderForm(values({ orderDate: '2026-11-07' }), TODAY).errors.orderDate).toContain(
      'futura'
    );
    expect(validateOrderForm(values({ orderDate: '2026-02-30' }), TODAY).errors.orderDate).toBeDefined();
    expect(
      validateOrderForm(values({ dueDate: '2026-11-04' }), TODAY).errors.dueDate
    ).toContain('anterior');
    expect(validateOrderForm(values({ dueDate: '2026-13-01' }), TODAY).errors.dueDate).toBeDefined();
  });

  test('rechaza notas demasiado largas', () => {
    const result = validateOrderForm(values({ notes: 'a'.repeat(301) }), TODAY);
    expect(result.errors.notes).toContain('300');
  });

  test('exige descripción, cantidad y precio por renglón', () => {
    const result = validateOrderForm(
      values({
        lines: [
          line({ description: '   ' }),
          line({ key: 'line-2', quantity: '0' }),
          line({ key: 'line-3', unitPrice: '' }),
        ],
      }),
      TODAY
    );

    expect(result.ok).toBe(false);
    expect(result.errors.lines['line-1']?.description).toBeDefined();
    expect(result.errors.lines['line-2']?.quantity).toBeDefined();
    expect(result.errors.lines['line-3']?.unitPrice).toBeDefined();
  });

  test('rechaza un pedido sin renglones', () => {
    const result = validateOrderForm(values({ lines: [] }), TODAY);
    expect(result.ok).toBe(false);
    expect(result.errors.general).toContain('al menos un producto');
  });

  test('marca los renglones incompletos sin incluirlos en el total', () => {
    const result = validateOrderForm(
      values({
        lines: [
          line(),
          line({ key: 'line-2', quantity: 'abc', unitPrice: '10' }),
        ],
      }),
      TODAY
    );
    expect(result.ok).toBe(false);
    expect(result.totalCents).toBe(2500);
    expect(result.lineTotals['line-2']).toBeNull();
  });
});
