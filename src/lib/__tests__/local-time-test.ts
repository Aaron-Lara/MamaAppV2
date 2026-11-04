import {
  formatLocalTime,
  formatLocalTimeForPhone,
  INVALID_TIME_LABEL,
  phoneUtcOffsetMinutes,
} from '../local-time';

// Los desfases se pasan explícitos: las pruebas no dependen de la zona del equipo.

describe('formatLocalTime', () => {
  test('sin desfase conserva la hora UTC', () => {
    expect(formatLocalTime('2026-11-03T14:05:00.000Z', 0)).toBe('14:05');
  });

  test('resta seis horas con el desfase de México', () => {
    expect(formatLocalTime('2026-11-03T14:05:00.000Z', -360)).toBe('08:05');
  });

  test('suma cinco horas y media con el desfase de la India', () => {
    expect(formatLocalTime('2026-11-03T00:20:00.000Z', 330)).toBe('05:50');
  });

  test('resta una hora y media con un desfase negativo de 90 minutos', () => {
    expect(formatLocalTime('2026-11-03T00:20:00.000Z', -90)).toBe('22:50');
  });

  test('cruza la medianoche hacia el día anterior', () => {
    expect(formatLocalTime('2026-11-03T03:00:00.000Z', -360)).toBe('21:00');
  });

  test('acepta ISO sin milisegundos', () => {
    expect(formatLocalTime('2026-11-03T14:05:00Z', 0)).toBe('14:05');
  });

  test('con texto inválido devuelve el aviso', () => {
    expect(formatLocalTime('ayer', -360)).toBe(INVALID_TIME_LABEL);
  });

  test('con desfase inválido falla en español', () => {
    expect(() => formatLocalTime('2026-11-03T14:05:00.000Z', Number.NaN)).toThrow(
      'El desfase horario no es válido.'
    );
  });
});

describe('phoneUtcOffsetMinutes', () => {
  test('con texto inválido devuelve cero', () => {
    expect(phoneUtcOffsetMinutes('ayer')).toBe(0);
  });

  test('el atajo del teléfono usa el mismo desfase', () => {
    const iso = '2026-11-03T14:05:00.000Z';
    expect(formatLocalTimeForPhone(iso)).toBe(
      formatLocalTime(iso, phoneUtcOffsetMinutes(iso))
    );
  });
});
