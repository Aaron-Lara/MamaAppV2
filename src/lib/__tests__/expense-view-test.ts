// Pruebas puras de la vista de gastos: filtros, conteos, totales y etiquetas.

import {
  DEFAULT_EXPENSE_VOID_REASON,
  type Expense,
} from '../expense-types';
import {
  activeExpenseTotalCents,
  buildExpenseDetailHeader,
  buildExpenseRows,
  countExpenses,
  expenseCategoryOptions,
  filterExpenses,
} from '../expense-view';

const TODAY = '2026-11-06';

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 1,
    createdAt: '2026-11-06T12:00:00.000Z',
    expenseDate: '2026-11-06',
    category: 'Limpieza',
    description: 'Jabón',
    amountCents: 1000,
    status: 'active',
    voidedAt: null,
    voidReason: null,
    ...overrides,
  };
}

const ITEMS: Expense[] = [
  expense({ id: 1, expenseDate: '2026-11-06', category: 'Limpieza', amountCents: 1000 }),
  expense({
    id: 2,
    expenseDate: '2026-11-05',
    category: 'Comida',
    amountCents: 2000,
    status: 'void',
    voidedAt: '2026-11-06T13:00:00.000Z',
    voidReason: '  registrado por error ',
  }),
  expense({ id: 3, expenseDate: '2026-11-05', category: 'Limpieza', amountCents: 3000 }),
];

describe('filterExpenses', () => {
  test('filtra por estado, fecha y categoría sin distinguir mayúsculas', () => {
    expect(
      filterExpenses(ITEMS, { status: 'active', date: null, category: null }).map(
        (item) => item.id
      )
    ).toEqual([1, 3]);

    expect(
      filterExpenses(ITEMS, { status: 'void', date: null, category: null }).map(
        (item) => item.id
      )
    ).toEqual([2]);

    expect(
      filterExpenses(ITEMS, {
        status: 'all',
        date: '2026-11-05',
        category: null,
      }).map((item) => item.id)
    ).toEqual([2, 3]);

    expect(
      filterExpenses(ITEMS, {
        status: 'all',
        date: null,
        category: '  limpieza ',
      }).map((item) => item.id)
    ).toEqual([1, 3]);
  });
});

describe('conteos, categorías y total activo', () => {
  test('cuenta todos, activos y anulados', () => {
    expect(countExpenses(ITEMS)).toEqual({ all: 3, active: 2, voided: 1 });
  });

  test('devuelve categorías únicas ordenadas', () => {
    expect(expenseCategoryOptions(ITEMS)).toEqual(['Comida', 'Limpieza']);
  });

  test('el total activo excluye los anulados', () => {
    expect(activeExpenseTotalCents(ITEMS)).toBe(4000);
    expect(activeExpenseTotalCents([])).toBe(0);
  });
});

describe('buildExpenseRows', () => {
  test('deja listas las etiquetas de fecha, importe y estado', () => {
    const rows = buildExpenseRows(ITEMS, TODAY);

    expect(rows[0]).toMatchObject({
      id: 1,
      categoryLabel: 'Limpieza',
      amountLabel: '$10.00',
      dateLabel: 'Hoy',
      descriptionLabel: 'Jabón',
      isVoid: false,
      statusLabel: 'Activo',
    });
    expect(rows[1]).toMatchObject({
      id: 2,
      dateLabel: 'Ayer',
      isVoid: true,
      statusLabel: 'Anulado',
    });
  });

  test('una descripción vacía se muestra como null', () => {
    const rows = buildExpenseRows([expense({ description: '   ' })], TODAY);
    expect(rows[0].descriptionLabel).toBeNull();
  });
});

describe('buildExpenseDetailHeader', () => {
  test('incluye el motivo recortado cuando el gasto está anulado', () => {
    const header = buildExpenseDetailHeader(ITEMS[1], TODAY);

    expect(header).toMatchObject({
      categoryLabel: 'Comida',
      amountLabel: '$20.00',
      dateLabel: 'Ayer',
      isVoid: true,
      statusLabel: 'Anulado',
      voidReasonLabel: 'registrado por error',
    });
  });

  test('un gasto activo no tiene motivo de anulación', () => {
    const header = buildExpenseDetailHeader(ITEMS[0], TODAY);
    expect(header.isVoid).toBe(false);
    expect(header.statusLabel).toBe('Activo');
    expect(header.voidReasonLabel).toBeNull();
  });

  test('oculta el motivo interno de la anulación rápida', () => {
    const header = buildExpenseDetailHeader(
      expense({
        status: 'void',
        voidedAt: '2026-11-06T13:00:00.000Z',
        voidReason: DEFAULT_EXPENSE_VOID_REASON,
      }),
      TODAY
    );

    expect(header.isVoid).toBe(true);
    expect(header.voidReasonLabel).toBeNull();
  });
});
