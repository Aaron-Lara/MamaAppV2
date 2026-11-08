// Migración v7: pedidos, gastos y datos escolares de clientes.
// Es aditiva: agrega columnas, tablas e índices sin reconstruir ni borrar.
// Los pedidos no se borran: se cancelan. Las compras no son gastos.

import type { SQLiteDatabase } from 'expo-sqlite';

/** true si la tabla ya tiene esa columna (ALTER TABLE no admite IF NOT EXISTS). */
async function hasColumn(
  db: SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((row) => row.name === column);
}

export async function migrateToV7(db: SQLiteDatabase): Promise<void> {
  // Cada columna se comprueba por separado: si la migración falla a medias,
  // el siguiente arranque agrega solo lo que falta y no duplica columnas.
  if (!(await hasColumn(db, 'customers', 'grade'))) {
    await db.execAsync('ALTER TABLE customers ADD COLUMN grade TEXT');
  }
  if (!(await hasColumn(db, 'customers', 'group_name'))) {
    await db.execAsync('ALTER TABLE customers ADD COLUMN group_name TEXT');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      customer_id INTEGER NOT NULL REFERENCES customers (id),
      order_date TEXT NOT NULL
        CHECK (order_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      due_date TEXT
        CHECK (
          due_date IS NULL
          OR (
            due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
            AND due_date >= order_date
          )
        ),
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'delivered', 'cancelled')),
      delivered_at TEXT,
      delivered_sale_id INTEGER UNIQUE REFERENCES sales (id),
      cancelled_at TEXT,
      cancel_reason TEXT,
      -- Una sola matriz: el estado y sus campos de cierre no se contradicen.
      CHECK (
        (status = 'pending'
          AND delivered_at IS NULL
          AND delivered_sale_id IS NULL
          AND cancelled_at IS NULL
          AND cancel_reason IS NULL)
        OR
        (status = 'delivered'
          AND delivered_at IS NOT NULL
          AND delivered_sale_id IS NOT NULL
          AND cancelled_at IS NULL
          AND cancel_reason IS NULL)
        OR
        (status = 'cancelled'
          AND delivered_at IS NULL
          AND delivered_sale_id IS NULL
          AND cancelled_at IS NOT NULL
          AND cancel_reason IS NOT NULL
          AND length(trim(cancel_reason)) > 0)
      )
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY NOT NULL,
      -- Sin ON DELETE CASCADE: los pedidos no se borran, se cancelan.
      order_id INTEGER NOT NULL REFERENCES orders (id),
      product_id INTEGER REFERENCES products (id),
      description TEXT NOT NULL CHECK (length(trim(description)) > 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      expense_date TEXT NOT NULL
        CHECK (expense_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      category TEXT NOT NULL CHECK (length(trim(category)) > 0),
      description TEXT,
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'void')),
      voided_at TEXT,
      void_reason TEXT,
      -- active no tiene datos de anulación; void exige ambos y motivo real.
      CHECK (
        (status = 'active'
          AND voided_at IS NULL
          AND void_reason IS NULL)
        OR
        (status = 'void'
          AND voided_at IS NOT NULL
          AND void_reason IS NOT NULL
          AND length(trim(void_reason)) > 0)
      )
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status_order_date
      ON orders (status, order_date);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders (due_date);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_status_date
      ON expenses (status, expense_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category);
    CREATE INDEX IF NOT EXISTS idx_customers_grade_group
      ON customers (grade, group_name);
  `);
}
