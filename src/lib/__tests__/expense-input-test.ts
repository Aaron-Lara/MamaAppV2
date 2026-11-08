// Pruebas puras de gastos: categoría, importe, fecha, descripción y anulación.

import {
  MAX_EXPENSE_CATEGORY_LENGTH,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  validateNewExpense,
  validateVoidExpenseInput,
  type NewExpenseInput,
} from '../expense-input';
import { MAX_VOID_REASON_LENGTH } from '../void-input';

const TODAY = '2026-11-06';

function expense(overrides: Partial<NewExpenseInput> = {}): NewExpenseInput {
  return {
    expenseDate: '2026-11-05',
    category: 'Limpieza',
    description: 'Jabón',
    amountCents: 4500,
    ...overrides,
  };
}

describe('validateNewExpense: casos válidos', () => {
  test('normaliza espacios y usa el día recibido', () => {
    const result = validateNewExpense(
      expense({
        expenseDate: undefined,
        category: '  Material   de  limpieza ',
        description: '  jabón    líquido ',
      }),
      TODAY
    );

    expect(result).toEqual({
      expenseDate: TODAY,
      category: 'Material de limpieza',
      description: 'jabón líquido',
      amountCents: 4500,
    });
  });

  test('la descripción vacía o ausente se guarda como null', () => {
    expect(
      validateNewExpense(expense({ description: '   ' }), TODAY).description
    ).toBeNull();
    expect(
      validateNewExpense(expense({ description: null }), TODAY).description
    ).toBeNull();
  });

  test('acepta hoy como fecha del gasto', () => {
    expect(() =>
      validateNewExpense(expense({ expenseDate: TODAY }), TODAY)
    ).not.toThrow();
  });

  test(`acepta una categoría de ${MAX_EXPENSE_CATEGORY_LENGTH} caracteres`, () => {
    const category = 'a'.repeat(MAX_EXPENSE_CATEGORY_LENGTH);
    expect(validateNewExpense(expense({ category }), TODAY).category).toBe(category);
  });

  test(`acepta una descripción de ${MAX_EXPENSE_DESCRIPTION_LENGTH} caracteres`, () => {
    const description = 'a'.repeat(MAX_EXPENSE_DESCRIPTION_LENGTH);
    expect(
      validateNewExpense(expense({ description }), TODAY).description
    ).toBe(description);
  });
});

describe('validateNewExpense: rechazos', () => {
  test('rechaza una categoría vacía o de solo espacios', () => {
    expect(() => validateNewExpense(expense({ category: '' }), TODAY)).toThrow(
      'vacía'
    );
    expect(() =>
      validateNewExpense(expense({ category: '   ' }), TODAY)
    ).toThrow('vacía');
  });

  test('rechaza una categoría demasiado larga', () => {
    const category = 'a'.repeat(MAX_EXPENSE_CATEGORY_LENGTH + 1);
    expect(() => validateNewExpense(expense({ category }), TODAY)).toThrow(
      `${MAX_EXPENSE_CATEGORY_LENGTH}`
    );
  });

  test('rechaza importes cero, negativos, decimales o no numéricos', () => {
    expect(() =>
      validateNewExpense(expense({ amountCents: 0 }), TODAY)
    ).toThrow('mayor a cero');
    expect(() =>
      validateNewExpense(expense({ amountCents: -1 }), TODAY)
    ).toThrow('mayor a cero');
    expect(() =>
      validateNewExpense(expense({ amountCents: 12.5 }), TODAY)
    ).toThrow('entero');
    expect(() =>
      validateNewExpense(
        expense({ amountCents: Number.NaN }),
        TODAY
      )
    ).toThrow('entero');
  });

  test('rechaza fechas inválidas o futuras', () => {
    expect(() =>
      validateNewExpense(expense({ expenseDate: '2026-02-30' }), TODAY)
    ).toThrow('no es válida');
    expect(() =>
      validateNewExpense(expense({ expenseDate: '2026-11-07' }), TODAY)
    ).toThrow('futura');
  });

  test('rechaza una descripción demasiado larga', () => {
    const description = 'a'.repeat(MAX_EXPENSE_DESCRIPTION_LENGTH + 1);
    expect(() =>
      validateNewExpense(expense({ description }), TODAY)
    ).toThrow(`${MAX_EXPENSE_DESCRIPTION_LENGTH}`);
  });
});

describe('validateVoidExpenseInput', () => {
  test('recorta y junta los espacios del motivo', () => {
    expect(validateVoidExpenseInput(7, '  error   de captura  ')).toEqual({
      expenseId: 7,
      reason: 'error de captura',
    });
  });

  test('rechaza ids inválidos', () => {
    expect(() => validateVoidExpenseInput(0, 'motivo')).toThrow('gasto');
    expect(() => validateVoidExpenseInput(-1, 'motivo')).toThrow('gasto');
  });

  test('rechaza un motivo vacío o de solo espacios', () => {
    expect(() => validateVoidExpenseInput(7, '')).toThrow('vacío');
    expect(() => validateVoidExpenseInput(7, '   ')).toThrow('vacío');
  });

  test(`acepta ${MAX_VOID_REASON_LENGTH} caracteres y rechaza uno más`, () => {
    const reason = 'a'.repeat(MAX_VOID_REASON_LENGTH);
    expect(validateVoidExpenseInput(7, reason).reason).toBe(reason);
    expect(() =>
      validateVoidExpenseInput(7, 'a'.repeat(MAX_VOID_REASON_LENGTH + 1))
    ).toThrow(`${MAX_VOID_REASON_LENGTH}`);
  });
});
