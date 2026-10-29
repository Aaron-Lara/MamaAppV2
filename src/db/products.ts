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
  /** Si es true, las ventas descuentan inventario. */
  trackStock?: boolean;
  minStock?: number;
};

/** Valida el producto antes de escribir nada en la base. */
function validateProduct(input: NewProduct): { name: string; minStock: number } {
  const name = input.name.trim();
  if (!name) {
    throw new Error('El producto necesita un nombre.');
  }
  if (!Number.isSafeInteger(input.priceCents) || input.priceCents < 0) {
    throw new Error('El precio del producto no es válido.');
  }
  const minStock = input.minStock ?? 0;
  if (!Number.isSafeInteger(minStock) || minStock < 0) {
    throw new Error('El stock mínimo no puede ser negativo.');
  }
  return { name, minStock };
}

/** Inserta un producto y devuelve su id. */
export async function insertProduct(db: SQLiteDatabase, input: NewProduct): Promise<number> {
  const { name, minStock } = validateProduct(input);
  const result = await db.runAsync(
    `INSERT INTO products (name, price_cents, category, track_stock, min_stock)
     VALUES ($name, $priceCents, $category, $trackStock, $minStock)`,
    {
      $name: name,
      $priceCents: input.priceCents,
      $category: input.category ?? null,
      $trackStock: input.trackStock ? 1 : 0,
      $minStock: minStock,
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

/** Busca un producto por nombre exacto (el más nuevo si hubiera varios). */
export async function findProductByName(
  db: SQLiteDatabase,
  name: string
): Promise<Product | null> {
  return db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE name = $name ORDER BY id DESC LIMIT 1',
    { $name: name.trim() }
  );
}

/** Devuelve el producto con ese nombre o lo crea con inventario activo. */
export async function ensureTrackedProduct(
  db: SQLiteDatabase,
  input: { name: string; priceCents: number; minStock: number }
): Promise<{ id: number; created: boolean }> {
  const existing = await findProductByName(db, input.name);
  if (existing) {
    return { id: existing.id, created: false };
  }
  const id = await insertProduct(db, { ...input, trackStock: true });
  return { id, created: true };
}

/** Cuenta los productos registrados (se usa para numerar los TEST). */
export async function countProducts(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM products');
  return row?.total ?? 0;
}
