// Pruebas puras del formulario de gastos: texto escrito -> gasto válido.

import {
  validateExpenseForm,
  type ExpenseFormValues,
} from '../expense-form';
import {
  MAX_EXPENSE_CATEGORY_LENGTH,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
} from '../expense-types';

const TODAY = '2026-11-06';

function form(overrides: Partial<ExpenseFormValues> = {}): ExpenseFormValues {
  return {
    category: 'Limpieza',
    amount: '45.00',
    description: 'Jabón',
    ...overrides,
  };
}

describe('validateExpenseForm: casos válidos', () => {
  test('acepta los datos y normaliza espacios', () => {
    const result = validateExpenseForm(
      form({
        category: '  Material   de limpieza ',
        description: '  jabón    líquido ',
      }),
      '2026-11-05',
      TODAY
    );

    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.input).toMatchObject({
      expenseDate: '2026-11-05',
      category: 'Material de limpieza',
      description: 'jabón líquido',
      amountCents: 4500,
    });
  });

  test('acepta coma decimal y el signo de pesos', () => {
    expect(validateExpenseForm(form({ amount: '12,50' }), TODAY, TODAY).input)
      .toMatchObject({ amountCents: 1250 });
    expect(validateExpenseForm(form({ amount: '$7' }), TODAY, TODAY).input)
      .toMatchObject({ amountCents: 700 });
  });

  test('la descripción vacía se guarda como null', () => {
    const result = validateExpenseForm(form({ description: '   ' }), TODAY, TODAY);
    expect(result.ok).toBe(true);
    expect(result.input?.description).toBeNull();
  });

  test('acepta los límites de categoría y descripción', () => {
    const category = 'a'.repeat(MAX_EXPENSE_CATEGORY_LENGTH);
    const description = 'a'.repeat(MAX_EXPENSE_DESCRIPTION_LENGTH);
    expect(
      validateExpenseForm(form({ category, description }), TODAY, TODAY).ok
    ).toBe(true);
  });
});

describe('validateExpenseForm: rechazos por campo', () => {
  test('rechaza una categoría vacía o demasiado larga', () => {
    expect(validateExpenseForm(form({ category: '   ' }), TODAY, TODAY).errors.category)
      .toBe('Escribe una categoría.');
    const longCategory = 'a'.repeat(MAX_EXPENSE_CATEGORY_LENGTH + 1);
    expect(
      validateExpenseForm(form({ category: longCategory }), TODAY, TODAY).errors.category
    ).toContain(`${MAX_EXPENSE_CATEGORY_LENGTH}`);
  });

  test('rechaza importes vacíos, cero, negativos o mal escritos', () => {
    expect(validateExpenseForm(form({ amount: '' }), TODAY, TODAY).errors.amount)
      .toContain('importe');
    expect(validateExpenseForm(form({ amount: '0' }), TODAY, TODAY).errors.amount)
      .toContain('mayor a cero');
    expect(validateExpenseForm(form({ amount: '-1' }), TODAY, TODAY).errors.amount)
      .toContain('negativo');
    expect(validateExpenseForm(form({ amount: '12.345' }), TODAY, TODAY).errors.amount)
      .toContain('2 decimales');
    expect(validateExpenseForm(form({ amount: 'abc' }), TODAY, TODAY).errors.amount)
      .toContain('números');
  });

  test('rechaza fechas inválidas o futuras', () => {
    expect(
      validateExpenseForm(form(), '2026-02-30', TODAY).errors.date
    ).toBe('La fecha del gasto no es válida.');
    expect(
      validateExpenseForm(form(), '2026-11-07', TODAY).errors.date
    ).toBe('La fecha del gasto no puede ser futura.');
  });

  test('rechaza una descripción demasiado larga', () => {
    const description = 'a'.repeat(MAX_EXPENSE_DESCRIPTION_LENGTH + 1);
    expect(
      validateExpenseForm(form({ description }), TODAY, TODAY).errors.description
    ).toContain(`${MAX_EXPENSE_DESCRIPTION_LENGTH}`);
  });

  test('junta varios errores a la vez', () => {
    const result = validateExpenseForm(
      form({ category: '', amount: '', description: 'a'.repeat(201) }),
      '2026-11-07',
      TODAY
    );

    expect(result.ok).toBe(false);
    expect(result.input).toBeNull();
    expect(result.errors.category).toBeDefined();
    expect(result.errors.amount).toBeDefined();
    expect(result.errors.description).toBeDefined();
    expect(result.errors.date).toBeDefined();
  });
});
