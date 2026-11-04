// Pruebas de los errores del formulario de compras: todos a la vez.

import {
  emptyPurchaseForm,
  emptyPurchaseLine,
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

describe('validatePurchaseForm: errores', () => {
  test('junta todos los errores de campos y renglones a la vez', () => {
    const result = validatePurchaseForm(
      form({
        store: 'x'.repeat(61),
        currency: 'USD',
        exchangeRate: '0',
        lines: [
          {
            ...emptyPurchaseLine('a'),
            description: '',
            units: '0',
            cost: 'abc',
          },
          {
            ...emptyPurchaseLine('b'),
            description: 'Bien',
            units: '2',
            cost: '10',
          },
        ],
      }),
      TODAY
    );
    expect(result.ok).toBe(false);
    expect(result.input).toBeNull();
    expect(result.errors.store).toBeTruthy();
    expect(result.errors.exchangeRate).toBeTruthy();
    expect(result.errors.lines.a.description).toBeTruthy();
    expect(result.errors.lines.a.units).toBeTruthy();
    expect(result.errors.lines.a.cost).toBeTruthy();
    expect(result.errors.lines.b).toBeUndefined();
  });

  test('rechaza unidades fuera de rango o con decimales', () => {
    for (const units of ['0', '10001', '1.5', '']) {
      const result = validatePurchaseForm(
        form({
          lines: [
            {
              ...emptyPurchaseLine('a'),
              description: 'Caja',
              units,
              cost: '10',
            },
          ],
        }),
        TODAY
      );
      expect(result.errors.lines.a.units).toBeTruthy();
    }
  });

  test('rechaza descripciones vacías o demasiado largas', () => {
    for (const description of ['', '   ', 'x'.repeat(61)]) {
      const result = validatePurchaseForm(
        form({
          lines: [
            { ...emptyPurchaseLine('a'), description, units: '1', cost: '10' },
          ],
        }),
        TODAY
      );
      expect(result.errors.lines.a.description).toBeTruthy();
    }
  });

  test('rechaza un costo mayor al tope', () => {
    const result = validatePurchaseForm(
      form({
        lines: [
          {
            ...emptyPurchaseLine('a'),
            description: 'Caja',
            units: '1',
            cost: '10000.01',
          },
        ],
      }),
      TODAY
    );
    expect(result.errors.lines.a.cost).toContain('$10,000.00');
  });

  test('no permite guardar sin renglones', () => {
    const result = validatePurchaseForm(form({ lines: [] }), TODAY);
    expect(result.errors.general).toBeTruthy();
    expect(result.ok).toBe(false);
  });
});
