// Costo proporcional de un producto comprado. El costo unitario no se guarda:
// se calcula a partir del costo total del renglón y sus unidades.

function assertCost(costMxnCents: number): void {
  if (!Number.isSafeInteger(costMxnCents) || costMxnCents < 0) {
    throw new Error('El costo total debe ser un entero mayor o igual a cero.');
  }
}

function assertUnits(units: number): void {
  if (!Number.isSafeInteger(units) || units <= 0) {
    throw new Error('Las unidades deben ser un entero mayor a cero.');
  }
}

/**
 * Parte proporcional del costo total para las unidades vendidas.
 * Todo se calcula con enteros; el redondeo de la mitad sube.
 */
export function costOfUnits(
  costMxnCents: number,
  units: number,
  unitsSold: number
): number {
  assertCost(costMxnCents);
  assertUnits(units);
  if (!Number.isSafeInteger(unitsSold) || unitsSold < 0 || unitsSold > units) {
    throw new Error('Las unidades vendidas deben ser un entero entre cero y las unidades compradas.');
  }
  const product = costMxnCents * unitsSold;
  if (!Number.isSafeInteger(product)) {
    throw new Error('El costo proporcional se sale del rango seguro de enteros.');
  }
  return Math.round(product / units);
}

/** Costo de una sola unidad, redondeado al centavo. */
export function unitCostCents(costMxnCents: number, units: number): number {
  return costOfUnits(costMxnCents, units, 1);
}
