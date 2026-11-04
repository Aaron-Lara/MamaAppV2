// Pruebas del formulario puro de compras: casos válidos y totales.

import {
  emptyPurchaseForm,
  emptyPurchaseLine,
  exchangeRateToInputText,
  validatePurchaseForm,
  type PurchaseFormValues,
} from '../purchase-form';

const TODAY = '2026-11-04';

function form(overrides: Partial<PurchaseFormValues> = {}): PurchaseFormValues {
  return {
    ...emptyPurchaseForm(),
    lines: [emptyPurchaseLine('a')],
    ...overrides,
  };
}

describe('validatePurchaseForm: casos válidos', () => {
  test('convierte una compra en pesos', () => {
    const values = form({
      store: ' La Central ',
      lines: [
        {
          ...emptyPurchaseLine('a'),
          description: 'Caja de 24',
          units: '24',
          cost: '120.00',
        },
      ],
    });
    const result = validatePurchaseForm(values, TODAY);
    expect(result.ok).toBe(true);
    expect(result.input).toEqual({
      purchaseDate: TODAY,
      store: 'La Central',
      currency: 'MXN',
      exchangeRateX10000: 10000,
      lines: [
        {
          productId: null,
          description: 'Caja de 24',
          units: 24,
          costCents: 12000,
        },
      ],
    });
    expect(result.totalCents).toBe(12000);
    expect(result.totalMxnCents).toBe(12000);
    expect(result.lines.a.unitCostMxnCents).toBe(500);
  });

  test('acepta costo cero y calcula costo por unidad cero', () => {
    const result = validatePurchaseForm(
      form({
        lines: [
          {
            ...emptyPurchaseLine('a'),
            description: 'Muestra',
            units: '10',
            cost: '0',
          },
        ],
      }),
      TODAY
    );
    expect(result.ok).toBe(true);
    expect(result.totalCents).toBe(0);
    expect(result.lines.a.unitCostMxnCents).toBe(0);
  });

  test('en dólares suma los renglones ya convertidos', () => {
    const result = validatePurchaseForm(
      form({
        currency: 'USD',
        exchangeRate: '1.5',
        lines: [
          { ...emptyPurchaseLine('a'), description: 'A', units: '1', cost: '0.01' },
          { ...emptyPurchaseLine('b'), description: 'B', units: '1', cost: '0.01' },
        ],
      }),
      TODAY
    );
    expect(result.ok).toBe(true);
    expect(result.totalCents).toBe(2);
    // Cada renglón redondea 1.5 a 2; convertir el total daría 3.
    expect(result.totalMxnCents).toBe(4);
    expect(result.lines.a.costMxnCents).toBe(2);
  });

  test('en pesos ignora el texto del tipo de cambio', () => {
    const result = validatePurchaseForm(
      form({
        currency: 'MXN',
        exchangeRate: 'no importa',
        lines: [
          {
            ...emptyPurchaseLine('a'),
            description: 'Caja',
            units: '1',
            cost: '10',
          },
        ],
      }),
      TODAY
    );
    expect(result.ok).toBe(true);
    expect(result.exchangeRateX10000).toBe(10000);
  });

  test('conserva el producto elegido y su descripción', () => {
    const result = validatePurchaseForm(
      form({
        lines: [
          {
            ...emptyPurchaseLine('a'),
            productId: 7,
            productName: 'Coca',
            trackStock: true,
            description: 'Coca de 600 ml',
            units: '12',
            cost: '100',
          },
        ],
      }),
      TODAY
    );
    expect(result.input?.lines[0].productId).toBe(7);
    expect(result.input?.lines[0].description).toBe('Coca de 600 ml');
  });
});

describe('exchangeRateToInputText', () => {
  test('quita ceros sobrantes sin perder decimales', () => {
    expect(exchangeRateToInputText(205000)).toBe('20.5');
    expect(exchangeRateToInputText(199999)).toBe('19.9999');
    expect(exchangeRateToInputText(200000)).toBe('20');
  });
});
