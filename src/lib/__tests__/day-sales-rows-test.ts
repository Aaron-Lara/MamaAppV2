import type { DaySale } from '../../db/day-sales';
import { buildDaySaleRows } from '../day-sales-rows';

// Desfase fijo de México (UTC-6) para no depender de la zona del equipo.
const OFFSET = -360;

const ventas: DaySale[] = [
  {
    id: 3,
    createdAt: '2026-11-03T23:05:00.000Z',
    totalCents: 4500,
    paymentMethod: 'cash',
    status: 'active',
    voidReason: null,
    customerName: 'Ana',
    items: [
      { quantity: 2, description: 'Coca Cola' },
      { quantity: 1, description: 'Lonche' },
    ],
  },
  {
    id: 2,
    createdAt: '2026-11-03T18:30:00.000Z',
    totalCents: 12000,
    paymentMethod: 'credit',
    status: 'void',
    voidReason: 'Anulada desde el Resumen.',
    customerName: 'Luis',
    items: [{ quantity: 1, description: 'Pan' }],
  },
  {
    id: 1,
    createdAt: '2026-11-03T15:00:00.000Z',
    totalCents: 3000,
    paymentMethod: 'credit',
    status: 'active',
    voidReason: null,
    customerName: 'Luis',
    items: [],
  },
];

describe('buildDaySaleRows', () => {
  test('conserva el orden recibido, de la más reciente a la más antigua', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows.map((row) => row.id)).toEqual([3, 2, 1]);
  });

  test('arma hora local, total y forma de pago', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows[0].timeLabel).toBe('17:05');
    expect(rows[0].totalLabel).toBe('$45.00');
    expect(rows[0].paymentLabel).toBe('Efectivo');
    expect(rows[2].timeLabel).toBe('09:00');
    expect(rows[2].paymentLabel).toBe('Fiado');
  });

  test('resume los renglones con formatSaleItemsText', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows[0].itemsText).toBe('2 x Coca Cola, 1 x Lonche');
    expect(rows[1].itemsText).toBe('1 x Pan');
  });

  test('una venta sin renglones deja el resumen vacío', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows[2].itemsText).toBe('');
  });

  test('el cliente solo aparece cuando la venta fue fiada', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows[0].customerLabel).toBeNull();
    expect(rows[1].customerLabel).toBe('Luis');
    expect(rows[2].customerLabel).toBe('Luis');
  });

  test('marca la anulada y conserva su motivo', () => {
    const rows = buildDaySaleRows(ventas, OFFSET);
    expect(rows[0].isVoid).toBe(false);
    expect(rows[1].isVoid).toBe(true);
    expect(rows[1].voidReason).toBe('Anulada desde el Resumen.');
    expect(rows[2].voidReason).toBeNull();
  });
});
