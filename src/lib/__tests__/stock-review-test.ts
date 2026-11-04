import { summarizeStockReview, type StockReviewProduct } from '../stock-review';

const productos: StockReviewProduct[] = [
  { track_stock: 1, stock: 0, min_stock: 2 },
  { track_stock: 1, stock: -3, min_stock: 0 },
  { track_stock: 1, stock: 2, min_stock: 2 },
  { track_stock: 1, stock: 3, min_stock: 2 },
  { track_stock: 0, stock: 0, min_stock: 5 },
];

describe('summarizeStockReview', () => {
  test('cuenta agotados y por agotarse', () => {
    expect(summarizeStockReview(productos)).toEqual({ outCount: 2, lowCount: 1 });
  });

  test('el stock negativo también cuenta como agotado', () => {
    const review = summarizeStockReview([{ track_stock: 1, stock: -1, min_stock: 0 }]);
    expect(review.outCount).toBe(1);
    expect(review.lowCount).toBe(0);
  });

  test('los productos sin control de stock no cuentan', () => {
    const review = summarizeStockReview([
      { track_stock: 0, stock: 0, min_stock: 5 },
      { track_stock: 0, stock: 100, min_stock: 5 },
    ]);
    expect(review).toEqual({ outCount: 0, lowCount: 0 });
  });

  test('un producto justo en el mínimo está por agotarse', () => {
    expect(summarizeStockReview([{ track_stock: 1, stock: 5, min_stock: 5 }])).toEqual({
      outCount: 0,
      lowCount: 1,
    });
  });

  test('sin productos no hay avisos', () => {
    expect(summarizeStockReview([])).toEqual({ outCount: 0, lowCount: 0 });
  });

  test('un stock inválido falla en español', () => {
    expect(() =>
      summarizeStockReview([{ track_stock: 1, stock: Number.NaN, min_stock: 0 }])
    ).toThrow('El stock no es válido.');
  });
});
