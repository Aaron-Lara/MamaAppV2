// Pruebas del tipo de cambio: texto -> entero x10000 y conversión a pesos.

import { convertToMxnCents, parseExchangeRate } from '../exchange-rate';

describe('parseExchangeRate', () => {
  test.each([
    ['20', 200000],
    ['20.5', 205000],
    ['20,50', 205000],
    ['19.9999', 199999],
    ['1', 10000],
    ['100', 1000000],
    ['100.0000', 1000000],
    ['  20.25  ', 202500],
  ])('convierte %s a %d', (text, expected) => {
    expect(parseExchangeRate(text)).toBe(expected);
  });

  test.each([
    ['', 'Escribe el tipo de cambio.'],
    ['0.9999', 'entre 1 y 100'],
    ['100.0001', 'entre 1 y 100'],
    ['1.00001', '4 decimales'],
    ['20.1.2', 'un separador decimal'],
    ['abc', 'números'],
    ['-5', 'entre 1 y 100'],
    ['$20', 'números'],
  ])('rechaza "%s" con un mensaje claro', (text, message) => {
    expect(() => parseExchangeRate(text)).toThrow(message);
  });
});

describe('convertToMxnCents', () => {
  test('convierte con el tipo de cambio x10000', () => {
    expect(convertToMxnCents(1234, 200000)).toBe(24680);
  });

  test('el tipo de cambio de MXN deja el costo igual', () => {
    expect(convertToMxnCents(1250, 10000)).toBe(1250);
  });

  test('el redondeo de la mitad sube', () => {
    expect(convertToMxnCents(1, 15000)).toBe(2);
    expect(convertToMxnCents(3, 15000)).toBe(5);
  });

  test('rechaza costos o tipos de cambio inválidos', () => {
    expect(() => convertToMxnCents(-1, 10000)).toThrow();
    expect(() => convertToMxnCents(1.5, 10000)).toThrow();
    expect(() => convertToMxnCents(100, 0)).toThrow();
    expect(() => convertToMxnCents(100, 1.5)).toThrow();
  });
});
