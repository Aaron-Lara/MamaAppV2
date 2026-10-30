import { centsToInputText, parseMoneyToCents } from '../money-input';

describe('parseMoneyToCents', () => {
  test.each<[string, number]>([
    ['12', 1200],
    ['12.5', 1250],
    ['12.50', 1250],
    ['0.05', 5],
    ['$12.50', 1250],
    [' 7 ', 700],
    ['12,50', 1250],
    ['0', 0],
    ['$ 3', 300],
    ['007', 700],
  ])('convierte %p en %p centavos', (text, expected) => {
    expect(parseMoneyToCents(text)).toBe(expected);
  });

  test.each([
    '1,250',
    '12.555',
    '-5',
    'abc',
    '',
    '   ',
    '.',
    '1e3',
    '12.5.0',
    '12.',
    '.5',
    '12,5,0',
    '1 2',
    '99999999999999999999',
  ])('rechaza %p', (text) => {
    expect(() => parseMoneyToCents(text)).toThrow();
  });
});

describe('centsToInputText', () => {
  test.each<[number, string]>([
    [1250, '12.50'],
    [700, '7.00'],
    [5, '0.05'],
    [0, '0.00'],
  ])('muestra %p como %p', (cents, expected) => {
    expect(centsToInputText(cents)).toBe(expected);
  });

  test.each([-1, 1.5, NaN, Infinity])('rechaza %p', (cents) => {
    expect(() => centsToInputText(cents)).toThrow();
  });

  test('ida y vuelta conserva el valor', () => {
    for (const cents of [0, 5, 99, 100, 1250, 99999]) {
      expect(parseMoneyToCents(centsToInputText(cents))).toBe(cents);
    }
  });
});