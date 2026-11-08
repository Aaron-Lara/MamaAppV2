// Validación pura del formulario de gastos: texto de la usuaria -> NewExpenseInput.
// No toca la base ni el reloj; la fecha de hoy se recibe como parámetro.

import { isValidDateString } from './dates';
import { normalizeExpenseText, validateNewExpense } from './expense-input';
import {
  MAX_EXPENSE_CATEGORY_LENGTH,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  type NewExpenseInput,
} from './expense-types';
import { parseMoneyToCents } from './money-input';

/** Sugerencias rápidas; la categoría siempre se puede escribir a mano. */
export const EXPENSE_CATEGORY_SUGGESTIONS = [
  'Limpieza',
  'Comida',
  'Transporte',
  'Papelería',
  'Mantenimiento',
] as const;

export type ExpenseFormValues = {
  category: string;
  amount: string;
  description: string;
};

export type ExpenseFormErrors = {
  category?: string;
  amount?: string;
  description?: string;
  date?: string;
  form?: string;
};

export type ExpenseFormResult = {
  ok: boolean;
  errors: ExpenseFormErrors;
  input: NewExpenseInput | null;
};

/** Cambia "precio" por "importe" para que los mensajes hablen de gastos. */
function amountErrorMessage(error: unknown): string {
  const text =
    error instanceof Error ? error.message : 'El importe del gasto no es válido.';
  return text.replace(/precio/gi, 'importe');
}

/**
 * Valida todos los campos a la vez. Devuelve errores por campo para que la
 * pantalla los muestre junto a cada entrada, sin llamar a la base.
 */
export function validateExpenseForm(
  values: ExpenseFormValues,
  expenseDate: string,
  today: string
): ExpenseFormResult {
  const errors: ExpenseFormErrors = {};
  const category = normalizeExpenseText(values.category);
  const description = normalizeExpenseText(values.description);
  const cleanDate = expenseDate.trim();

  if (!category) {
    errors.category = 'Escribe una categoría.';
  } else if (category.length > MAX_EXPENSE_CATEGORY_LENGTH) {
    errors.category = `La categoría no puede pasar de ${MAX_EXPENSE_CATEGORY_LENGTH} caracteres.`;
  }

  if (description.length > MAX_EXPENSE_DESCRIPTION_LENGTH) {
    errors.description = `La descripción no puede pasar de ${MAX_EXPENSE_DESCRIPTION_LENGTH} caracteres.`;
  }

  if (!isValidDateString(cleanDate)) {
    errors.date = 'La fecha del gasto no es válida.';
  } else if (cleanDate > today) {
    errors.date = 'La fecha del gasto no puede ser futura.';
  }

  let amountCents = 0;
  try {
    amountCents = parseMoneyToCents(values.amount);
  } catch (error) {
    errors.amount = amountErrorMessage(error);
  }
  if (!errors.amount && amountCents <= 0) {
    errors.amount = 'El importe del gasto debe ser mayor a cero.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, input: null };
  }

  try {
    const input = validateNewExpense(
      {
        expenseDate: cleanDate,
        category,
        description,
        amountCents,
      },
      today
    );
    return { ok: true, errors: {}, input };
  } catch (error) {
    return {
      ok: false,
      errors: {
        form:
          error instanceof Error
            ? error.message
            : 'El gasto no es válido.',
      },
      input: null,
    };
  }
}
