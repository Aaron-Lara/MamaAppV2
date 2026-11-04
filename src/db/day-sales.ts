// Ventas de un día con sus renglones y el nombre del cliente, cargados en lote.
// Solo lectura; las pantallas no escriben SQL.

import type { SQLiteDatabase } from 'expo-sqlite';

export type DaySaleItem = { quantity: number; description: string };

export type DaySale = {
  id: number;
  createdAt: string;
  totalCents: number;
  paymentMethod: 'cash' | 'credit';
  status: 'active' | 'void';
  voidReason: string | null;
  customerName: string | null;
  items: DaySaleItem[];
};

type SaleRow = {
  id: number;
  created_at: string;
  total_cents: number;
  payment_method: 'cash' | 'credit';
  status: 'active' | 'void';
  void_reason: string | null;
  customer_name: string | null;
};

type ItemRow = { sale_id: number; quantity: number; description: string };

// created_at está en UTC y en ISO, así que el orden alfabético es cronológico.
const SALES_SQL = `
  SELECT s.id, s.created_at, s.total_cents, s.payment_method, s.status,
         s.void_reason, c.name AS customer_name
    FROM sales s
    LEFT JOIN customers c ON c.id = s.customer_id
   WHERE s.sale_date = $date
   ORDER BY s.created_at DESC, s.id DESC
`;

// Una sola consulta para los renglones de todas las ventas del día.
const ITEMS_SQL = `
  SELECT si.sale_id, si.quantity, si.description
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
   WHERE s.sale_date = $date
   ORDER BY si.sale_id ASC, si.id ASC
`;

/** Todas las ventas del día, de la más reciente a la más antigua. */
export async function listDaySales(
  db: SQLiteDatabase,
  date: string
): Promise<DaySale[]> {
  const [sales, itemRows] = await Promise.all([
    db.getAllAsync<SaleRow>(SALES_SQL, { $date: date }),
    db.getAllAsync<ItemRow>(ITEMS_SQL, { $date: date }),
  ]);

  const itemsBySale = new Map<number, DaySaleItem[]>();
  for (const row of itemRows) {
    const items = itemsBySale.get(row.sale_id) ?? [];
    items.push({ quantity: row.quantity, description: row.description });
    itemsBySale.set(row.sale_id, items);
  }

  return sales.map((sale) => ({
    id: sale.id,
    createdAt: sale.created_at,
    totalCents: sale.total_cents,
    paymentMethod: sale.payment_method,
    status: sale.status,
    voidReason: sale.void_reason,
    customerName: sale.customer_name,
    items: itemsBySale.get(sale.id) ?? [],
  }));
}
