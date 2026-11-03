// Lectura de un cliente por id. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

export type CustomerSummary = {
  id: number;
  name: string;
};

/** Devuelve el cliente o null si el id no es válido o no existe. */
export async function getCustomer(
  db: SQLiteDatabase,
  customerId: number
): Promise<CustomerSummary | null> {
  if (!Number.isSafeInteger(customerId) || customerId <= 0) {
    return null;
  }
  const row = await db.getFirstAsync<CustomerSummary>(
    'SELECT id, name FROM customers WHERE id = $id',
    { $id: customerId }
  );
  return row ?? null;
}
