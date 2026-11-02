import {
  FREQUENT_TITLE,
  OTHERS_TITLE,
  buildSellRows,
  type SellGridRow,
} from '../sell-grid-rows';
import type { SellableProduct } from '../sellable-product';

function product(id: number): SellableProduct {
  return {
    id,
    name: `Producto ${id}`,
    priceCents: 100 * id,
    category: null,
    trackStock: false,
    stock: 0,
  };
}

const list = (...ids: number[]) => ids.map(product);

/** Resume cada fila para comparar la estructura sin ruido. */
function summary(rows: readonly SellGridRow[]) {
  return rows.map((row) =>
    row.type === 'header' ? row.title : row.products.map((item) => item.id)
  );
}

describe('buildSellRows', () => {
  test('pone Más vendidos primero y luego el resto, en filas de dos', () => {
    const rows = buildSellRows(list(1, 2, 3), list(4, 5));

    expect(summary(rows)).toEqual([
      FREQUENT_TITLE,
      [1, 2],
      [3],
      OTHERS_TITLE,
      [4, 5],
    ]);
  });

  test('sin frecuentes no agrega encabezados', () => {
    expect(summary(buildSellRows([], list(4, 5, 6)))).toEqual([[4, 5], [6]]);
  });

  test('si solo hay frecuentes no agrega el encabezado Todos', () => {
    expect(summary(buildSellRows(list(1), []))).toEqual([FREQUENT_TITLE, [1]]);
  });

  test('sin productos devuelve una lista vacía', () => {
    expect(buildSellRows([], [])).toEqual([]);
  });

  test('no modifica las listas originales', () => {
    const frequent = list(1, 2, 3);
    const others = list(4, 5);
    buildSellRows(frequent, others);

    expect(frequent.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(others.map((item) => item.id)).toEqual([4, 5]);
  });

  test('genera claves únicas', () => {
    const rows = buildSellRows(list(1, 2, 3), list(4, 5));
    const keys = rows.map((row) => row.key);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
