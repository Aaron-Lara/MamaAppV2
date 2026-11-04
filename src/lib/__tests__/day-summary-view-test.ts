import type { DaySummary } from '../../db/day-summary';
import { buildDaySummaryCards, buildDaySummaryView } from '../day-summary-view';

const resumen: DaySummary = {
  date: '2026-11-03',
  activeSalesCount: 3,
  voidedSalesCount: 1,
  cashCents: 10000,
  creditCents: 5000,
  paymentsCents: 2000,
  topProducts: [],
  stockReview: { outCount: 0, lowCount: 0 },
};

describe('buildDaySummaryView', () => {
  test('suma efectivo y fiado como total de ventas', () => {
    const view = buildDaySummaryView(resumen);
    expect(view.salesTotalCents).toBe(15000);
    expect(view.salesCount).toBe(3);
  });

  test('la caja del día es efectivo más abonos cobrados', () => {
    const view = buildDaySummaryView(resumen);
    expect(view.cashInDrawerCents).toBe(12000);
  });

  test('conserva el conteo de anuladas sin sumarlas al dinero', () => {
    const view = buildDaySummaryView({ ...resumen, voidedSalesCount: 4 });
    expect(view.voidedCount).toBe(4);
    expect(view.salesTotalCents).toBe(15000);
    expect(view.cashInDrawerCents).toBe(12000);
  });
});

describe('buildDaySummaryCards', () => {
  test('arma las cinco tarjetas en orden', () => {
    const cards = buildDaySummaryCards(buildDaySummaryView(resumen));
    expect(cards.map((card) => card.key)).toEqual([
      'sales',
      'cash',
      'credit',
      'payments',
      'drawer',
    ]);
    expect(cards.map((card) => card.label)).toEqual([
      'Ventas',
      'Efectivo',
      'Fiado',
      'Abonos cobrados',
      'Dinero en caja del día',
    ]);
  });

  test('formatea los montos y la nota de la caja', () => {
    const cards = buildDaySummaryCards(buildDaySummaryView(resumen));
    expect(cards.map((card) => card.value)).toEqual([
      '$150.00',
      '$100.00',
      '$50.00',
      '$20.00',
      '$120.00',
    ]);
    expect(cards[4].note).toBe('No incluye compras ni gastos');
    expect(cards[0].note).toBe('3 ventas');
  });

  test('escribe una sola venta en singular', () => {
    const cards = buildDaySummaryCards(
      buildDaySummaryView({ ...resumen, activeSalesCount: 1 })
    );
    expect(cards[0].note).toBe('1 venta');
  });

  test('un día sin ventas muestra ceros', () => {
    const cards = buildDaySummaryCards(
      buildDaySummaryView({
        ...resumen,
        activeSalesCount: 0,
        voidedSalesCount: 0,
        cashCents: 0,
        creditCents: 0,
        paymentsCents: 0,
      })
    );
    expect(cards[0].value).toBe('$0.00');
    expect(cards[0].note).toBe('0 ventas');
    expect(cards[4].value).toBe('$0.00');
  });
});
