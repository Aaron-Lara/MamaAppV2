// Pruebas de la validación pura de productos. No importan expo-sqlite.

import {
  MAX_PRODUCT_CATEGORY_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_PRODUCT_PRICE_CENTS,
  validateProductInput,
} from '../product-input';

const base = {
  name: '  Café  ',
  priceCents: 500,
  category: '  bebidas ',
  trackStock: true,
  minStock: 2,
};

describe('validateProductInput', () => {
  it('acepta un producto válido y normaliza nombre y categoría', () => {
    expect(validateProductInput(base)).toEqual({
      name: 'Café',
      priceCents: 500,
      category: 'bebidas',
      trackStock: true,
      minStock: 2,
    });
  });

  it('convierte una categoría vacía o ausente en null', () => {
    expect(validateProductInput({ ...base, category: '   ' }).category).toBeNull();
    expect(validateProductInput({ ...base, category: '' }).category).toBeNull();
    expect(validateProductInput({ ...base, category: undefined }).category).toBeNull();
  });

  it('usa false y 0 cuando trackStock y minStock no vienen', () => {
    expect(validateProductInput({ name: 'Agua', priceCents: 100 })).toEqual({
      name: 'Agua',
      priceCents: 100,
      category: null,
      trackStock: false,
      minStock: 0,
    });
  });

  it('acepta el precio máximo', () => {
    expect(validateProductInput({ ...base, priceCents: MAX_PRODUCT_PRICE_CENTS }).priceCents).toBe(
      MAX_PRODUCT_PRICE_CENTS
    );
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el precio %p',
    (priceCents) => {
      expect(() => validateProductInput({ ...base, priceCents })).toThrow();
    }
  );

  it('rechaza un precio mayor al tope', () => {
    expect(() =>
      validateProductInput({ ...base, priceCents: MAX_PRODUCT_PRICE_CENTS + 1 })
    ).toThrow('El precio no puede pasar de $1,000.00.');
  });

  it('rechaza un nombre vacío', () => {
    expect(() => validateProductInput({ ...base, name: '   ' })).toThrow(
      'El producto necesita un nombre.'
    );
  });

  it(`acepta un nombre de ${MAX_PRODUCT_NAME_LENGTH} caracteres`, () => {
    const name = 'a'.repeat(MAX_PRODUCT_NAME_LENGTH);
    expect(validateProductInput({ ...base, name }).name).toBe(name);
  });

  it(`rechaza un nombre de ${MAX_PRODUCT_NAME_LENGTH + 1} caracteres`, () => {
    const name = 'a'.repeat(MAX_PRODUCT_NAME_LENGTH + 1);
    expect(() => validateProductInput({ ...base, name })).toThrow(
      `El nombre no puede pasar de ${MAX_PRODUCT_NAME_LENGTH} caracteres.`
    );
  });

  it(`rechaza una categoría de ${MAX_PRODUCT_CATEGORY_LENGTH + 1} caracteres`, () => {
    const category = 'a'.repeat(MAX_PRODUCT_CATEGORY_LENGTH + 1);
    expect(() => validateProductInput({ ...base, category })).toThrow(
      `La categoría no puede pasar de ${MAX_PRODUCT_CATEGORY_LENGTH} caracteres.`
    );
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza el stock mínimo %p',
    (minStock) => {
      expect(() => validateProductInput({ ...base, minStock })).toThrow();
    }
  );

  it('rechaza una categoría que no es texto', () => {
    expect(() =>
      validateProductInput({ ...base, category: 123 as unknown as string })
    ).toThrow('La categoría del producto no es válida.');
  });
});
