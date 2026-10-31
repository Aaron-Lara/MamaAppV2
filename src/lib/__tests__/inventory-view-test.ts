import {
  buildInventoryRows,
  countInventoryFilters,
  selectInventoryRows,
  type InventoryProduct,
} from '../inventory-view';

function product(overrides: Partial<InventoryProduct> & { id: number; name: string }): InventoryProduct {
  return {
    price_cents: 1000,
    track_stock: 1,
    min_stock: 5,
    active: 1,
    stock: 10,
    ...overrides,
  };
}

// 1 ok · 2 por agotarse · 3 agotado · 4 sin control · 5 desactivado · 6 negativo
const CATALOG: InventoryProduct[] = [
  product({ id: 1, name: 'Café molido', stock: 10 }),
  product({ id: 2, name: 'Piña colada', stock: 3 }),
  product({ id: 3, name: 'Galletas', stock: 0 }),
  product({ id: 4, name: 'Refresco', track_stock: 0, stock: 0 }),
  product({ id: 5, name: 'Pan viejo', stock: 8, active: 0 }),
  product({ id: 6, name: 'Jugo', stock: -2 }),
];

const ROWS = buildInventoryRows(CATALOG);

function ids(rows: ReturnType<typeof buildInventoryRows>): number[] {
  return rows.map((row) => row.product.id);
}

describe('buildInventoryRows', () => {
  test('clasifica el stock y trata el negativo como agotado', () => {
    const statusById = new Map(ROWS.map((row) => [row.product.id, row.status]));
    expect(statusById.get(1)).toBe('ok');
    expect(statusById.get(2)).toBe('low');
    expect(statusById.get(3)).toBe('out');
    expect(statusById.get(4)).toBe('untracked');
    expect(statusById.get(6)).toBe('out');
  });

  test('una lista vacía produce cero filas', () => {
    expect(buildInventoryRows([])).toEqual([]);
  });
});

describe('countInventoryFilters', () => {
  test('cuenta solo activos e ignora a los desactivados', () => {
    expect(countInventoryFilters(ROWS)).toEqual({ all: 5, low: 1, out: 2 });
  });

  test('una lista vacía cuenta cero', () => {
    expect(countInventoryFilters([])).toEqual({ all: 0, low: 0, out: 0 });
  });
});

describe('selectInventoryRows', () => {
  test('sin búsqueda ni filtros oculta a los desactivados', () => {
    const visible = selectInventoryRows(ROWS, { query: '', filter: 'all', showInactive: false });
    expect(ids(visible)).toEqual([1, 2, 3, 4, 6]);
  });

  test('el interruptor muestra desactivados solo en "all"', () => {
    const all = selectInventoryRows(ROWS, { query: '', filter: 'all', showInactive: true });
    expect(ids(all)).toEqual([1, 2, 3, 4, 5, 6]);

    const low = selectInventoryRows(ROWS, { query: '', filter: 'low', showInactive: true });
    expect(ids(low)).toEqual([2]);

    const out = selectInventoryRows(ROWS, { query: '', filter: 'out', showInactive: true });
    expect(ids(out)).toEqual([3, 6]);
  });

  test('cada filtro separa por agotarse y agotados', () => {
    const base = { query: '', showInactive: false };
    expect(ids(selectInventoryRows(ROWS, { ...base, filter: 'low' }))).toEqual([2]);
    expect(ids(selectInventoryRows(ROWS, { ...base, filter: 'out' }))).toEqual([3, 6]);
  });

  test('la búsqueda ignora acentos y mayúsculas', () => {
    const visible = selectInventoryRows(ROWS, { query: 'PINA', filter: 'all', showInactive: false });
    expect(ids(visible)).toEqual([2]);
  });

  test('un producto sin control de stock nunca aparece como agotado', () => {
    const out = selectInventoryRows(ROWS, { query: '', filter: 'out', showInactive: true });
    expect(ids(out)).not.toContain(4);
    const low = selectInventoryRows(ROWS, { query: '', filter: 'low', showInactive: true });
    expect(ids(low)).not.toContain(4);
  });

  test('sin coincidencias devuelve una lista vacía', () => {
    const visible = selectInventoryRows(ROWS, {
      query: 'chocolate',
      filter: 'all',
      showInactive: true,
    });
    expect(visible).toEqual([]);
  });
});
