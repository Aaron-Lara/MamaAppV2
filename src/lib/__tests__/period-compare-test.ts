// Pruebas de la comparación entre periodos: diferencia, porcentaje y texto.

import { compareValues, formatChange, type MetricChange } from '../period-compare';

describe('compareValues', () => {
  test('detecta subida, bajada e igualdad', () => {
    expect(compareValues(120, 100)).toEqual({ delta: 20, percent: 20, direction: 'up' });
    expect(compareValues(80, 100)).toEqual({ delta: -20, percent: -20, direction: 'down' });
    expect(compareValues(100, 100)).toEqual({ delta: 0, percent: 0, direction: 'same' });
  });

  test('sin base positiva el porcentaje es null', () => {
    expect(compareValues(5, 0)).toEqual({ delta: 5, percent: null, direction: 'up' });
    expect(compareValues(0, 0)).toEqual({ delta: 0, percent: null, direction: 'same' });
    expect(compareValues(50, -100)).toEqual({ delta: 150, percent: null, direction: 'up' });
  });

  test('redondea el porcentaje a entero', () => {
    expect(compareValues(1, 3)).toEqual({ delta: -2, percent: -67, direction: 'down' });
    expect(compareValues(2, 3)).toEqual({ delta: -1, percent: -33, direction: 'down' });
  });

  test('conserva la dirección aunque el porcentaje redondee a cero', () => {
    expect(compareValues(100001, 100000)).toEqual({
      delta: 1,
      percent: 0,
      direction: 'up',
    });
    expect(compareValues(99999, 100000)).toEqual({
      delta: -1,
      percent: 0,
      direction: 'down',
    });
  });

  test('rechaza valores no enteros y diferencias fuera de rango', () => {
    expect(() => compareValues(1.5, 1)).toThrow('El valor actual debe ser un entero.');
    expect(() => compareValues(1, Number.NaN)).toThrow('El valor anterior debe ser un entero.');
    expect(() => compareValues(Number.MAX_SAFE_INTEGER, -1)).toThrow(
      'La diferencia se sale del rango seguro de enteros.'
    );
  });
});

describe('formatChange', () => {
  const change = (
    delta: number,
    percent: number | null,
    direction: MetricChange['direction']
  ): MetricChange => ({ delta, percent, direction });

  test('sin cambio gana sobre cualquier porcentaje', () => {
    expect(formatChange(change(0, 0, 'same'))).toBe('sin cambios');
    expect(formatChange(change(0, null, 'same'))).toBe('sin cambios');
  });

  test('sin base confiable muestra el aviso', () => {
    expect(formatChange(change(5, null, 'up'))).toBe('sin datos previos');
    expect(formatChange(change(-5, null, 'down'))).toBe('sin datos previos');
  });

  test('conserva el signo cuando el porcentaje redondea a cero', () => {
    expect(formatChange(change(1, 0, 'up'))).toBe('+0 %');
    expect(formatChange(change(-1, 0, 'down'))).toBe('-0 %');
  });

  test('escribe porcentajes con signo', () => {
    expect(formatChange(change(20, 20, 'up'))).toBe('+20 %');
    expect(formatChange(change(-20, -20, 'down'))).toBe('-20 %');
  });
});
