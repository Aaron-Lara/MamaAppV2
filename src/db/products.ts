// Acceso a la tabla products. Las pantallas no escriben SQL.
// El dinero se guarda siempre en centavos (enteros).

import type { SQLiteDatabase } from 'expo-sqlite';

export type Product = {
  id: number;
  name: string;
  price_cents: number;
  category: string | null;
  track_stock: number;
  min_stock: number;
  active: number;
  created_at: string;
};

export type NewProduct = {
  name: string;
  priceCents: number;
  category?: string | null;
};

/** Inserta un producto y devuelve su id. */
export async function insertProduct(db: SQLiteDatabase, input: NewProduct): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO products (name, price_cents, category) VALUES ($name, $priceCents, $category)',
    {
      $name: input.name,
      $priceCents: input.priceCents,
      $category: input.category ?? null,
    }
  );
  return result.lastInsertRowId;
}

/** Lee todos los productos, del más nuevo al más viejo. */
export async function listProducts(
  db: SQLiteDatabase,
  options: { onlyActive?: boolean } = {}
): Promise<Product[]> {
  const where = options.onlyActive ? 'WHERE active = 1' : '';
  return db.getAllAsync<Product>(`SELECT * FROM products ${where} ORDER BY id DESC`);
}

/** Devuelve un producto o null si no existe. */
export async function getProductById(db: SQLiteDatabase, id: number): Promise<Product | null> {
  return db.getFirstAsync<Product>('SELECT * FROM products WHERE id = $id', { $id: id });
}

/** Cuenta los productos registrados (se usa para numerar los TEST). */
export async function countProducts(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM products');
  return row?.total ?? 0;
}
