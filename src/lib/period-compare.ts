// Comparación entre el periodo actual y el anterior. Lógica pura.
// El porcentaje solo se calcula con una base positiva y confiable.

export type ChangeDirection = 'up' | 'down' | 'same';

export type MetricChange = {
  delta: number;
  /** null cuando el valor anterior no sirve como base (cero o negativo). */
  percent: number | null;
  direction: ChangeDirection;
};

function assertInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} debe ser un entero.`);
  }
}

/** Diferencia y variación porcentual entre dos importes o conteos. */
export function compareValues(current: number, previous: number): MetricChange {
  assertInteger(current, 'El valor actual');
  assertInteger(previous, 'El valor anterior');

  const delta = current - previous;
  if (!Number.isSafeInteger(delta)) {
    throw new Error('La diferencia se sale del rango seguro de enteros.');
  }

  const direction: ChangeDirection = delta === 0 ? 'same' : delta > 0 ? 'up' : 'down';
  let percent: number | null = null;
  if (previous > 0) {
    const rounded = Math.round(((current - previous) / previous) * 100);
    // Normaliza -0 para que la prueba y la vista vean el mismo cero.
    percent = rounded === 0 ? 0 : rounded;
  }

  return { delta, percent, direction };
}

/**
 * Texto de la variación. Si el porcentaje redondea a cero pero hubo cambio,
 * conserva el signo para no ocultar la dirección (+0 % / -0 %).
 */
export function formatChange(change: MetricChange): string {
  if (change.delta === 0) {
    return 'sin cambios';
  }
  if (change.percent === null) {
    return 'sin datos previos';
  }
  if (change.percent === 0) {
    return change.direction === 'up' ? '+0 %' : '-0 %';
  }
  return change.percent > 0 ? `+${change.percent} %` : `${change.percent} %`;
}
