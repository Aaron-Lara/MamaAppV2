// Pruebas de los datos que muestra la revisión antes de guardar una compra.

import {
  emptyPurchaseForm,
  emptyPurchaseLine,
  type PurchaseFormValues,
} from '../purchase-form';
import { buildPurchaseReview } from '../purchase-review';

function form(overrides: Partial<PurchaseFormValues> = {}): PurchaseFormValues {
  return {
    ...emptyPurchaseForm(),
    lines: [
      {
        ...emptyPurchaseLine('a'),
        description: 'Taco',
        units: '50',
        cost: '250',
      },
    ],
    ...overrides,
  };
}

describe('buildPurchaseReview', () => {
  test('muestra fecha, proveedor, productos y total en pesos', () => {
    const review = buildPurchaseReview({
      dateLabel: 'Hoy',
      values: form({ store: ' La Central ' }),
      lineTotals: {
        a: { costCents: 25000, costMxnCents: 25000, unitCostMxnCents: 500 },
      },
      totalCents: 25000,
      totalMxnCents: 25000,
    });

    expect(review.dateLabel).toBe('Hoy');
    expect(review.storeLabel).toBe('La Central');
    expect(review.currencyLabel).toBe('Pesos (MXN)');
    expect(review.exchangeRateLabel).toBeNull();
    expect(review.lines[0]).toMatchObject({
      title: 'Taco',
      unitsLabel: '50 unidades',
      totalLabel: '$250.00',
      totalMxnLabel: null,
      unitLabel: '$5.00',
      unitMxnLabel: null,
    });
    expect(review.totalLabel).toBe('$250.00');
    expect(review.totalMxnLabel).toBeNull();
  });

  test('en dólares muestra el costo original y el equivalente en pesos', () => {
    const review = buildPurchaseReview({
      dateLabel: 'Ayer',
      values: form({
        store: '',
        currency: 'USD',
        exchangeRate: '20.5',
        lines: [
          {
            ...emptyPurchaseLine('a'),
            description: 'Caja',
            units: '2',
            cost: '10',
          },
        ],
      }),
      lineTotals: {
        a: { costCents: 1000, costMxnCents: 20500, unitCostMxnCents: 10250 },
      },
      totalCents: 1000,
      totalMxnCents: 20500,
    });

    expect(review.storeLabel).toBeNull();
    expect(review.currencyLabel).toBe('Dólares (USD)');
    expect(review.exchangeRateLabel).toBe('20.5 pesos por dólar');
    expect(review.lines[0]).toMatchObject({
      unitsLabel: '2 unidades',
      totalLabel: 'US$10.00',
      totalMxnLabel: '$205.00',
      unitLabel: 'US$5.00',
      unitMxnLabel: '$102.50',
    });
    expect(review.totalLabel).toBe('US$10.00');
    expect(review.totalMxnLabel).toBe('$205.00');
  });

  test('usa una sola unidad en singular y nombre del producto si falta descripción', () => {
    const review = buildPurchaseReview({
      dateLabel: 'Hoy',
      values: form({
        lines: [
          {
            ...emptyPurchaseLine('a'),
            productName: 'Coca',
            description: '',
            units: '1',
            cost: '10',
          },
        ],
      }),
      lineTotals: {
        a: { costCents: 1000, costMxnCents: 1000, unitCostMxnCents: 1000 },
      },
      totalCents: 1000,
      totalMxnCents: 1000,
    });

    expect(review.lines[0].title).toBe('Coca');
    expect(review.lines[0].unitsLabel).toBe('1 unidad');
    expect(review.lines[0].unitLabel).toBe('$10.00');
  });
});
