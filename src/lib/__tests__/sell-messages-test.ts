import {
  mapSaleError,
  SALE_BUSY,
  SALE_CUSTOMER_MISSING,
  SALE_CUSTOMER_REQUIRED,
  SALE_EMPTY,
  SALE_NO_SPACE,
  SALE_PAYMENT_INVALID,
  SALE_PRICE_INVALID,
  SALE_PRODUCT_MISSING,
  SALE_QUANTITY_INVALID,
  SALE_SAVE_FALLBACK,
} from '../sell-messages';

describe('mapSaleError', () => {
  it('traduce una venta sin productos', () => {
    expect(mapSaleError(new Error('La venta necesita al menos un producto.'))).toBe(SALE_EMPTY);
  });

  it('traduce una forma de pago inválida', () => {
    expect(mapSaleError(new Error('La forma de pago no es válida.'))).toBe(SALE_PAYMENT_INVALID);
  });

  it('pide elegir cliente en una venta fiada', () => {
    expect(mapSaleError(new Error('Elige a quién se le fía.'))).toBe(SALE_CUSTOMER_REQUIRED);
  });

  it('traduce un cliente que ya no existe', () => {
    expect(mapSaleError(new Error('El cliente de la venta no existe.'))).toBe(
      SALE_CUSTOMER_MISSING
    );
  });

  it('oculta el id del producto que ya no existe', () => {
    const message = mapSaleError(new Error('El producto 12345 no existe.'));
    expect(message).toBe(SALE_PRODUCT_MISSING);
    expect(message).not.toContain('12345');
    expect(message).not.toMatch(/\d/);
  });

  it('traduce cantidad y precio inválidos', () => {
    expect(mapSaleError(new Error('La cantidad del renglón no es válida.'))).toBe(
      SALE_QUANTITY_INVALID
    );
    expect(mapSaleError(new Error('El precio del renglón no es válido.'))).toBe(
      SALE_PRICE_INVALID
    );
  });

  it('traduce la base ocupada y la falta de espacio', () => {
    expect(mapSaleError(new Error('database is locked'))).toBe(SALE_BUSY);
    expect(mapSaleError(new Error('database or disk is full'))).toBe(SALE_NO_SPACE);
  });

  it('oculta detalles técnicos de SQLite', () => {
    const message = mapSaleError(
      new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: sales.id')
    );
    expect(message).toBe(SALE_SAVE_FALLBACK);
    expect(message).not.toContain('SQLITE');
    expect(message).not.toContain('constraint');
  });

  it('usa el mensaje genérico con valores que no son errores', () => {
    expect(mapSaleError(null)).toBe(SALE_SAVE_FALLBACK);
    expect(mapSaleError(42)).toBe(SALE_SAVE_FALLBACK);
    expect(mapSaleError(new Error('   '))).toBe(SALE_SAVE_FALLBACK);
  });
});
