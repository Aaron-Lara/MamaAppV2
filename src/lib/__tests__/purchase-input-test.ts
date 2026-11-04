// Pruebas de la validación pura de compras: fechas, moneda, renglones y totales.

import { convertToMxnCents } from '../exchange-rate';
import {
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

describe('validatePurchaseInput: casos válidos', () => {
  test('normaliza una compra en pesos', () => {
    const result = validatePurchaseInput(purchase(), TODAY);
    expect(result.purchaseDate).toBe('2026-11-02');
    expect(result.store).toBe('La Central');
    expect(result.exchangeRateX10000).toBe(10000);
    expect(result.totalCents).toBe(12000);
    expect(result.totalMxnCents).toBe(12000);
    expect(result.lines[0]).toEqual({
      productId: null,
      description: 'Caja de 24',
      units: 24,
      costCents: 12000,
      costMxnCents: 12000,
    });
  });

  test('en MXN el tipo de cambio siempre es 10000', () => {
    const result = validatePurchaseInput(purchase({ exchangeRateX10000: 5 }), TODAY);
    expect(result.exchangeRateX10000).toBe(10000);
  });

  test('sin fecha usa el día recibido, no el reloj del sistema', () => {
    const result = validatePurchaseInput(purchase({ purchaseDate: undefined }), TODAY);
    expect(result.purchaseDate).toBe(TODAY);
  });

  test('acepta hoy y ayer, pero no una fecha futura', () => {
    expect(() => validatePurchaseInput(purchase({ purchaseDate: TODAY }), TODAY)).not.toThrow();
    expect(() =>
      validatePurchaseInput(purchase({ purchaseDate: '2026-11-04' }), TODAY)
    ).toThrow('futura');
  });

  test('la tienda vacía se guarda como null', () => {
    const result = validatePurchaseInput(purchase({ store: '   ' }), TODAY);
    expect(result.store).toBeNull();
  });

  test('guarda la descripción tal como se escribió', () => {
    const result = validatePurchaseInput(
      purchase({ lines: [line({ description: '  Caja de 24  ' })] }),
      TODAY
    );
    expect(result.lines[0].description).toBe('  Caja de 24  ');
  });
});

describe('validatePurchaseInput: dólares y redondeo', () => {
  test('convierte cada renglón y suma los convertidos', () => {
    const result = validatePurchaseInput(
      purchase({
        currency: 'USD',
        exchangeRateX10000: 15000,
        lines: [
          line({ description: 'A', units: 1, costCents: 1 }),
          line({ description: 'B', units: 1, costCents: 1 }),
        ],
      }),
      TODAY
    );
    expect(result.totalCents).toBe(2);
    expect(result.totalMxnCents).toBe(4);
    // Convertir el total daría 3, distinto a sumar los renglones convertidos.
    expect(convertToMxnCents(result.totalCents, 15000)).toBe(3);
  });

  test('el redondeo de la mitad sube en cada renglón', () => {
    const result = validatePurchaseInput(
      purchase({
        currency: 'USD',
        exchangeRateX10000: 15000,
        lines: [line({ units: 1, costCents: 3 })],
      }),
      TODAY
    );
    expect(result.lines[0].costMxnCents).toBe(5);
  });
});

