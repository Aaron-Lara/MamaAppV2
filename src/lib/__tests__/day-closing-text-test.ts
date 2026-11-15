// Pruebas del texto plano que se comparte. Verifica que no se pierdan ni se
// inventen cifras al convertir el cierre en mensaje.

import type { DaySummary } from '../../db/day-summary';
import { buildDayClosing } from '../day-closing';
import { buildDayClosingText } from '../day-closing-text';
import type { NetProfitEstimate } from '../profit-estimate';

const resumen: DaySummary = {
  date: '2026-11-03',
  activeSalesCount: 3,
  voidedSalesCount: 0,
  cashCents: 10000,
  creditCents: 5000,
  paymentsCents: 2000,
  topProducts: [
    { productId: 1, name: 'Coca-Cola 600 ml', units: 14 },
    { productId: 2, name: 'Sabritas Original', units: 1 },
  ],
  stockReview: { outCount: 1, lowCount: 2 },
};

function profit(overrides: Partial<NetProfitEstimate> = {}): NetProfitEstimate {
  return {
    profitCents: 800,
    isLoss: false,
    costOfGoodsCents: 200,
    costedRevenueCents: 1000,
    uncostedRevenueCents: 0,
    uncostedProductCount: 0,
    hasSales: true,
    hasKnownCosts: true,
    expensesCents: 300,
    expensesCount: 2,
    netProfitCents: 500,
    isNetLoss: false,
    hasKnownNet: true,
    ...overrides,
  };
}

function texto(datos: NetProfitEstimate = profit()): string {
  return buildDayClosingText(
    buildDayClosing({ label: 'Hoy', summary: resumen, profit: datos })
  );
}

describe('buildDayClosingText', () => {
  test('empieza con el encabezado y conserva las secciones', () => {
    const mensaje = texto();
    expect(mensaje.startsWith('Cierre de hoy')).toBe(true);
    expect(mensaje).toContain('Ventas\nVentas del día: $150.00 (3 ventas)');
    expect(mensaje).toContain('Efectivo: $100.00');
    expect(mensaje).toContain('Fiado: $50.00');
    expect(mensaje).toContain('Caja y abonos');
    expect(mensaje).toContain(
      'Dinero en caja del día: $120.00 (No incluye compras ni gastos)'
    );
  });

  test('incluye ganancia, top y stock con sus notas', () => {
    const mensaje = texto();
    expect(mensaje).toContain(
      'Ganancia neta estimada: $5.00 (Estimación con el último costo conocido)'
    );
    expect(mensaje).toContain('Coca-Cola 600 ml: 14 unidades');
    expect(mensaje).toContain('Sabritas Original: 1 unidad');
    expect(mensaje).toContain('Agotados: 1 producto');
    expect(mensaje).toContain('Por agotarse: 2 productos');
  });

  test('agrega las advertencias al final bajo Notas', () => {
    const mensaje = texto(
      profit({ uncostedRevenueCents: 600, uncostedProductCount: 1 })
    );
    expect(mensaje).toContain('\n\nNotas\n');
    expect(mensaje).toContain('• $6.00 de ventas sin costo conocido quedan fuera de la ganancia.');
    expect(mensaje).toContain('• 1 producto sin costo conocido. Regístralo en Compras.');
  });

  test('no agrega Notas cuando no hay advertencias', () => {
    expect(texto()).not.toContain('\n\nNotas\n');
  });

  test('incluye la fecha completa junto al encabezado', () => {
    expect(texto()).toContain('Cierre de hoy\nFecha: 3 de noviembre de 2026');
  });

  test('omite la fecha si el día no es válido', () => {
    const mensaje = buildDayClosingText(
      buildDayClosing({
        label: '3 de noviembre',
        summary: { ...resumen, date: 'no-es-fecha' },
        profit: profit(),
      })
    );
    expect(mensaje.startsWith('Cierre del 3 de noviembre\n')).toBe(true);
    expect(mensaje).not.toContain('Fecha:');
  });

  test('aclara que el inventario compartido es el actual', () => {
    expect(texto()).toContain('Inventario actual (hoy)');
  });

  test('explica el error de ganancia y no la muestra en cero', () => {
    const mensaje = buildDayClosingText(
      buildDayClosing({
        label: 'Hoy',
        summary: resumen,
        profit: null,
        profitFailed: true,
      })
    );
    expect(mensaje).toContain('Ganancia estimada: No se pudo calcular la ganancia');
    expect(mensaje).toContain('\n\nNotas\n');
    expect(mensaje).toContain(
      '• No se pudo calcular la ganancia. El cierre no incluye ganancia ni gastos.'
    );
    expect(mensaje).not.toContain('Ganancia estimada: $0.00');
  });

  test('separa los bloques con una línea en blanco', () => {
    const mensaje = texto();
    expect(mensaje).toContain('\n\nVentas\n');
    expect(mensaje).toContain('\n\nCaja y abonos\n');
    expect(mensaje).toContain('\n\nGanancia\n');
  });
});
