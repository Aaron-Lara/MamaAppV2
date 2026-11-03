// Traduce errores al crear un cliente sin mostrar texto técnico.

import { MAX_CUSTOMER_NAME_LENGTH } from '@/lib/customer-input';

export const DUPLICATE_CUSTOMER_MESSAGE = 'Ya existe un cliente con ese nombre.';

export const CUSTOMER_SAVE_ERROR = 'No se pudo crear el cliente. Inténtalo de nuevo.';

export function mapCreateCustomerError(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (text === DUPLICATE_CUSTOMER_MESSAGE || text.toLowerCase().includes('ya existe')) {
    return DUPLICATE_CUSTOMER_MESSAGE;
  }
  if (text.includes('Escribe el nombre')) {
    return 'Escribe el nombre del cliente.';
  }
  if (text.includes('no puede pasar de')) {
    return `El nombre no puede pasar de ${MAX_CUSTOMER_NAME_LENGTH} caracteres.`;
  }
  return CUSTOMER_SAVE_ERROR;
}
