// Utilidades de dinero. Todo se maneja en centavos (enteros), nunca en decimales.

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

/** Falla si el valor no es un entero seguro (centavos o cantidades). */
function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} debe ser un número entero.`);
  }
}

/** Suma una lista de montos en centavos. */
export function sumCents(amounts: readonly number[]): number {
  let total = 0;
  for (const amount of amounts) {
    assertSafeInteger(amount, 'Cada monto en centavos');
    total += amount;
    if (!Number.isSafeInteger(total)) {
      throw new Error('La suma se sale del rango seguro de enteros.');
    }
  }
  return total;
}

/** Total de un renglón: cantidad por precio unitario, en centavos. */
export function lineTotalCents(quantity: number, unitPriceCents: number): number {
  assertSafeInteger(quantity, 'La cantidad');
  assertSafeInteger(unitPriceCents, 'El precio en centavos');
  if (quantity < 0) {
    throw new Error('La cantidad no puede ser negativa.');
  }
  if (unitPriceCents < 0) {
    throw new Error('El precio no puede ser negativo.');
  }
  const total = quantity * unitPriceCents;
  if (!Number.isSafeInteger(total)) {
    throw new Error('El total del renglón se sale del rango seguro de enteros.');
  }
  return total;
}

/**
 * Centavos -> texto en pesos con separador de miles: 1250 -> "$12.50".
 * No usa Intl a propósito: su salida cambia entre plataformas y haría
 * frágiles las pruebas. Se parte el número como texto para no perder
 * precisión con la división.
 */
export function formatCents(cents: number): string {
  assertSafeInteger(cents, 'El monto en centavos');
  const sign = cents < 0 ? '-' : '';
  const digits = String(Math.abs(cents)).padStart(3, '0');
  const pesos = digits.slice(0, -2).replace(THOUSANDS, ',');
  const decimals = digits.slice(-2);
  return `${sign}$${pesos}.${decimals}`;
}
