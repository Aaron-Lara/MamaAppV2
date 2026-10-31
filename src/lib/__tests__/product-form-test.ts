import {
  emptyProductForm,
  getFormVisibility,
  productToFormValues,
  validateProductForm,
  type ProductFormValues,
} from '../product-form';

function form(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return { ...emptyProductForm(), name: 'Galletas', price: '12.50', ...overrides };
}

describe('emptyProductForm y productToFormValues', () => {
  test('el formulario vacío no controla stock', () => {
    expect(emptyProductForm()).toEqual({
      name: '',
      price: '',
      category: '',
      trackStock: false,
      minStock: '0',
      stockCount: '',
    });
  });

  test('rellena el formulario con un producto existente', () => {
    expect(
      productToFormValues({
        name: 'Coca',
        price_cents: 1250,
        category: null,
        track_stock: 1,
        min_stock: 5,
      })
    ).toEqual({
      name: 'Coca',
      price: '12.50',
      category: '',
      trackStock: true,
      minStock: '5',
      stockCount: '',
    });
  });
});

describe('getFormVisibility', () => {
  test('sin control de stock no se muestra nada extra', () => {
    const result = getFormVisibility(form(), 'create', false);
    expect(result.showMinStock).toBe(false);
    expect(result.showStockCount).toBe(false);
  });

  test('al crear con control: mínimo y stock inicial', () => {
    const result = getFormVisibility(form({ trackStock: true }), 'create', false);
    expect(result.showMinStock).toBe(true);
    expect(result.showStockCount).toBe(true);
    expect(result.stockCountLabel).toBe('Stock inicial');
  });

  test('al editar y activar el control por primera vez: conteo actual', () => {
    const result = getFormVisibility(form({ trackStock: true }), 'edit', false);
    expect(result.showStockCount).toBe(true);
    expect(result.stockCountLabel).toBe('Conteo actual');
  });

  test('al editar un producto que ya controlaba stock: sin campo de cantidad', () => {
    const result = getFormVisibility(form({ trackStock: true }), 'edit', true);
    expect(result.showMinStock).toBe(true);
    expect(result.showStockCount).toBe(false);
  });
});

describe('validateProductForm: casos válidos', () => {
  test('producto sin control de stock', () => {
    const result = validateProductForm(form({ name: ' Galletas ', price: '$12.5' }), 'create', false);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.input.name).toBe('Galletas');
    expect(result.input.priceCents).toBe(1250);
    expect(result.input.category).toBeNull();
    expect(result.input.trackStock).toBe(false);
    expect(result.input.minStock).toBe(0);
    expect(result.stockCount).toBeNull();
  });

  test('producto con control de stock y cantidad inicial', () => {
    const result = validateProductForm(
      form({ trackStock: true, minStock: '5', stockCount: '10' }),
      'create',
      false
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.input.trackStock).toBe(true);
    expect(result.input.minStock).toBe(5);
    expect(result.stockCount).toBe(10);
  });

  test('cantidad vacía o cero no genera movimiento', () => {
    for (const stockCount of ['', '0', '  ']) {
      const result = validateProductForm(form({ trackStock: true, stockCount }), 'create', false);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Debía ser válido');
      expect(result.stockCount).toBeNull();
    }
  });

  test('al editar un producto que ya controlaba stock se ignora la cantidad', () => {
    const result = validateProductForm(
      form({ trackStock: true, stockCount: '99' }),
      'edit',
      true
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.stockCount).toBeNull();
  });

  test('los campos ocultos no se validan', () => {
    const result = validateProductForm(
      form({ trackStock: false, minStock: 'abc', stockCount: 'xyz' }),
      'create',
      false
    );
    expect(result.ok).toBe(true);
  });

  test('categoría con espacios se guarda como vacía', () => {
    const result = validateProductForm(form({ category: '   ' }), 'create', false);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Debía ser válido');
    expect(result.input.category).toBeNull();
  });
});

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