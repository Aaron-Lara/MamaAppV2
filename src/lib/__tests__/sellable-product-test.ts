import {
  isSoldOut,
  toCartProduct,
  toSellableProduct,
  type SellableProduct,
  type SellableProductRow,
} from '../sellable-product';

const row: SellableProductRow = {
  id: 7,
  name: 'Coca Cola',
  price_cents: 1500,
  category: 'Bebidas',
  track_stock: 1,
  stock: 4,
};

function product(overrides: Partial<SellableProduct> = {}): SellableProduct {
  return {
    id: 1,
    name: 'Producto',
    priceCents: 1000,
    category: null,
    trackStock: true,
    stock: 3,
    ...overrides,
  };
}

describe('toSellableProduct', () => {
  test('convierte los nombres de la base al formato de la pantalla', () => {
    expect(toSellableProduct(row)).toEqual({
      id: 7,
      name: 'Coca Cola',
      priceCents: 1500,
      category: 'Bebidas',
      trackStock: true,
      stock: 4,
    });
  });

  test('track_stock 0 significa que el producto no controla stock', () => {
    expect(toSellableProduct({ ...row, track_stock: 0 }).trackStock).toBe(false);
  });

  test('no modifica la fila original', () => {
    const copy = { ...row };
    toSellableProduct(row);
    expect(row).toEqual(copy);
  });
});

describe('isSoldOut', () => {
  test('marca agotado solo si controla stock y queda en cero o menos', () => {
    expect(isSoldOut(product({ stock: 0 }))).toBe(true);
    expect(isSoldOut(product({ stock: -3 }))).toBe(true);
    expect(isSoldOut(product({ stock: 1 }))).toBe(false);
  });

  test('un producto sin control de stock nunca aparece agotado', () => {
    expect(isSoldOut(product({ trackStock: false, stock: 0 }))).toBe(false);
    expect(isSoldOut(product({ trackStock: false, stock: -5 }))).toBe(false);
  });
});

describe('toCartProduct', () => {
  test('toma solo los datos que necesita addProduct', () => {
    expect(toCartProduct(product({ id: 9, name: 'Jugo', priceCents: 850 }))).toEqual({
      id: 9,
      name: 'Jugo',
      priceCents: 850,
    });
  });
});
