// Reglas puras para los nombres de clientes. No importa expo-sqlite.

import { normalizeSearchText } from '@/lib/inventory-rules';

export const MAX_CUSTOMER_NAME_LENGTH = 60;

/** Nombre limpio: sin espacios sobrantes, de 1 a 60 caracteres. */
export function validateCustomerName(name: string): string {
  const clean = name.replace(/\s+/g, ' ').trim();
  if (clean === '') {
    throw new Error('Escribe el nombre del cliente.');
  }
  if (clean.length > MAX_CUSTOMER_NAME_LENGTH) {
    throw new Error(`El nombre no puede pasar de ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`);
  }
  return clean;
}

/** Clave para comparar nombres sin distinguir mayúsculas, acentos ni espacios repetidos. */
export function customerNameKey(name: string): string {
  return normalizeSearchText(name);
}

/** true si ya existe un cliente con ese nombre (comparación tolerante). */
export function hasDuplicateCustomerName(name: string, existingNames: readonly string[]): boolean {
  const key = customerNameKey(name);
  return existingNames.some((existing) => customerNameKey(existing) === key);
}