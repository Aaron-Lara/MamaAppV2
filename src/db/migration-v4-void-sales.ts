// Migración v4: anulación de ventas (fecha y motivo, ambos opcionales).

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

export async function migrateToV4(db: SQLiteDatabase): Promise<void> {
  // Nombres internos, nunca del usuario: se pueden interpolar.
  for (const column of ['voided_at', 'void_reason'] as const) {
    if (!(await hasColumn(db, 'sales', column))) {
      await db.execAsync(`ALTER TABLE sales ADD COLUMN ${column} TEXT`);
    }
  }
}
