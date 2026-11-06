// Pruebas de los renglones y el encabezado del detalle de una compra.

import type { PurchaseDetail, PurchaseDetailLine } from '@/db/purchases-get';
import {
  buildPurchaseDetailHeader,
  buildPurchaseDetailRows,
} from '../purchase-rows';

const TODAY = '2026-11-04';

function detailLine(overrides: Partial<PurchaseDetailLine> = {}): PurchaseDetailLine {
  return {
    id: 10,
    product_id: null,
    product_name: null,
    description: 'Caja de galletas',
    units: 24,
    cost_cents: 12000,
    cost_mxn_cents: 12000,
    ...overrides,
  };
}

function detail(overrides: Partial<PurchaseDetail> = {}): PurchaseDetail {
  return {
    id: 1,
    purchase_date: TODAY,
    store: 'La Central',
    currency: 'MXN',
    exchange_rate_x10000: 10000,
    total_cents: 12000,
    total_mxn_cents: 12000,
    status: 'active',
    item_count: 3,
    created_at: '2026-11-04T12:00:00.000Z',
    voided_at: null,
    void_reason: null,
    lines: [detailLine()],
    ...overrides,
  };
}

describe('buildPurchaseDetailRows', () => {
  test('muestra unidades, costo y costo por unidad en pesos', () => {
    const [row] = buildPurchaseDetailRows([detailLine()], 'MXN');
    expect(row.title).toBe('Caja de galletas');
    expect(row.unitsLabel).toBe('24 unidades');
    expect(row.costLabel).toBe('$120.00');
    expect(row.costMxnLabel).toBe('$120.00');
    expect(row.unitCostLabel).toBe('$5.00');
  });

  test('en dólares conserva el costo original y el de pesos', () => {
    const [row] = buildPurchaseDetailRows(
      [detailLine({ cost_cents: 1000, cost_mxn_cents: 17500, units: 1 })],
      'USD'
    );
    expect(row.costLabel).toBe('US$10.00');
    expect(row.costMxnLabel).toBe('$175.00');
    expect(row.unitsLabel).toBe('1 unidad');
    expect(row.unitCostLabel).toBe('$175.00');
  });

  test('usa el nombre del producto si no hay descripción', () => {
    const [row] = buildPurchaseDetailRows(
      [detailLine({ description: '  ', product_name: 'Coca de 600 ml' })],
      'MXN'
    );
    expect(row.title).toBe('Coca de 600 ml');
  });

  test('usa "Sin descripción" cuando no hay ninguno de los dos', () => {
    const [row] = buildPurchaseDetailRows(
      [detailLine({ description: '', product_name: null })],
      'MXN'
    );
    expect(row.title).toBe('Sin descripción');
  });
});

describe('buildPurchaseDetailHeader', () => {
  test('arma encabezado en pesos sin tipo de cambio', () => {
    const header = buildPurchaseDetailHeader(detail(), TODAY);
    expect(header.storeLabel).toBe('La Central');
    expect(header.dateLabel).toBe('Hoy');
    expect(header.currencyLabel).toBe('MXN');
    expect(header.exchangeRateLabel).toBeNull();
    expect(header.totalLabel).toBe('$120.00');
    expect(header.totalMxnLabel).toBe('$120.00');
    expect(header.itemsLabel).toBe('3 renglones');
    expect(header.isVoid).toBe(false);
  });

  test('en dólares incluye el tipo de cambio y el total convertido', () => {
    const header = buildPurchaseDetailHeader(
      detail({
        currency: 'USD',
        exchange_rate_x10000: 205000,
        total_cents: 1000,
        total_mxn_cents: 20500,
      }),
      TODAY
    );
    expect(header.currencyLabel).toBe('USD');
    expect(header.exchangeRateLabel).toBe('20.50');
    expect(header.totalLabel).toBe('US$10.00 → $205.00');
    expect(header.totalMxnLabel).toBe('$205.00');
  });

  test('una compra anulada muestra el motivo', () => {
    const header = buildPurchaseDetailHeader(
      detail({ status: 'void', void_reason: 'Compra registrada por error.' }),
      TODAY
    );
    expect(header.isVoid).toBe(true);
    expect(header.voidReasonLabel).toBe('Compra registrada por error.');
  });
});
