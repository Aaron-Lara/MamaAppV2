import { buildDebtorRows, totalOwedCents } from '../debtor-rows';
import { CustomerWithBalance } from '../../db/customers-list';

describe('debtor-rows', () => {
  const mockCustomers: CustomerWithBalance[] = [
    { id: 1, name: 'B', balanceCents: 100 },
    { id: 2, name: 'A', balanceCents: 200 },
    { id: 3, name: 'C', balanceCents: 0 },
  ];

  const mockDebtInputs = {
    sales: [
      { customerId: 1, saleDate: '2026-01-01', totalCents: 100 },
      { customerId: 2, saleDate: '2026-01-02', totalCents: 200 },
    ],
    payments: [],
  };

  it('builds rows with correct sorting and age text', () => {
    const rows = buildDebtorRows(mockCustomers, mockDebtInputs, '2026-01-05');
    
    // Sort: B (200), A (100) -> Wait, B has 100, A has 200. A should be first.
    // B: 100, A: 200. My sorting logic: `b.balanceCents - a.balanceCents`.
    // Wait, mockCustomers: A is id: 2, balance 200. B is id: 1, balance 100.
    // Correct order: 2, 1, 3.
    expect(rows[0].id).toBe(2);
    expect(rows[1].id).toBe(1);
    expect(rows[2].id).toBe(3);
    
    expect(rows[0].ageText).toBe('hace 3 días');
    expect(rows[2].ageText).toBe('');
  });

  it('calculates total owed', () => {
    expect(totalOwedCents(mockCustomers)).toBe(300);
  });
});
