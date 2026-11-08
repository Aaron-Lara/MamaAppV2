// Textos de la anulación de gastos: errores en español, sin detalles técnicos.
// Lógica pura, sin Alert ni base de datos.

/** Traduce el error de voidExpense a un mensaje para la usuaria. */
export function translateVoidExpenseError(error: unknown): string {
  const text = error instanceof Error ? error.message.toLowerCase() : '';
  if (text.includes('ya está anulado')) {
    return 'Ese gasto ya está anulado.';
  }
  if (text.includes('no existe')) {
    return 'Ese gasto ya no existe.';
  }
  return 'No se pudo anular el gasto. Inténtalo de nuevo.';
}
