// Migración v2: clientes y ventas (efectivo y fiado).

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        role TEXT,
        phone TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        sale_date TEXT NOT NULL
          CHECK (sale_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
        customer_id INTEGER REFERENCES customers (id),
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'credit')),
        total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'void')),
        -- Una venta fiada siempre tiene cliente.
        CHECK (payment_method <> 'credit' OR customer_id IS NOT NULL)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY NOT NULL,
        sale_id INTEGER NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products (id),
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
      );

      CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales (sale_date);
      CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
    `);
}
