import { listCategories, selectSellable, splitFrequent } from '../sellable-order';

type P = { id: number; name: string; category: string | null };

const products: P[] = [
  { id: 1, name: 'Coca Cola', category: 'Bebidas' },
  { id: 2, name: 'Galletas', category: 'Dulces' },
  { id: 3, name: 'Jugo de piña', category: 'Bebidas' },
  { id: 5, name: 'Éclair', category: null },
  { id: 6, name: 'Elote', category: ' ' },
];

const ids = (list: readonly P[]) => list.map((product) => product.id);

describe('splitFrequent', () => {
  test('los más vendidos van primero y el resto en orden alfabético sin acentos', () => {
    const frequency = [
      { productId: 3, unitsSold: 10 },
      { productId: 1, unitsSold: 25 },
      { productId: 99, unitsSold: 5 }, // no está en el catálogo: se ignora
    ];
    const { frequent, others } = splitFrequent(products, frequency);
    expect(ids(frequent)).toEqual([1, 3]);
    expect(ids(others)).toEqual([5, 6, 2]);
  });

  test('los empates se resuelven por nombre', () => {
    const frequency = [
      { productId: 2, unitsSold: 4 },
      { productId: 1, unitsSold: 4 },
    ];
    expect(ids(splitFrequent(products, frequency).frequent)).toEqual([1, 2]);
  });

  test('respeta el máximo de frecuentes', () => {
    const frequency = [
      { productId: 1, unitsSold: 9 },
      { productId: 3, unitsSold: 5 },
    ];
    const { frequent, others } = splitFrequent(products, frequency, 1);
    expect(ids(frequent)).toEqual([1]);
    expect(ids(others)).toEqual([5, 6, 2, 3]);
    expect(ids(splitFrequent(products, frequency, 0).frequent)).toEqual([]);
  });

  test('suma las filas repetidas de un mismo producto', () => {
    const frequency = [
      { productId: 2, unitsSold: 3 },
      { productId: 1, unitsSold: 5 },
      { productId: 2, unitsSold: 3 },
    ];
    expect(ids(splitFrequent(products, frequency).frequent)).toEqual([2, 1]);
  });

  test('sin ventas todo queda en orden alfabético', () => {
    const { frequent, others } = splitFrequent(products, []);
    expect(frequent).toEqual([]);
    expect(ids(others)).toEqual([1, 5, 6, 2, 3]);
  });

  test('ignora unidades en cero o negativas y no modifica la lista original', () => {
    const copy = [...products];
    const frequency = [
      { productId: 1, unitsSold: 0 },
      { productId: 2, unitsSold: -4 },
    ];
    expect(splitFrequent(products, frequency).frequent).toEqual([]);
    expect(products).toEqual(copy);
  });
});

describe('listCategories', () => {
  test('devuelve categorías distintas en orden alfabético y sin vacías', () => {
    expect(listCategories(products)).toEqual(['Bebidas', 'Dulces']);
  });

  test('no repite categorías que solo cambian en mayúsculas, acentos o espacios', () => {
    const extra: P[] = [
      ...products,
      { id: 7, name: 'Agua', category: ' bebidas ' },
      { id: 8, name: 'Pan', category: 'Panadería' },
      { id: 9, name: 'Bolillo', category: 'panaderia' },
    ];
    expect(listCategories(extra)).toEqual(['Bebidas', 'Dulces', 'Panadería']);
  });

  test('sin categorías devuelve una lista vacía', () => {
    expect(listCategories([])).toEqual([]);
  });
});

describe('selectSellable', () => {
  test('sin filtros devuelve todo en el mismo orden', () => {
    expect(ids(selectSellable(products, { query: '', category: null }))).toEqual([1, 2, 3, 5, 6]);
  });

  test('busca sin distinguir acentos ni mayúsculas', () => {
    expect(ids(selectSellable(products, { query: 'PINA', category: null }))).toEqual([3]);
    expect(ids(selectSellable(products, { query: 'eclair', category: null }))).toEqual([5]);
  });

  test('filtra por categoría sin distinguir mayúsculas', () => {
    expect(ids(selectSellable(products, { query: '', category: 'bebidas' }))).toEqual([1, 3]);
  });

  test('combina categoría y búsqueda', () => {
    expect(ids(selectSellable(products, { query: 'jugo', category: 'Bebidas' }))).toEqual([3]);
    expect(selectSellable(products, { query: 'jugo', category: 'Dulces' })).toEqual([]);
  });
});