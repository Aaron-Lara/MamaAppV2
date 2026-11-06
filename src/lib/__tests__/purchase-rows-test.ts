// Pruebas de las filas de la lista de compras y sus totales.

import type { PurchaseListItem } from '@/db/purchases-list';
import {
  buildPurchaseRows,
  formatPurchaseRate,
  purchaseTotalLabel,
} from '../purchase-rows';

const TODAY = '2026-11-04';

function listItem(overrides: Partial<PurchaseListItem> = {}): PurchaseListItem {
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
    ...overrides,
  };
}

describe('buildPurchaseRows', () => {
  test('arma una compra en pesos con tienda y fecha', () => {
    const [row] = buildPurchaseRows([listItem()], TODAY);
    expect(row).toEqual({
      id: 1,
      storeLabel: 'La Central',
      dateLabel: 'Hoy',
      totalLabel: '$120.00',
      itemsLabel: '3 renglones',
      isVoid: false,
      statusLabel: 'Activa',
    });
  });

  test('muestra "Sin tienda" cuando no hay tienda', () => {
    const [row] = buildPurchaseRows([listItem({ store: '   ' })], TODAY);
    expect(row.storeLabel).toBe('Sin tienda');
  });

  test('en dólares muestra el total original y su equivalente en pesos', () => {
    const [row] = buildPurchaseRows(
      [listItem({ currency: 'USD', total_cents: 1000, total_mxn_cents: 17500 })],
      TODAY
    );
    expect(row.totalLabel).toBe('US$10.00 → $175.00');
  });

  test('usa "renglón" en singular', () => {
    const [row] = buildPurchaseRows([listItem({ item_count: 1 })], TODAY);
    expect(row.itemsLabel).toBe('1 renglón');
  });

  test('marca las compras anuladas', () => {
    const [row] = buildPurchaseRows([listItem({ status: 'void' })], TODAY);
    expect(row.isVoid).toBe(true);
    expect(row.statusLabel).toBe('Anulada');
  });

  test('fechas distintas de hoy se muestran escritas', () => {
    const [row] = buildPurchaseRows(
      [listItem({ purchase_date: '2026-11-02' })],
      TODAY
    );
    expect(row.dateLabel).toBe('2 de noviembre');
  });
});

describe('purchaseTotalLabel y formatPurchaseRate', () => {
  test('en pesos usa el total original', () => {
    expect(purchaseTotalLabel('MXN', 1250, 1250)).toBe('$12.50');
  });

  test('el tipo de cambio se muestra con dos decimales', () => {
    expect(formatPurchaseRate(205000)).toBe('20.50');
    expect(formatPurchaseRate(199999)).toBe('20.00');
  });
});
