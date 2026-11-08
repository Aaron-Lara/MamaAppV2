// Pruebas del encabezado y los renglones del detalle de un pedido.

import {
  buildOrderDetailHeader,
  buildOrderDetailLines,
} from '../order-detail-view';
import type {
  OrderDetail,
  OrderDetailItem,
} from '../order-types';

const TODAY = '2026-11-06';

function line(overrides: Partial<OrderDetailItem> = {}): OrderDetailItem {
  return {
    id: 1,
    productId: 5,
    productName: 'Pan dulce',
    description: 'Pan dulce',
    quantity: 2,
    unitPriceCents: 1250,
    lineTotalCents: 2500,
    ...overrides,
  };
}

function detail(overrides: Partial<OrderDetail> = {}): OrderDetail {
  return {
    id: 7,
    customerId: 2,
    customerName: 'Ana',
    orderDate: '2026-11-05',
    dueDate: null,
    status: 'pending',
    deliveredAt: null,
    deliveredSaleId: null,
    cancelledAt: null,
    cancelReason: null,
    itemCount: 1,
    totalCents: 2500,
    isOverdue: false,
    notes: null,
    createdAt: '2026-11-05T10:00:00',
    saleStatus: null,
    items: [line()],
    ...overrides,
  };
}

describe('buildOrderDetailHeader', () => {
  test('un pendiente se puede entregar y cancelar', () => {
    const header = buildOrderDetailHeader(
      detail({ dueDate: '2026-11-08', notes: '  sin azúcar  ' }),
      TODAY
    );
    expect(header.status).toBe('pending');
    expect(header.statusLabel).toBe('Pendiente');
    expect(header.orderDateLabel).toBe('Ayer');
    expect(header.dueDateLabel).toBe('8 de noviembre');
    expect(header.notes).toBe('sin azúcar');
    expect(header.itemsLabel).toBe('1 producto');
    expect(header.totalLabel).toBe('$25.00');
    expect(header.canDeliver).toBe(true);
    expect(header.canCancel).toBe(true);
  });

  test('un atrasado conserva las acciones y cambia su estado visual', () => {
    const header = buildOrderDetailHeader(
      detail({ dueDate: '2026-11-04', isOverdue: true }),
      TODAY
    );
    expect(header.status).toBe('overdue');
    expect(header.statusLabel).toBe('Atrasado');
    expect(header.canDeliver).toBe(true);
  });

  test('un entregado ya no muestra acciones', () => {
    const header = buildOrderDetailHeader(
      detail({ status: 'delivered', deliveredAt: '2026-11-05' }),
      TODAY
    );
    expect(header.statusLabel).toBe('Entregado');
    expect(header.deliveredAtLabel).toBe('Ayer');
    expect(header.canDeliver).toBe(false);
    expect(header.canCancel).toBe(false);
  });

  test('un cancelado muestra la fecha y avisa si la venta se anuló', () => {
    const header = buildOrderDetailHeader(
      detail({
        status: 'cancelled',
        cancelledAt: '2026-11-06',
        saleStatus: 'void',
      }),
      TODAY
    );
    expect(header.statusLabel).toBe('Cancelado');
    expect(header.cancelledAtLabel).toBe('Hoy');
    expect(header.saleVoided).toBe(true);
    expect(header.canDeliver).toBe(false);
  });
});

describe('buildOrderDetailLines', () => {
  test('muestra cantidad, precio unitario y total', () => {
    const [row] = buildOrderDetailLines([line()]);
    expect(row).toEqual({
      id: 1,
      title: 'Pan dulce',
      productLabel: null,
      quantityLabel: '2 unidades',
      unitPriceLabel: '$12.50',
      lineTotalLabel: '$25.00',
    });
  });

  test('separa la descripción del nombre del producto y usa singular', () => {
    const [row] = buildOrderDetailLines([
      line({ description: 'Con chispas', quantity: 1, unitPriceCents: 500 }),
    ]);
    expect(row.title).toBe('Con chispas');
    expect(row.productLabel).toBe('Pan dulce');
    expect(row.quantityLabel).toBe('1 unidad');
    expect(row.unitPriceLabel).toBe('$5.00');
  });
});
