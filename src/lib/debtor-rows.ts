import { CustomerWithBalance } from '@/db/customers-list';
import type { DebtInput } from '@/db/customer-ledger';
import { calculateDebtAge, DebtAgeStatus } from './debt-age';

export type { DebtInput } from '@/db/customer-ledger';

export type DebtorRow = {
  id: number;
  name: string;
  balanceCents: number;
  daysOld: number | null;
  status: DebtAgeStatus;
  isOverdue: boolean;
  ageText: string;
};

export function buildDebtorRows(
  customers: CustomerWithBalance[],
  debtInputs: DebtInput,
  today: string
): DebtorRow[] {
  return customers.map((c) => {
    const customerSales = debtInputs.sales
      .filter((s) => s.customerId === c.id)
      .map((s) => ({ saleDate: s.saleDate, totalCents: s.totalCents }));
    const customerPayments = debtInputs.payments.find((p) => p.customerId === c.id)?.paidCents ?? 0;

    const age = calculateDebtAge(customerSales, customerPayments, today);

    return {
      id: c.id,
      name: c.name,
      balanceCents: c.balanceCents,
      ...age,
      ageText: formatAgeText(age.daysOld),
    };
  }).sort((a, b) => b.balanceCents - a.balanceCents || a.name.localeCompare(b.name));
}

export function totalOwedCents(customers: CustomerWithBalance[]): number {
  return customers.reduce((sum, c) => sum + (c.balanceCents > 0 ? c.balanceCents : 0), 0);
}

function formatAgeText(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return 'Desde hoy';
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
}
