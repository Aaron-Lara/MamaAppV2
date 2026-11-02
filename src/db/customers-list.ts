// Clientes con su saldo. La fórmula del saldo vive solo en balances.ts:
// aquí se reusa listDebtors y los que no deben nada quedan en 0.

import type { SQLiteDatabase } from 'expo-sqlite';

import { listDebtors } from '@/db/balances';
import { customerNameKey } from '@/lib/customer-input';

export type CustomerWithBalance = {
  id: number;
  name: string;
  balanceCents: number;
};

type CustomerRow = { id: number; name: string };

function byName(a: CustomerWithBalance, b: CustomerWithBalance): number {
  const first = customerNameKey(a.name);
  const second = customerNameKey(b.name);
  if (first < second) return -1;
  if (first > second) return 1;
  return a.id - b.id;
}

/**
 * Todos los clientes con lo que deben (0 si no deben nada), en orden alfabético
 * sin distinguir acentos ni mayúsculas. Los saldos a favor se muestran como 0.
 */
export async function listCustomersWithBalance(
  db: SQLiteDatabase
): Promise<CustomerWithBalance[]> {
  const [customers, debtors] = await Promise.all([
    db.getAllAsync<CustomerRow>('SELECT id, name FROM customers'),
    listDebtors(db),
  ]);
  const owed = new Map(debtors.map((debtor) => [debtor.customerId, debtor.balanceCents]));
  return customers
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      balanceCents: owed.get(customer.id) ?? 0,
    }))
    .sort(byName);
}
