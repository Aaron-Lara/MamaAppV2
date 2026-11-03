import type { CustomerWithBalance } from '../../db/customers-list';
import {
  buildDebtorRows,
  toCustomerWithBalance,
  totalOwedCents,
} from '../debtor-rows';

describe('buildDebtorRows', () => {
  const clientes: CustomerWithBalance[] = [
    { id: 1, name: 'B', balanceCents: 100 },
    { id: 2, name: 'A', balanceCents: 200 },
    { id: 3, name: 'C', balanceCents: 0 },
  ];

  const deudas = {
    sales: [
      { customerId: 1, saleDate: '2026-01-01', totalCents: 100 },
      { customerId: 2, saleDate: '2026-01-02', totalCents: 200 },
    ],
    payments: [],
  };

  test('ordena por saldo y calcula la antigüedad', () => {
    const rows = buildDebtorRows(clientes, deudas, '2026-01-05');

    // A debe 200, B debe 100 y C no debe nada.
    expect(rows.map((row) => row.id)).toEqual([2, 1, 3]);
    expect(rows[0].ageText).toBe('hace 3 días');
    expect(rows[1].ageText).toBe('hace 4 días');
    expect(rows[2].ageText).toBe('');
  });

  test('convierte deudores y calcula la antigüedad del filtro Con deuda', () => {
    // listDebtors devuelve customerId; si se usa tal cual, id queda undefined
    // y buildDebtorRows no encuentra las ventas ni calcula la antigüedad.
    const deudores = [{ customerId: 10, name: 'Ana', balanceCents: 100 }];
    const clientesConDeuda = deudores.map(toCustomerWithBalance);

    const rows = buildDebtorRows(
      clientesConDeuda,
      {
        sales: [{ customerId: 10, saleDate: '2026-01-01', totalCents: 100 }],
        payments: [],
      },
      '2026-01-10'
    );

    expect(rows[0]).toMatchObject({
      id: 10,
      name: 'Ana',
      balanceCents: 100,
      daysOld: 9,
      status: 'warning',
      isOverdue: true,
      ageText: 'hace 9 días',
    });
  });
});

describe('totalOwedCents', () => {
  test('suma solo los saldos que se deben', () => {
    const clientes: CustomerWithBalance[] = [
      { id: 1, name: 'Ana', balanceCents: 250 },
      { id: 2, name: 'Luis', balanceCents: 50 },
      { id: 3, name: 'Eva', balanceCents: 0 },
      { id: 4, name: 'Saldo a favor', balanceCents: -30 },
    ];

    expect(totalOwedCents(clientes)).toBe(300);
  });
});
