import {
  countStockAlerts,
  getStockStatus,
  matchesInventoryFilter,
  matchesSearch,
  normalizeSearchText,
  type StockStatus,
} from '../inventory-rules';

describe('normalizeSearchText', () => {
  test.each<[string, string]>([
    ['Piña', 'pina'],
    ['CAFÉ  con   leche ', 'cafe con leche'],
    ['Jalapeño', 'jalapeno'],
    ['ÁÉÍÓÚ Ü', 'aeiou u'],
    ['', ''],
  ])('normaliza %p como %p', (text, expected) => {
    expect(normalizeSearchText(text)).toBe(expected);
  });
});

describe('matchesSearch', () => {
  test.each<[string, string, boolean]>([
    ['Coca Cola 600ml', 'coca 600', true],
    ['Coca Cola', 'cola coca', true],
    ['Piña colada', 'pina', true],
    ['Galletas', 'chocolate', false],
    ['Galletas', '', true],
    ['Galletas', '   ', true],
  ])('%p con la búsqueda %p da %p', (name, query, expected) => {
    expect(matchesSearch(name, query)).toBe(expected);
  });
});

describe('getStockStatus', () => {
  test.each<[boolean, number, number, StockStatus]>([
    [false, 0, 5, 'untracked'],
    [true, 10, 5, 'ok'],
    [true, 6, 5, 'ok'],
    [true, 5, 5, 'low'],
    [true, 3, 5, 'low'],
    [true, 0, 5, 'out'],
    [true, -2, 5, 'out'],
    [true, 1, 0, 'ok'],
    [true, 0, 0, 'out'],
  ])('control %p, stock %p, mínimo %p da %p', (track, stock, min, expected) => {
    expect(getStockStatus(track, stock, min)).toBe(expected);
  });

  test('rechaza valores que no son números', () => {
    expect(() => getStockStatus(true, NaN, 5)).toThrow();
    expect(() => getStockStatus(true, 5, Infinity)).toThrow();
  });
});

describe('matchesInventoryFilter', () => {
  test('todos acepta cualquier estado', () => {
    for (const status of ['untracked', 'ok', 'low', 'out'] as const) {
      expect(matchesInventoryFilter(status, 'all')).toBe(true);
    }
  });

  test('por agotarse y agotados son filtros separados', () => {
    expect(matchesInventoryFilter('low', 'low')).toBe(true);
    expect(matchesInventoryFilter('out', 'low')).toBe(false);
    expect(matchesInventoryFilter('out', 'out')).toBe(true);
    expect(matchesInventoryFilter('ok', 'out')).toBe(false);
  });
});

describe('countStockAlerts', () => {
  test('cuenta solo por agotarse y agotados', () => {
    expect(countStockAlerts(['ok', 'low', 'out', 'untracked', 'out'])).toBe(3);
    expect(countStockAlerts([])).toBe(0);
  });
});