// Migración v5: abonos de fiados. La tabla no borra nada: los abonos se
// anulan con status = 'void'. Solo se cobra en efectivo, así que no hay
// columna de forma de pago.

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToV5(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers (id),
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      payment_date TEXT NOT NULL
        CHECK (payment_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      note TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
      voided_at TEXT,
      void_reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);
  `);
}
