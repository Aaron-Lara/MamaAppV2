// Lógica pura del ajuste de stock por conteo: de lo que escribe la usuaria a
// un movimiento. No importa expo-sqlite ni nada de pantallas.

/** Tope de unidades que se pueden contar en un ajuste. */
export const MAX_COUNTED_UNITS = 100000;

/** Diferencia que ya pide confirmación en pantalla. */
export const LARGE_ADJUSTMENT_UNITS = 20;

/** Tope absoluto de un ajuste manual (un solo movimiento). */
export const MAX_ADJUSTMENT_QUANTITY = 10000;

export type AdjustmentMotive = 'count' | 'waste' | 'other';

/** Motivos que puede escribir esta pantalla (encajan en AdjustmentReason). */
export type PlannedReason = 'adjustment' | 'waste';

export type CountedUnitsResult = { ok: true; value: number } | { ok: false; error: string };

export type AdjustmentPlan =
  | { ok: true; change: false; message: string }
  | {
      ok: true;
      change: true;
      difference: number;
      reason: PlannedReason;
      note: string;
      needsConfirmation: boolean;
    }
  | { ok: false; error: string };

export type AdjustmentErrorField = 'counted' | 'note' | 'form';
export type AdjustmentErrors = Partial<Record<AdjustmentErrorField, string>>;

export const ADJUST_ERROR_FALLBACK = 'No se pudo ajustar el stock. Inténtalo de nuevo.';

/** Conteo tecleado -> unidades. A diferencia del alta, vacío sí es error. */
export function parseCountedUnits(text: string): CountedUnitsResult {
  const cleaned = text.trim();
  if (cleaned === '') {
    return { ok: false, error: 'Escribe cuántas unidades hay ahora (puede ser 0).' };
  }
  if (!/^\d+$/.test(cleaned)) {
    return { ok: false, error: 'La cantidad debe ser un número entero, sin decimales ni signos.' };
  }
  const value = Number(cleaned);
  if (!Number.isSafeInteger(value) || value > MAX_COUNTED_UNITS) {
    return { ok: false, error: `La cantidad no puede pasar de ${MAX_COUNTED_UNITS} unidades.` };
  }
  return { ok: true, value };
}

/**
 * Convierte un conteo en el movimiento que deja el stock exactamente ahí.
 * Si el conteo ya coincide no hay movimiento. Las reglas de recordAdjustment
 * (motivo permitido, nota obligatoria, tope) se cumplen por construcción.
 */
export function planAdjustment(
  currentStock: number,
  countedUnits: number,
  motive: AdjustmentMotive,
  note = ''
): AdjustmentPlan {
  if (!Number.isSafeInteger(currentStock)) {
    return { ok: false, error: 'El stock actual no es válido.' };
  }
  if (!Number.isSafeInteger(countedUnits) || countedUnits < 0 || countedUnits > MAX_COUNTED_UNITS) {
    return {
      ok: false,
      error: `La cantidad debe ser un entero entre 0 y ${MAX_COUNTED_UNITS}.`,
    };
  }

  const difference = countedUnits - currentStock;
  if (difference === 0) {
    return { ok: true, change: false, message: `El stock ya es ${countedUnits}.` };
  }

  let reason: PlannedReason;
  let movementNote: string;
  if (motive === 'waste') {
    if (difference > 0) {
      return { ok: false, error: 'La merma solo puede restar unidades.' };
    }
    reason = 'waste';
    movementNote = 'Merma';
  } else if (motive === 'other') {
    reason = 'adjustment';
    movementNote = note.trim();
    if (!movementNote) {
      return { ok: false, error: 'Este movimiento necesita una nota que explique el cambio.' };
    }
  } else {
    reason = 'adjustment';
    movementNote = 'Conteo';
  }

  if (Math.abs(difference) > MAX_ADJUSTMENT_QUANTITY) {
    return {
      ok: false,
      error: `Un ajuste no puede cambiar más de ${MAX_ADJUSTMENT_QUANTITY} unidades a la vez.`,
    };
  }

  return {
    ok: true,
    change: true,
    difference,
    reason,
    note: movementNote,
    needsConfirmation: Math.abs(difference) >= LARGE_ADJUSTMENT_UNITS,
  };
}

/** Traduce un error al guardar a un mensaje por campo, sin texto técnico. */
export function mapAdjustError(error: unknown): AdjustmentErrors {
  const message = error instanceof Error ? error.message : '';
  const text = message.toLowerCase();
  if (text.includes('producto') || text.includes('stock')) {
    return { form: message || ADJUST_ERROR_FALLBACK };
  }
  if (
    text.includes('ajuste') ||
    text.includes('cantidad') ||
    text.includes('unidades') ||
    text.includes('conteo')
  ) {
    return { counted: message };
  }
  if (text.includes('nota')) {
    return { note: message };
  }
  return { form: ADJUST_ERROR_FALLBACK };
}
