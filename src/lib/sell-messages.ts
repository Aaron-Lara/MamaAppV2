// Traduce errores al guardar una venta a mensajes en español.
// Nunca devuelve el texto original: podría traer IDs o detalles técnicos.

export const SALE_SAVE_FALLBACK = 'No se pudo guardar la venta. Inténtalo de nuevo.';
export const SALE_EMPTY = 'Agrega al menos un producto para cobrar.';
export const SALE_PAYMENT_INVALID =
  'La forma de pago no es válida. Elige efectivo e inténtalo de nuevo.';
export const SALE_CUSTOMER_INVALID =
  'No se pudo guardar la venta porque el cliente no es válido.';
export const SALE_CUSTOMER_MISSING = 'El cliente de esta venta ya no existe.';
export const SALE_PRODUCT_MISSING = 'Uno de los productos de esta venta ya no existe.';
export const SALE_QUANTITY_INVALID = 'La cantidad de uno de los productos no es válida.';
export const SALE_PRICE_INVALID = 'El precio de uno de los productos no es válido.';
export const SALE_BUSY = 'La base de datos está ocupada. Inténtalo de nuevo.';
export const SALE_NO_SPACE = 'No hay espacio en el teléfono para guardar la venta.';

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : '';
}

/** Convierte cualquier error del guardado en un texto seguro para la pantalla. */
export function mapSaleError(error: unknown): string {
  const text = messageOf(error).trim().toLowerCase();
  if (text === '') {
    return SALE_SAVE_FALLBACK;
  }
  if (text.includes('al menos un producto') || text.includes('no hay productos')) {
    return SALE_EMPTY;
  }
  if (text.includes('forma de pago')) {
    return SALE_PAYMENT_INVALID;
  }
  if (text.includes('cliente') && text.includes('no existe')) {
    return SALE_CUSTOMER_MISSING;
  }
  if (text.includes('cliente')) {
    return SALE_CUSTOMER_INVALID;
  }
  if (text.includes('producto') && text.includes('no existe')) {
    return SALE_PRODUCT_MISSING;
  }
  if (text.includes('cantidad')) {
    return SALE_QUANTITY_INVALID;
  }
  if (text.includes('precio')) {
    return SALE_PRICE_INVALID;
  }
  if (text.includes('locked') || text.includes('busy') || text.includes('ocupada')) {
    return SALE_BUSY;
  }
  if (text.includes('full') || text.includes('disk') || text.includes('espacio')) {
    return SALE_NO_SPACE;
  }
  return SALE_SAVE_FALLBACK;
}
