// Pruebas del cierre del día: ventas, caja, top, stock y encabezado.
// Solo lógica pura: no se usa la base de datos.

import type { DaySummary } from '../../db/day-summary';
import { buildDayClosing, buildDayClosingHeadline } from '../day-closing';
import type { DayClosing } from '../day-closing-types';

const resumen: DaySummary = {
  date: '2026-11-03',
  activeSalesCount: 3,
  voidedSalesCount: 1,
  cashCents: 10000,
  creditCents: 5000,
  paymentsCents: 2000,
  topProducts: [
    { productId: 1, name: 'Coca-Cola 600 ml', units: 14 },
    { productId: 2, name: 'Sabritas Original', units: 1 },
  ],
  stockReview: { outCount: 1, lowCount: 2 },
};

function build(overrides: Partial<DaySummary> = {}): DayClosing {
  return buildDayClosing({
    label: 'Hoy',
    summary: { ...resumen, ...overrides },
    profit: null,
  });
}

function section(closing: DayClosing, key: string) {
  const found = closing.sections.find((item) => item.key === key);
  if (!found) {
    throw new Error(`Falta la sección ${key}`);
  }
  return found;
}

function line(closing: DayClosing, sectionKey: string, lineKey: string) {
  const found = section(closing, sectionKey).lines.find((item) => item.key === lineKey);
  if (!found) {
    throw new Error(`Falta el renglón ${lineKey}`);
  }
  return found;
}

describe('buildDayClosingHeadline', () => {
  test('nombra hoy, ayer y una fecha escrita', () => {
    expect(buildDayClosingHeadline('Hoy')).toBe('Cierre de hoy');
    expect(buildDayClosingHeadline('Ayer')).toBe('Cierre de ayer');
    expect(buildDayClosingHeadline('3 de noviembre')).toBe('Cierre del 3 de noviembre');
  });

  test('usa un encabezado neutro si la fecha no es válida', () => {
    expect(buildDayClosingHeadline('Fecha inválida')).toBe('Cierre del día');
    expect(buildDayClosingHeadline('   ')).toBe('Cierre del día');
  });
});

describe('fecha del cierre', () => {
  test('escribe la fecha completa del día', () => {
    expect(build().dateLabel).toBe('3 de noviembre de 2026');
  });

  test('una fecha inválida no muestra fecha', () => {
    expect(build({ date: '2026-02-30' }).dateLabel).toBeNull();
  });
});

describe('ventas y caja del cierre', () => {
  test('suma efectivo y fiado y muestra el conteo de ventas', () => {
    const closing = build();
    expect(line(closing, 'sales', 'sales-total').value).toBe('$150.00');
    expect(line(closing, 'sales', 'sales-total').note).toBe('3 ventas');
    expect(line(closing, 'sales', 'sales-cash').value).toBe('$100.00');
    expect(line(closing, 'sales', 'sales-credit').value).toBe('$50.00');
  });

  test('la caja del día suma abonos y no incluye fiado', () => {
    const closing = build();
    expect(line(closing, 'cash', 'cash-payments').value).toBe('$20.00');
    expect(line(closing, 'cash', 'cash-drawer').value).toBe('$120.00');
    expect(line(closing, 'cash', 'cash-drawer').note).toBe('No incluye compras ni gastos');
  });

  test('las ventas anuladas solo se cuentan y no inflan los totales', () => {
    const una = build();
    const varias = build({ voidedSalesCount: 9 });

    expect(line(una, 'sales', 'sales-void').value).toBe('1 venta');
    expect(line(varias, 'sales', 'sales-void').value).toBe('9 ventas');
    expect(line(varias, 'sales', 'sales-total').value).toBe('$150.00');
    expect(line(varias, 'sales', 'sales-total').value).toBe(
      line(una, 'sales', 'sales-total').value
    );
  });

  test('sin anuladas lo dice de forma explícita', () => {
    const closing = build({ voidedSalesCount: 0 });
    expect(line(closing, 'sales', 'sales-void').value).toBe('Ninguna');
  });
});

describe('top de productos y stock', () => {
  test('lista los más vendidos con singular y plural', () => {
    const closing = build();
    expect(line(closing, 'top', 'top-1').label).toBe('Coca-Cola 600 ml');
    expect(line(closing, 'top', 'top-1').value).toBe('14 unidades');
    expect(line(closing, 'top', 'top-2').value).toBe('1 unidad');
  });

  test('sin ventas no inventa productos', () => {
    const closing = build({ topProducts: [] });
    expect(line(closing, 'top', 'top-empty').value).toBe('Ninguno');
  });

  test('distingue agotados de por agotarse', () => {
    const closing = build();
    expect(line(closing, 'stock', 'stock-out').value).toBe('1 producto');
    expect(line(closing, 'stock', 'stock-low').value).toBe('2 productos');
  });

  test('aclara que el inventario es el actual y no el del día consultado', () => {
    const closing = build();
    expect(section(closing, 'stock').title).toBe('Inventario actual (hoy)');
  });

  test('sin pendientes muestra todo en orden', () => {
    const closing = build({ stockReview: { outCount: 0, lowCount: 0 } });
    expect(line(closing, 'stock', 'stock-ok').value).toBe('Todo en orden');
  });
});

describe('actividad y advertencias generales', () => {
  test('un día en ceros no tiene actividad', () => {
    const closing = build({
      activeSalesCount: 0,
      voidedSalesCount: 0,
      cashCents: 0,
      creditCents: 0,
      paymentsCents: 0,
      topProducts: [],
      stockReview: { outCount: 0, lowCount: 0 },
    });
    expect(closing.hasActivity).toBe(false);
  });

  test('avisa cuando todas las ventas están anuladas', () => {
    const closing = build({ activeSalesCount: 0, cashCents: 0, creditCents: 0 });
    expect(closing.warnings).toContain('Todas las ventas del día están anuladas.');
  });
});
