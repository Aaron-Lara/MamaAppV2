// Traducción de errores al guardar un pedido. Lógica pura y en español.

export function describeOrderSaveError(error: unknown): string {
  const text = error instanceof Error ? error.message : '';
  if (/cliente/i.test(text)) {
    return 'El cliente del pedido ya no existe. Elige otro.';
  }
  if (/producto/i.test(text)) {
    return 'Un producto del pedido ya no existe. Revísalo.';
  }
  return 'No se pudo guardar el pedido. Inténtalo de nuevo.';
}
