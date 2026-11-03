// Crear cliente sin duplicados. La comparación de nombres es tolerante
// (mayúsculas, acentos y espacios) y corre dentro de una transacción exclusiva.

import type { SQLiteDatabase } from 'expo-sqlite';

import { DUPLICATE_CUSTOMER_MESSAGE } from '@/lib/customer-messages';
import { hasDuplicateCustomerName, validateCustomerName } from '@/lib/customer-input';

// Se reexporta para conservar el nombre público que ya usaban otros módulos.
export { DUPLICATE_CUSTOMER_MESSAGE };

type NameRow = { name: string };

/**
 * Crea el cliente y devuelve su id.
 * Lee todos los nombres dentro de la transacción exclusiva: así dos altas
 * simultáneas no pueden pasar las dos la revisión de duplicados.
 */
export async function createCustomer(db: SQLiteDatabase, name: string): Promise<number> {
  const clean = validateCustomerName(name);
  let newId = 0;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const rows = await txn.getAllAsync<NameRow>('SELECT name FROM customers');
    if (hasDuplicateCustomerName(clean, rows.map((row) => row.name))) {
      throw new Error(DUPLICATE_CUSTOMER_MESSAGE);
    }
    const result = await txn.runAsync('INSERT INTO customers (name) VALUES ($name)', {
      $name: clean,
    });
    newId = result.lastInsertRowId;
  });

  return newId;
}
