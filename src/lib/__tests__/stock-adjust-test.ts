import {
  ADJUST_ERROR_FALLBACK,
  MAX_COUNTED_UNITS,
  mapAdjustError,
  parseCountedUnits,
} from '../stock-adjust';

function valueOf(text: string): number {
  const result = parseCountedUnits(text);
  if (!result.ok) throw new Error(`Debía ser válido: ${text}`);
  return result.value;
}

describe('parseCountedUnits: casos válidos', () => {
  test('acepta enteros con espacios alrededor', () => {
    expect(valueOf('12')).toBe(12);
    expect(valueOf(' 12 ')).toBe(12);
    expect(valueOf('007')).toBe(7);
  });

  test('cero es un conteo válido', () => {
    expect(valueOf('0')).toBe(0);
  });

  test('el máximo permitido entra', () => {
    expect(valueOf(String(MAX_COUNTED_UNITS))).toBe(MAX_COUNTED_UNITS);
  });
});

describe('parseCountedUnits: errores', () => {
  test.each(['', '   '])('vacío %p es error', (text) => {
    const result = parseCountedUnits(text);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.error).toContain('unidades');
  });

  test.each(['12.5', '1,5', '-3', '+3', 'abc', '1 2', '12a', '1e3'])(
    'texto inválido %p',
    (text) => {
      const result = parseCountedUnits(text);
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Debía fallar');
      expect(result.error).toContain('entero');
    }
  );

  test('más del máximo es error', () => {
    const result = parseCountedUnits(String(MAX_COUNTED_UNITS + 1));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Debía fallar');
    expect(result.error).toContain(String(MAX_COUNTED_UNITS));
  });
});

describe('mapAdjustError', () => {
  test('manda los errores de cantidad al campo de conteo', () => {
    expect(mapAdjustError(new Error('La merma solo puede restar unidades.'))).toEqual({
      counted: 'La merma solo puede restar unidades.',
    });
  });

  test('manda el error de nota al campo de nota', () => {
    const message = 'Este movimiento necesita una nota que explique el cambio.';
    expect(mapAdjustError(new Error(message))).toEqual({ note: message });
  });

  test('los errores del producto van al formulario', () => {
    expect(mapAdjustError(new Error('Este producto no controla stock.'))).toEqual({
      form: 'Este producto no controla stock.',
    });
  });

  test('cualquier otro error usa el texto de respaldo', () => {
    expect(mapAdjustError(new Error('SQLITE_BUSY'))).toEqual({ form: ADJUST_ERROR_FALLBACK });
    expect(mapAdjustError('sin error')).toEqual({ form: ADJUST_ERROR_FALLBACK });
  });
});
