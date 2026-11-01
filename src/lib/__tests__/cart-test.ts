import {
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  addAmount,
  addProduct,
  cartTotalCents,
  cartUnitCount,
  changeQuantity,
  emptyCart,
  hasUnusualQuantity,
  removeLine,
  toSaleItems,
  type Cart,
  type CartProduct,
} from '../cart';

const coca: CartProduct = { id: 1, name: 'Coca Cola', priceCents: 1500 };
const galletas: CartProduct = { id: 2, name: ' Galletas ', priceCents: 1250 };

function cartWith(...products: CartProduct[]): Cart {
  return products.reduce((cart, product) => addProduct(cart, product), emptyCart());
}

describe('addProduct', () => {
  test('agrega un producto con cantidad 1 y el precio del momento', () => {
    const cart = addProduct(emptyCart(), coca);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ productId: 1, quantity: 1, unitPriceCents: 1500 });
  });

  test('el mismo producto aumenta la cantidad y no duplica el renglón', () => {
    const cart = cartWith(coca, coca, coca);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(3);
  });

  test('recorta el nombre', () => {
    expect(addProduct(emptyCart(), galletas).lines[0].description).toBe('Galletas');
  });

  test('no modifica el carrito original', () => {
    const original = emptyCart();
    addProduct(original, coca);
    expect(original.lines).toHaveLength(0);
  });

  test.each([
    { id: 0, name: 'x', priceCents: 100 },
    { id: 1.5, name: 'x', priceCents: 100 },
    { id: 1, name: '   ', priceCents: 100 },
    { id: 1, name: 'x', priceCents: -1 },
    { id: 1, name: 'x', priceCents: 12.5 },
  ])('rechaza %p', (product) => {
    expect(() => addProduct(emptyCart(), product)).toThrow();
  });

  test('rechaza pasar del máximo de renglones', () => {
    let cart = emptyCart();
    for (let id = 1; id <= MAX_CART_LINES; id += 1) {
      cart = addProduct(cart, { id, name: `P${id}`, priceCents: 100 });
    }
    expect(() => addProduct(cart, { id: 999, name: 'Otro', priceCents: 100 })).toThrow();
  });
});

describe('addAmount', () => {
  test('agrega renglones por monto, sin producto del catálogo', () => {
    const cart = addAmount(addAmount(emptyCart(), 'Lonche', 3500), '   ', 800);
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines[0]).toMatchObject({ productId: null, description: 'Lonche' });
    expect(cart.lines[1].description).toBe('Venta por monto');
    expect(cart.lines[0].key).not.toBe(cart.lines[1].key);
  });

  test.each([0, -5, 12.5, NaN])('rechaza el monto %p', (amount) => {
    expect(() => addAmount(emptyCart(), 'x', amount)).toThrow();
  });
});

describe('changeQuantity y removeLine', () => {
  test('suma y resta unidades', () => {
    const cart = changeQuantity(cartWith(coca), 'p1', 4);
    expect(cart.lines[0].quantity).toBe(5);
    expect(changeQuantity(cart, 'p1', -2).lines[0].quantity).toBe(3);
  });

  test('al llegar a cero quita el renglón', () => {
    expect(changeQuantity(cartWith(coca), 'p1', -1).lines).toHaveLength(0);
  });

  test('una clave inexistente se ignora', () => {
    const cart = cartWith(coca);
    expect(changeQuantity(cart, 'p99', 1)).toBe(cart);
    expect(removeLine(cart, 'p99').lines).toHaveLength(1);
  });

  test('rechaza cambios inválidos y pasar del máximo', () => {
    const cart = cartWith(coca);
    expect(() => changeQuantity(cart, 'p1', 0)).toThrow();
    expect(() => changeQuantity(cart, 'p1', 1.5)).toThrow();
    expect(() => changeQuantity(cart, 'p1', MAX_LINE_QUANTITY)).toThrow();
  });

  test('quita un renglón completo', () => {
    const cart = removeLine(cartWith(coca, galletas), 'p1');
    expect(cart.lines.map((line) => line.key)).toEqual(['p2']);
  });
});

describe('totales', () => {
  test('el carrito vacío vale cero', () => {
    expect(cartTotalCents(emptyCart())).toBe(0);
    expect(cartUnitCount(emptyCart())).toBe(0);
  });

  test('suma cantidad por precio de cada renglón', () => {
    let cart = changeQuantity(cartWith(coca, galletas), 'p1', 1); // 2 x 15.00
    cart = changeQuantity(cart, 'p2', 2); // 3 x 12.50
    cart = addAmount(cart, 'Lonche', 800);
    expect(cartTotalCents(cart)).toBe(3000 + 3750 + 800);
    expect(cartUnitCount(cart)).toBe(6);
  });

  test('tres de 15.00 suman exactamente 45.00', () => {
    expect(cartTotalCents(changeQuantity(cartWith(coca), 'p1', 2))).toBe(4500);
  });
});

describe('hasUnusualQuantity y toSaleItems', () => {
  test('avisa desde 20 unidades en un renglón', () => {
    const cart = cartWith(coca);
    expect(hasUnusualQuantity(changeQuantity(cart, 'p1', 18))).toBe(false); // 19
    expect(hasUnusualQuantity(changeQuantity(cart, 'p1', 19))).toBe(true); // 20
  });

  test('convierte a renglones de venta', () => {
    const cart = addAmount(changeQuantity(cartWith(coca), 'p1', 1), 'Lonche', 3500);
    expect(toSaleItems(cart)).toEqual([
      { productId: 1, description: 'Coca Cola', quantity: 2, unitPriceCents: 1500 },
      { productId: null, description: 'Lonche', quantity: 1, unitPriceCents: 3500 },
    ]);
  });
});