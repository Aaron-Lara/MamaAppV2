import {
  emptyProductForm,
  validateProductForm,
  type ProductFormValues,
} from '../product-form';

function form(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return { ...emptyProductForm(), name: 'Galletas', price: '12.50', ...overrides };
}

describe('validateProductForm: errores', () => {
  test('nombre vacío', () => {
    const result = validateProductForm(form({ name: '   ' }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.name).toBeDefined();
  });

  test.each(['abc', '', '1,250', '12.555', '-5', '0'])('precio %p', (price) => {
    const result = validateProductForm(form({ price }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.price).toBeDefined();
  });

  test('mínimo con decimales', () => {
    const result = validateProductForm(form({ trackStock: true, minStock: '2.5' }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.minStock).toBeDefined();
  });

  test('cantidad negativa', () => {
    const result = validateProductForm(form({ trackStock: true, stockCount: '-3' }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.stockCount).toBeDefined();
  });

  test('reporta varios errores a la vez', () => {
    const result = validateProductForm(form({ name: '', price: '' }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.name).toBeDefined();
    expect(result.errors.price).toBeDefined();
  });

  test('un nombre demasiado largo no pasa las reglas de producto', () => {
    const result = validateProductForm(form({ name: 'x'.repeat(61) }), 'create', false);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });
});

describe('validateProductForm: reactivar el control de stock al editar', () => {
  test('exige el conteo cuando el producto no controlaba stock', () => {
    const result = validateProductForm(
      form({ trackStock: true, stockCount: '' }),
      'edit',
      false
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.errors.stockCount).toBeDefined();
  });

  test('un conteo de 0 es válido y se envía', () => {
    const result = validateProductForm(
      form({ trackStock: true, stockCount: '0' }),
      'edit',
      false
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.stockCount).toBe(0);
  });

  test('un conteo positivo se envía', () => {
    const result = validateProductForm(
      form({ trackStock: true, stockCount: '7' }),
      'edit',
      false
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.stockCount).toBe(7);
  });

  test('si el control sigue apagado no se pide conteo', () => {
    const result = validateProductForm(form({ trackStock: false }), 'edit', false);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.stockCount).toBeNull();
  });
});
