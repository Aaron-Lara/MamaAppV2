import { addAmount, addProduct, changeQuantity, emptyCart, type Cart } from '../cart';
import { buildSaleDraft, calculateChange, suggestTenders, type PaymentMethod } from '../checkout';

// 2 x $15.00 de Coca Cola = $30.00
function thirtyPesos(): Cart {
  const cart = addProduct(emptyCart(), { id: 1, name: 'Coca Cola', priceCents: 1500 });
  return changeQuantity(cart, 'p1', 1);
}

describe('buildSaleDraft', () => {
  test('arma una venta en efectivo y no la liga a un cliente', () => {
    const result = buildSaleDraft(thirtyPesos(), 'cash', 7);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.totalCents).toBe(3000);
    expect(result.sale.paymentMethod).toBe('cash');
    expect(result.sale.customerId).toBeNull();
    expect(result.sale.items).toEqual([
      { productId: 1, description: 'Coca Cola', quantity: 2, unitPriceCents: 1500 },
    ]);
  });

  test('arma un fiado con cliente', () => {
    const result = buildSaleDraft(thirtyPesos(), 'credit', 7);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.sale.customerId).toBe(7);
  });

  test.each([null, 0, -3, 1.5])('un fiado con cliente %p es inválido', (customerId) => {
    const result = buildSaleDraft(thirtyPesos(), 'credit', customerId);
    expect(result.ok).toBe(false);
  });

  test('un carrito vacío es inválido', () => {
    const result = buildSaleDraft(emptyCart(), 'cash', null);
    expect(result).toEqual({ ok: false, error: 'Agrega al menos un producto.' });
  });

  test('una forma de pago desconocida es inválida', () => {
    const result = buildSaleDraft(thirtyPesos(), 'card' as unknown as PaymentMethod, null);
    expect(result.ok).toBe(false);
  });

  test('incluye renglones por monto', () => {
    const cart = addAmount(thirtyPesos(), 'Lonche', 3500);
    const result = buildSaleDraft(cart, 'cash', null);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.totalCents).toBe(6500);
    expect(result.sale.items[1].productId).toBeNull();
  });
});

describe('calculateChange', () => {
  test('pago exacto: cambio cero', () => {
    expect(calculateChange(3750, '37.50')).toEqual({ ok: true, changeCents: 0 });
  });

  test('devuelve el cambio', () => {
    expect(calculateChange(3750, '100')).toEqual({ ok: true, changeCents: 6250 });
    expect(calculateChange(3750, '$50')).toEqual({ ok: true, changeCents: 1250 });
  });

  test('avisa cuánto falta si el pago no alcanza', () => {
    const result = calculateChange(3000, '20');
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.error).toContain('$10.00');
  });

  test.each(['', '   ', 'abc', '-5', '12.555', '1,250'])('rechaza %p', (text) => {
    expect(calculateChange(3000, text).ok).toBe(false);
  });

  test('rechaza un total inválido', () => {
    expect(calculateChange(-1, '10').ok).toBe(false);
    expect(calculateChange(12.5, '10').ok).toBe(false);
  });
});

describe('suggestTenders', () => {
  test.each<[number, number[]]>([
    [3700, [3700, 4000, 5000, 10000]],
    [1500, [1500, 2000, 5000, 10000]],
    [2000, [2000, 5000, 10000, 20000]],
    [99000, [99000]],
  ])('para un total de %p ofrece %p', (total, expected) => {
    expect(suggestTenders(total)).toEqual(expected);
  });

  test.each([0, -1, 12.5, NaN])('un total %p no ofrece nada', (total) => {
    expect(suggestTenders(total)).toEqual([]);
  });
});