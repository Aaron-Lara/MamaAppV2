// Base de datos local (offline-first).
//
// IMPORTANTE: las versiones ya aplicadas NUNCA se editan. Cualquier cambio
// nuevo (columna, tabla, índice) se agrega como versión siguiente en su
// propio archivo src/db/migration-vN-*.ts, se encadena en migrateDbIfNeeded
// y DATABASE_VERSION sube a N+1.
// Así los teléfonos que ya migraron no se rompen ni pierden datos.

import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateToV1 } from '@/db/migration-v1-products';
import { migrateToV2 } from '@/db/migration-v2-customers-sales';
import { migrateToV3 } from '@/db/migration-v3-stock-movements';
import { migrateToV4 } from '@/db/migration-v4-void-sales';
import { migrateToV5 } from '@/db/migration-v5-payments';
import { migrateToV6 } from '@/db/migration-v6-purchases';
import { migrateToV7 } from '@/db/migration-v7-orders-expenses-school';
import { migrateToV8 } from '@/db/migration-v8-cancel-reason';

export const DATABASE_NAME = 'pos.db';

const DATABASE_VERSION = 8;

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
    await migrateToV1(db);
    currentVersion = 1;
  }

  // Versión 2: clientes y ventas (efectivo y fiado).
  if (currentVersion === 1) {
    await migrateToV2(db);
    currentVersion = 2;
  }

  // Versión 3: movimientos de inventario (entradas, salidas y ajustes).
  // Cada renglón es un movimiento inmutable: el stock es la suma de quantity.
  if (currentVersion === 2) {
    await migrateToV3(db);
    currentVersion = 3;
  }

  // Versión 4: anulación de ventas (fecha y motivo, ambos opcionales).
  if (currentVersion === 3) {
    await migrateToV4(db);
    currentVersion = 4;
  }

  // Versión 5: abonos de fiados (tabla payments e índice por cliente).
  if (currentVersion === 4) {
    await migrateToV5(db);
    currentVersion = 5;
  }

  // Versión 6: compras y costos.
  if (currentVersion === 5) {
    await migrateToV6(db);
    currentVersion = 6;
  }

  // Versión 7: pedidos, gastos y grado/grupo de clientes.
  if (currentVersion === 6) {
    await migrateToV7(db);
    currentVersion = 7;
  }

  // Versión 8: cancelar un pedido sin motivo (cancel_reason opcional).
  if (currentVersion === 7) {
    await migrateToV8(db);
    currentVersion = 8;
  }

  // user_version guarda un entero, así que se interpola (valor interno, no del usuario).
  await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
}
