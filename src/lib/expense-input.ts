// Validación pura de gastos. No lee el reloj ni toca la base: "today" se
// recibe como parámetro para que las pruebas sean deterministas.

import { isValidDateString } from './dates';
import {
  MAX_EXPENSE_CATEGORY_LENGTH,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  type NewExpenseInput,
  type ValidExpenseInput,
  type VoidExpenseInput,
} from './expense-types';
import { validateVoidId, validateVoidReason } from './void-input';

export * from './expense-types';

/** Junta espacios repetidos y quita los de los extremos. */
export function normalizeExpenseText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** La categoría es obligatoria: no puede quedar vacía. */
function validateCategory(category: string): string {
  if (typeof category !== 'string') {
    throw new Error('La categoría del gasto no es válida.');
  }
  const clean = normalizeExpenseText(category);
  if (!clean) {
    throw new Error('La categoría del gasto no puede quedar vacía.');
  }
  if (clean.length > MAX_EXPENSE_CATEGORY_LENGTH) {
    throw new Error(
      `La categoría no puede pasar de ${MAX_EXPENSE_CATEGORY_LENGTH} caracteres.`
    );
  }
  return clean;
}

/** La descripción es opcional; vacía o ausente se guarda como null. */
function validateDescription(
  description: string | null | undefined
): string | null {
  if (description == null) {
    return null;
  }
  if (typeof description !== 'string') {
    throw new Error('La descripción del gasto no es válida.');
  }
  const clean = normalizeExpenseText(description);
  if (!clean) {
    return null;
  }
  if (clean.length > MAX_EXPENSE_DESCRIPTION_LENGTH) {
    throw new Error(
      `La descripción no puede pasar de ${MAX_EXPENSE_DESCRIPTION_LENGTH} caracteres.`
    );
  }
  return clean;
}

/** Valida y normaliza un gasto antes de escribir nada en la base. */
export function validateNewExpense(
  input: NewExpenseInput,
  today: string
): ValidExpenseInput {
  if (!isValidDateString(today)) {
    throw new Error('La fecha de hoy no es válida.');
  }

  const category = validateCategory(input.category);

  if (!Number.isSafeInteger(input.amountCents)) {
    throw new Error('El importe del gasto debe ser un entero en centavos.');
  }
  if (input.amountCents <= 0) {
    throw new Error('El importe del gasto debe ser mayor a cero.');
  }

  const expenseDate = input.expenseDate ?? today;
  if (!isValidDateString(expenseDate)) {
    throw new Error('La fecha del gasto no es válida.');
  }
  if (expenseDate > today) {
    throw new Error('La fecha del gasto no puede ser futura.');
  }

  return {
    expenseDate,
    category,
    description: validateDescription(input.description),
    amountCents: input.amountCents,
  };
}

/** Anular exige un motivo no vacío, además de un id válido. */
export function validateVoidExpenseInput(
  expenseId: number,
  reason: string
): VoidExpenseInput {
  return {
    expenseId: validateVoidId(expenseId, 'gasto'),
    reason: normalizeExpenseText(validateVoidReason(reason)),
  };
}
