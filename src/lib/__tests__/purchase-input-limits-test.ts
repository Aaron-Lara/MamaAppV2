// Pruebas de límites y errores de la validación pura de compras.

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_PURCHASE_LINE_CENTS,
  MAX_PURCHASE_LINES,
  MAX_PURCHASE_UNITS,
  MAX_STORE_LENGTH,
  validatePurchaseInput,
  type NewPurchaseInput,
  type NewPurchaseLineInput,
} from '../purchase-input';

const TODAY = '2026-11-03';

function line(overrides: Partial<NewPurchaseLineInput> = {}): NewPurchaseLineInput {
  return { description: 'Caja de 24', units: 24, costCents: 12000, ...overrides };
}

function purchase(overrides: Partial<NewPurchaseInput> = {}): NewPurchaseInput {
  return {
    purchaseDate: '2026-11-02',
    store: 'La Central',
    currency: 'MXN',
    lines: [line()],
    ...overrides,
  };
}

describe('validatePurchaseInput: límites y errores', () => {
  test('acepta el máximo de renglones y rechaza uno más', () => {
    const many = Array.from({ length: MAX_PURCHASE_LINES }, (_, index) =>
      line({ description: `Renglón ${index + 1}` })
    );
    expect(() => validatePurchaseInput(purchase({ lines: many }), TODAY)).not.toThrow();
    expect(() =>
      validatePurchaseInput(purchase({ lines: [...many, line()] }), TODAY)
    ).toThrow(`${MAX_PURCHASE_LINES}`);
  });

  test('acepta el máximo de unidades y rechaza fuera de rango', () => {
    expect(() =>
      validatePurchaseInput(purchase({ lines: [line({ units: MAX_PURCHASE_UNITS })] }), TODAY)
    ).not.toThrow();
    for (const units of [0, -1, 1.5, MAX_PURCHASE_UNITS + 1]) {
      expect(() => validatePurchaseInput(purchase({ lines: [line({ units })] }), TODAY)).toThrow();
    }
  });

  test('acepta costo cero y rechaza negativos, decimales o el exceso', () => {
    expect(() =>
      validatePurchaseInput(purchase({ lines: [line({ costCents: 0 })] }), TODAY)
    ).not.toThrow();
    for (const costCents of [-1, 1.5, MAX_PURCHASE_LINE_CENTS + 1]) {
      expect(() =>
        validatePurchaseInput(purchase({ lines: [line({ costCents })] }), TODAY)
      ).toThrow();
    }
  });

  test('rechaza descripciones vacías o demasiado largas', () => {
    for (const description of ['', '   ', 'x'.repeat(MAX_DESCRIPTION_LENGTH + 1)]) {
      expect(() =>
        validatePurchaseInput(purchase({ lines: [line({ description })] }), TODAY)
      ).toThrow();
    }
  });

  test('rechaza tiendas demasiado largas', () => {
    expect(() =>
      validatePurchaseInput(purchase({ store: 'x'.repeat(MAX_STORE_LENGTH + 1) }), TODAY)
    ).toThrow();
  });

  test('rechaza productos y monedas inválidas', () => {
    for (const productId of [0, -1, 1.5]) {
      expect(() =>
        validatePurchaseInput(purchase({ lines: [line({ productId })] }), TODAY)
      ).toThrow();
    }
    const badCurrency = purchase() as unknown as NewPurchaseInput;
    badCurrency.currency = 'EUR' as NewPurchaseInput['currency'];
    expect(() => validatePurchaseInput(badCurrency, TODAY)).toThrow('moneda');
  });

  test('en dólares el tipo de cambio es obligatorio y válido', () => {
    expect(() =>
      validatePurchaseInput(purchase({ currency: 'USD' }), TODAY)
    ).toThrow('tipo de cambio');
    for (const exchangeRateX10000 of [9999, 1000001]) {
      expect(() =>
        validatePurchaseInput(
          purchase({ currency: 'USD', exchangeRateX10000 }),
          TODAY
        )
      ).toThrow('1 y 100');
    }
  });

  test('rechaza fechas inválidas', () => {
    expect(() =>
      validatePurchaseInput(purchase({ purchaseDate: '2026-02-30' }), TODAY)
    ).toThrow('fecha');
    expect(() => validatePurchaseInput(purchase(), '2026-13-01')).toThrow('hoy');
  });
});
