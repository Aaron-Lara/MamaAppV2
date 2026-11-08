// Pruebas de las filas, filtros y conteos de la lista de pedidos.

import {
  buildOrderListRows,
  countOrderListRows,
  filterOrderListRows,
} from '../order-list-view';
import type { OrderSummary } from '../order-types';

const TODAY = '2026-11-06';

function summary(overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id: 1,
    customerId: 1,
    customerName: 'Ana',
    orderDate: TODAY,
    dueDate: null,
    status: 'pending',
    deliveredAt: null,
    deliveredSaleId: null,
    cancelledAt: null,
    cancelReason: null,
    itemCount: 1,
    totalCents: 1500,
    isOverdue: false,
    ...overrides,
  };
}

describe('buildOrderListRows', () => {
  test('arma un pedido pendiente con fecha, total y estado', () => {
    const [row] = buildOrderListRows([summary()], TODAY);
    expect(row).toEqual({
      id: 1,
      customerName: 'Ana',
      orderDateLabel: 'Hoy',
      dueDateLabel: null,
      totalLabel: '$15.00',
      itemsLabel: '1 producto',
      status: 'pending',
      statusLabel: 'Pendiente',
      isOverdue: false,
    });
  });

  test('marca el atraso y muestra la fecha de entrega vencida', () => {
    const [row] = buildOrderListRows(
      [summary({ dueDate: '2026-11-04', isOverdue: true })],
      TODAY
    );
    expect(row.status).toBe('overdue');
    expect(row.statusLabel).toBe('Atrasado');
    expect(row.dueDateLabel).toBe('Venció: 4 de noviembre');
  });

  test('distingue entregados y cancelados', () => {
    const rows = buildOrderListRows(
      [
        summary({ id: 1, status: 'delivered', deliveredAt: '2026-11-05' }),
        summary({ id: 2, status: 'cancelled', cancelReason: 'Ya no lo quiere' }),
      ],
      TODAY
    );
    expect(rows[0].statusLabel).toBe('Entregado');
    expect(rows[1].statusLabel).toBe('Cancelado');
  });

  test('usa el plural de productos y la fecha escrita', () => {
    const [row] = buildOrderListRows(
      [summary({ itemCount: 3, orderDate: '2026-11-02' })],
      TODAY
    );
    expect(row.itemsLabel).toBe('3 productos');
    expect(row.orderDateLabel).toBe('2 de noviembre');
  });
});

describe('filterOrderListRows y countOrderListRows', () => {
  const rows = buildOrderListRows(
    [
      summary({ id: 1, customerName: 'Ana' }),
      summary({ id: 2, customerName: 'Beto', dueDate: '2026-11-05', isOverdue: true }),
      summary({ id: 3, customerName: 'Carla', status: 'delivered' }),
      summary({ id: 4, customerName: 'Dora', status: 'cancelled' }),
    ],
    TODAY
  );

  test('cuenta todos los estados y el atraso', () => {
    expect(countOrderListRows(rows)).toEqual({
      all: 4,
      pending: 2,
      overdue: 1,
      delivered: 1,
      cancelled: 1,
    });
  });

  test('el filtro pendientes incluye a los atrasados', () => {
    expect(filterOrderListRows(rows, 'pending', '').map((row) => row.id)).toEqual([1, 2]);
    expect(filterOrderListRows(rows, 'overdue', '').map((row) => row.id)).toEqual([2]);
    expect(filterOrderListRows(rows, 'delivered', '').map((row) => row.id)).toEqual([3]);
    expect(filterOrderListRows(rows, 'cancelled', '').map((row) => row.id)).toEqual([4]);
  });

  test('busca por cliente sin distinguir mayúsculas ni acentos', () => {
    expect(filterOrderListRows(rows, 'all', 'carla').map((row) => row.id)).toEqual([3]);
    expect(filterOrderListRows(rows, 'all', 'beto').map((row) => row.id)).toEqual([2]);
  });
});
