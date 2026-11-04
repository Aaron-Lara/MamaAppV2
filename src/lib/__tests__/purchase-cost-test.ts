// Pruebas del costo proporcional: siempre enteros y el redondeo de la mitad sube.

import { costOfUnits, unitCostCents } from '../purchase-cost';

describe('unitCostCents', () => {
  test('reparte el costo total entre las unidades', () => {
    expect(unitCostCents(1000, 3)).toBe(333);
    expect(unitCostCents(1200, 24)).toBe(50);
  });

  test('el redondeo de la mitad sube', () => {
    expect(unitCostCents(5, 2)).toBe(3);
  });

  test('un costo total de cero da cero', () => {
    expect(unitCostCents(0, 10)).toBe(0);
  });

  test('rechaza unidades o costos inválidos', () => {
    expect(() => unitCostCents(1000, 0)).toThrow();
    expect(() => unitCostCents(1000, 2.5)).toThrow();
    expect(() => unitCostCents(-1, 2)).toThrow();
    expect(() => unitCostCents(1.5, 2)).toThrow();
  });
});

describe('costOfUnits', () => {
  test('calcula la parte proporcional de lo vendido', () => {
    expect(costOfUnits(1000, 3, 2)).toBe(667);
    expect(costOfUnits(1200, 24, 6)).toBe(300);
  });

  test('cero unidades vendidas cuesta cero', () => {
    expect(costOfUnits(1000, 3, 0)).toBe(0);
  });

  test('vender todas las unidades devuelve el costo total', () => {
    expect(costOfUnits(1000, 3, 3)).toBe(1000);
  });

  test('el redondeo de la mitad sube', () => {
    expect(costOfUnits(5, 2, 1)).toBe(3);
  });

  test('rechaza cantidades fuera de rango', () => {
    expect(() => costOfUnits(1000, 3, 4)).toThrow();
    expect(() => costOfUnits(1000, 3, -1)).toThrow();
    expect(() => costOfUnits(1000, 3, 1.5)).toThrow();
    expect(() => costOfUnits(1000, 0, 0)).toThrow();
  });
});
