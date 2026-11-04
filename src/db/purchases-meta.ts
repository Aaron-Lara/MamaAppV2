// Datos auxiliares del formulario de compras: tiendas ya usadas y el último
// tipo de cambio en dólares. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

/** Tiendas distintas, las de compras más recientes primero. */
export async function listStoreNames(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ store: string }>(
    `SELECT store
       FROM purchases
      WHERE store IS NOT NULL AND TRIM(store) <> ''
      GROUP BY store
      ORDER BY MAX(purchase_date) DESC, MAX(created_at) DESC, store COLLATE NOCASE ASC`
  );
  return rows.map((row) => row.store);
}

/** Último tipo de cambio usado en una compra en dólares, o null si no hay. */
export async function getLastExchangeRate(db: SQLiteDatabase): Promise<number | null> {
  const row = await db.getFirstAsync<{ exchange_rate_x10000: number }>(
    `SELECT exchange_rate_x10000
       FROM purchases
      WHERE currency = 'USD'
      ORDER BY created_at DESC, id DESC
      LIMIT 1`
  );
  return row?.exchange_rate_x10000 ?? null;
}
