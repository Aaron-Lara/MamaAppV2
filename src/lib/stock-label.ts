// Etiqueta de stock para la usuaria: nunca muestra números negativos.
// Un stock negativo es un error de conteo, no un número para la pantalla.

/** Stock interno (puede ser negativo) -> texto que ve la usuaria. */
export function formatStockLabel(stock: number): string {
  if (stock < 0) {
    return 'Sin stock · revisar conteo';
  }
  if (stock === 0) {
    return 'Sin stock';
  }
  return String(stock);
}
