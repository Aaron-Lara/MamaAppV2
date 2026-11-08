// Migración v8: cancelar un pedido ya no exige motivo.
// SQLite no permite cambiar un CHECK en sitio, así que se reconstruye la
// tabla orders conservando ids, datos y la relación con order_items.

import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Reconstruye orders para que un pedido cancelado pueda tener cancel_reason
 * NULL. Los pedidos viejos con motivo siguen siendo válidos.
 */
export async function migrateToV8(db: SQLiteDatabase): Promise<void> {
  // PRAGMA foreign_keys no se puede cambiar dentro de una transacción.
  await db.execAsync('PRAGMA foreign_keys = OFF');
  try {
    await db.execAsync('BEGIN');
    try {
      await db.execAsync(`
        DROP TABLE IF EXISTS orders_new;

        CREATE TABLE orders_new (
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
          -- Un cancelado ya no necesita motivo; si existe, no puede quedar vacío.
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
              AND (cancel_reason IS NULL OR length(trim(cancel_reason)) > 0))
          )
        );

        INSERT INTO orders_new (
          id, created_at, customer_id, order_date, due_date, notes, status,
          delivered_at, delivered_sale_id, cancelled_at, cancel_reason
        )
        SELECT
          id, created_at, customer_id, order_date, due_date, notes, status,
          delivered_at, delivered_sale_id, cancelled_at, cancel_reason
        FROM orders;

        DROP TABLE orders;
        ALTER TABLE orders_new RENAME TO orders;

        CREATE INDEX IF NOT EXISTS idx_orders_status_order_date
          ON orders (status, order_date);
        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders (customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders (due_date);
      `);
      await db.execAsync('COMMIT');
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON');
  }
}
