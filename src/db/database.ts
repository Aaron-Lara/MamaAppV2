// Base de datos local (offline-first).
//
// IMPORTANTE: las versiones ya aplicadas NUNCA se editan. Cualquier cambio
// nuevo (columna, tabla, índice) se agrega como versión siguiente:
//   if (currentVersion === 2) { ... }  y DATABASE_VERSION sube a 3.
// Así los teléfonos que ya migraron no se rompen ni pierden datos.

import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'pos.db';

const DATABASE_VERSION = 1;

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

  // user_version guarda un entero, así que se interpola (valor interno, no del usuario).
  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
