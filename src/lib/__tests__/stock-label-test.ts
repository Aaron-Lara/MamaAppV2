// Pruebas de la etiqueta de stock: los negativos nunca se muestran.

import { formatStockLabel } from '../stock-label';

describe('formatStockLabel', () => {
  test('un stock positivo se muestra tal cual', () => {
    expect(formatStockLabel(5)).toBe('5');
  });

  test('cero se muestra como "Sin stock"', () => {
    expect(formatStockLabel(0)).toBe('Sin stock');
  });

  test('un stock negativo avisa que hay que revisar el conteo', () => {
    expect(formatStockLabel(-2)).toBe('Sin stock · revisar conteo');
  });
});
