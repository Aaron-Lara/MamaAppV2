// Migración v3: movimientos de inventario (entradas, salidas y ajustes).
// Cada renglón es un movimiento inmutable: el stock es la suma de quantity.

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY NOT NULL,
        product_id INTEGER NOT NULL REFERENCES products (id),
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        -- Fecha local del teléfono, para agrupar por día sin depender de UTC.
        movement_date TEXT NOT NULL
          CHECK (movement_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
        -- Positivo entra, negativo sale. Nunca cero.
        quantity INTEGER NOT NULL CHECK (quantity <> 0),
        reason TEXT NOT NULL
          CHECK (reason IN ('purchase', 'sale', 'adjustment', 'waste', 'void')),
        reference_id INTEGER,
        note TEXT,
        -- Un movimiento de venta siempre apunta a su venta.
        CHECK (reason <> 'sale' OR reference_id IS NOT NULL)
      );

      CREATE INDEX IF NOT EXISTS idx_stock_movements_product
        ON stock_movements (product_id);
    `);
}
