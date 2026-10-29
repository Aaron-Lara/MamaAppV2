// Acceso a la tabla customers. Las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

export type Customer = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

/** Inserta un cliente y devuelve su id. */
export async function insertCustomer(db: SQLiteDatabase, name: string): Promise<number> {
  const result = await db.runAsync('INSERT INTO customers (name) VALUES ($name)', { $name: name });
  return result.lastInsertRowId;
}

/** Busca un cliente por nombre exacto (el más nuevo si hubiera varios). */
export async function findCustomerByName(
  db: SQLiteDatabase,
  name: string
): Promise<Customer | null> {
  return db.getFirstAsync<Customer>(
    'SELECT * FROM customers WHERE name = $name ORDER BY id DESC LIMIT 1',
    { $name: name }
  );
}

/** Devuelve el cliente con ese nombre o lo crea si no existe (sin duplicados). */
export async function ensureCustomer(
  db: SQLiteDatabase,
  name: string
): Promise<{ id: number; created: boolean }> {
  const existing = await findCustomerByName(db, name);
  if (existing) {
    return { id: existing.id, created: false };
  }
  return { id: await insertCustomer(db, name), created: true };
}
