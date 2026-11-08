// Pruebas de gastos contra SQLite real en memoria: alta, consulta, filtros,
// anulación y ausencia de efectos en efectivo o inventario.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/database';
import { createExpense } from '@/db/expenses-create';
import { getExpense } from '@/db/expenses-get';
import { listExpenses, sumActiveExpenses } from '@/db/expenses-list';
import { voidExpense } from '@/db/expenses-void';
import { getDaySummary } from '@/db/day-summary';
import { recordSale } from '@/db/sales';
import { MemorySQLiteDatabase } from '../../../test-utils/memory-sqlite';

const TODAY = '2026-11-06';

let memory: MemorySQLiteDatabase;
let db: SQLiteDatabase;

beforeEach(async () => {
  memory = new MemorySQLiteDatabase();
  db = memory as unknown as SQLiteDatabase;
  await migrateDbIfNeeded(db);
});

afterEach(() => memory.close());

async function count(table: string): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${table}`
  );
  return row?.total ?? 0;
}

describe('createExpense y getExpense', () => {
  test('guarda un gasto activo y normaliza sus textos', async () => {
    const id = await createExpense(
      db,
      {
        expenseDate: '2026-11-05',
        category: '  Material   de limpieza ',
        description: '  jabón   líquido  ',
        amountCents: 4500,
      },
      TODAY
    );

    const expense = await getExpense(db, id);
    expect(expense).toMatchObject({
      id,
      expenseDate: '2026-11-05',
      category: 'Material de limpieza',
      description: 'jabón líquido',
      amountCents: 4500,
      status: 'active',
      voidedAt: null,
      voidReason: null,
    });
    expect(await getExpense(db, 999)).toBeNull();
    expect(await count('stock_movements')).toBe(0);
    expect(await count('sales')).toBe(0);
    expect(await count('purchases')).toBe(0);
  });

  test('rechaza gastos inválidos sin escribir filas', async () => {
    await expect(
      createExpense(db, { category: '   ', amountCents: 100 }, TODAY)
    ).rejects.toThrow('vacía');
    await expect(
      createExpense(db, { category: 'Comida', amountCents: 0 }, TODAY)
    ).rejects.toThrow('mayor a cero');
    await expect(
      createExpense(
        db,
        {
          category: 'Comida',
          amountCents: 100,
          expenseDate: '2026-11-07',
        },
        TODAY
      )
    ).rejects.toThrow('futura');

    expect(await count('expenses')).toBe(0);
  });
});

describe('listExpenses y sumActiveExpenses', () => {
  test('filtra por estado, fecha y categoría, y excluye anulados del total', async () => {
    const older = await createExpense(
      db,
      { expenseDate: '2026-11-04', category: 'Limpieza', amountCents: 1000 },
      TODAY
    );
    const middle = await createExpense(
      db,
      { expenseDate: '2026-11-05', category: 'Comida', amountCents: 2000 },
      TODAY
    );
    const newest = await createExpense(
      db,
      { expenseDate: '2026-11-06', category: 'Limpieza', amountCents: 3000 },
      TODAY
    );
    await voidExpense(db, middle, 'registrado por error');

    const all = await listExpenses(db);
    expect(all.map((expense) => expense.id)).toEqual([newest, middle, older]);
    expect(all[1]).toMatchObject({ id: middle, status: 'void' });

    const active = await listExpenses(db, { status: 'active' });
    expect(active.map((expense) => expense.id)).toEqual([newest, older]);

    const voided = await listExpenses(db, { status: 'void' });
    expect(voided.map((expense) => expense.id)).toEqual([middle]);

    const byDate = await listExpenses(db, { date: '2026-11-04' });
    expect(byDate.map((expense) => expense.id)).toEqual([older]);

    const byCategory = await listExpenses(db, { category: 'limpieza' });
    expect(byCategory.map((expense) => expense.id)).toEqual([newest, older]);

    expect(await listExpenses(db, { limit: 1 })).toHaveLength(1);
    expect(await sumActiveExpenses(db)).toBe(4000);
    expect(await sumActiveExpenses(db, { date: '2026-11-04' })).toBe(1000);
    expect(await sumActiveExpenses(db, { category: 'comida' })).toBe(0);
    expect(await sumActiveExpenses(db, { category: 'limpieza' })).toBe(4000);
  });

  test('rechaza filtros inválidos', async () => {
    await expect(listExpenses(db, { status: 'borrado' as 'active' })).rejects.toThrow(
      'estado'
    );
    await expect(listExpenses(db, { date: 'ayer' })).rejects.toThrow('fecha');
    await expect(listExpenses(db, { limit: 0 })).rejects.toThrow('límite');
  });
});

describe('voidExpense', () => {
  test('anula sin borrar, guarda motivo y rechaza una segunda anulación', async () => {
    const id = await createExpense(
      db,
      { category: 'Comida', amountCents: 2500 },
      TODAY
    );

    await voidExpense(db, id, '  error   de captura  ');

    const expense = await getExpense(db, id);
    expect(expense).toMatchObject({
      id,
      status: 'void',
      voidReason: 'error de captura',
    });
    expect(expense?.voidedAt).toEqual(expect.any(String));
    expect(await count('expenses')).toBe(1);

    await expect(voidExpense(db, id, 'otra vez')).rejects.toThrow('anulado');
    await expect(voidExpense(db, 999, 'motivo')).rejects.toThrow('no existe');
    expect((await getExpense(db, id))?.status).toBe('void');
  });

  test('rechaza un motivo vacío sin cambiar el gasto', async () => {
    const id = await createExpense(
      db,
      { category: 'Comida', amountCents: 2500 },
      TODAY
    );

    await expect(voidExpense(db, id, '   ')).rejects.toThrow('vacío');
    expect((await getExpense(db, id))?.status).toBe('active');
  });
});

describe('reglas de integración', () => {
  test('un gasto no altera el efectivo ni genera movimientos de inventario', async () => {
    await recordSale(db, {
      paymentMethod: 'cash',
      saleDate: TODAY,
      items: [
        { description: 'Venta del día', quantity: 1, unitPriceCents: 5000 },
      ],
    });
    const before = await getDaySummary(db, TODAY);
    const movementsBefore = await count('stock_movements');

    await createExpense(
      db,
      { category: 'Limpieza', amountCents: 1200 },
      TODAY
    );

    const after = await getDaySummary(db, TODAY);
    expect(after).toEqual(before);
    expect(await count('stock_movements')).toBe(movementsBefore);
    expect(await count('purchases')).toBe(0);
    expect(await sumActiveExpenses(db)).toBe(1200);
  });
});
