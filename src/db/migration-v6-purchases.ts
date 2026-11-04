// Migración v6: compras y costos. Nada se borra: una compra anulada se marca
// 'void' y su stock se compensa con movimientos 'purchase' negativos.
// El dinero se guarda en centavos; el tipo de cambio es un entero x10000.

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToV6(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      purchase_date TEXT NOT NULL
        CHECK (purchase_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      store TEXT,
      currency TEXT NOT NULL CHECK (currency IN ('MXN', 'USD')),
      -- Pesos por dólar multiplicados por 10000. Para MXN siempre es 10000.
      exchange_rate_x10000 INTEGER NOT NULL CHECK (exchange_rate_x10000 > 0),
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      total_mxn_cents INTEGER NOT NULL CHECK (total_mxn_cents >= 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
      voided_at TEXT,
      void_reason TEXT,
      CHECK (currency <> 'MXN' OR exchange_rate_x10000 = 10000),
      CHECK (
        currency <> 'USD'
        OR exchange_rate_x10000 BETWEEN 10000 AND 1000000
      )
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY NOT NULL,
      purchase_id INTEGER NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products (id),
      description TEXT NOT NULL,
      units INTEGER NOT NULL CHECK (units > 0),
      -- Costo total del renglón, en la moneda original y ya convertido a pesos.
      cost_cents INTEGER NOT NULL CHECK (cost_cents >= 0),
      cost_mxn_cents INTEGER NOT NULL CHECK (cost_mxn_cents >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date
      ON purchases (purchase_date);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase
      ON purchase_items (purchase_id);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_product
      ON purchase_items (product_id);
  `);
}
