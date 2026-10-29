// Validación pura de la anulación de una venta. No toca la base, así que
// se puede probar con Jest sin expo-sqlite.

/** Tope del motivo escrito por la usuaria. */
export const MAX_VOID_REASON_LENGTH = 200;

export type VoidInput = { saleId: number; reason: string };

/** Valida un id positivo y usa la etiqueta correcta en el mensaje. */
export function validateVoidId(id: number, label: string): number {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`El número de ${label} no es válido.`);
  }
  return id;
}

/** Valida el motivo y lo devuelve recortado. */
export function validateVoidReason(reason: string): string {
  if (typeof reason !== 'string') {
    throw new Error('El motivo de la anulación no es válido.');
  }
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error('El motivo de la anulación no puede quedar vacío.');
  }
  if (trimmed.length > MAX_VOID_REASON_LENGTH) {
    throw new Error(
      `El motivo no puede pasar de ${MAX_VOID_REASON_LENGTH} caracteres.`
    );
  }
  return trimmed;
}

/** Valida el id y el motivo; devuelve el motivo ya recortado. */
export function validateVoidInput(saleId: number, reason: string): VoidInput {
  return { saleId: validateVoidId(saleId, 'venta'), reason: validateVoidReason(reason) };
}
