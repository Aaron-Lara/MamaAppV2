// Base de datos local (offline-first).
//
// IMPORTANTE: las versiones ya aplicadas NUNCA se editan. Cualquier cambio
// nuevo (columna, tabla, índice) se agrega como versión siguiente:
//   if (currentVersion === 2) { ... }  y DATABASE_VERSION sube a 3.
// Así los teléfonos que ya migraron no se rompen ni pierden datos.

import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'pos.db';

const DATABASE_VERSION = 2;

/** Aplica las migraciones pendientes y deja la base lista para usarse. */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  // Versión 1: catálogo de productos (tabla de prueba).
  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL DEFAULT 0,
        category TEXT,
        track_stock INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);
    currentVersion = 1;
  }

  // Versión 2: clientes y ventas (efectivo y fiado).
  if (currentVersion === 1) {
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
    currentVersion = 2;
  }

  // user_version guarda un entero, así que se interpola (valor interno, no del usuario).
  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
