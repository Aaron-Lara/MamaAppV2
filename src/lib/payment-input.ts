// Validación pura de un abono. No toca la base, así que se puede probar con
// Jest sin expo-sqlite.

import { formatCents } from './money';

/** Tope de un abono: $10,000.00, para detectar dedos resbalados. */
export const MAX_PAYMENT_CENTS = 1000000;

/** Tope de la nota escrita por la usuaria. */
export const MAX_PAYMENT_NOTE_LENGTH = 200;

export type PaymentInput = {
  customerId: number;
  amountCents: number;
  note: string | null;
};

/** Recorta la nota; vacía o ausente se guarda como null. */
function validateNote(note: string | null | undefined): string | null {
  if (note == null) {
    return null;
  }
  if (typeof note !== 'string') {
    throw new Error('La nota del abono no es válida.');
  }
  const trimmed = note.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_PAYMENT_NOTE_LENGTH) {
    throw new Error(`La nota no puede pasar de ${MAX_PAYMENT_NOTE_LENGTH} caracteres.`);
  }
  return trimmed;
}

/** Valida el cliente, el monto y la nota; devuelve la nota ya recortada. */
export function validatePaymentInput(
  customerId: number,
  amountCents: number,
  note?: string | null
): PaymentInput {
  if (!Number.isSafeInteger(customerId) || customerId <= 0) {
    throw new Error('El cliente del abono no es válido.');
  }
  if (!Number.isSafeInteger(amountCents)) {
    throw new Error('El monto del abono debe ser un número entero.');
  }
  if (amountCents <= 0) {
    throw new Error('El monto del abono debe ser mayor a cero.');
  }
  if (amountCents > MAX_PAYMENT_CENTS) {
    throw new Error(`El abono no puede pasar de ${formatCents(MAX_PAYMENT_CENTS)}.`);
  }
  return { customerId, amountCents, note: validateNote(note) };
}
