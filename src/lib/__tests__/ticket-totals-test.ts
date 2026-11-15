// Pruebas de subtotal, impuestos, descuento y total. Nada se corrige: solo
// se comparan los números impresos en el ticket.

import {
  BROKEN_TOTALS_TICKET,
  HEB_TICKET,
  LINES_MISMATCH_TICKET,
  SMART_TICKET,
  WALMART_TICKET,
} from '../../../test-utils/ticket-fixtures';
import { parseTicket } from '../ticket-parse';

function warnings(raw: string) {
  return parseTicket(raw).warnings;
}

describe('lectura de totales', () => {
  test('lee subtotal, impuestos y total', () => {
    const { totals } = parseTicket(WALMART_TICKET);
    expect(totals).toEqual({
      subtotalCents: 14500,
      taxCents: 2320,
      taxIncluded: false,
      discountCents: null,
      totalCents: 16820,
    });
  });

  test('lee el descuento global sin repartirlo', () => {
    const { totals, lines } = parseTicket(HEB_TICKET);
    expect(totals.discountCents).toBe(1000);
    expect(lines.map((line) => line.lineTotalCents)).toEqual([5000, 3000]);
  });

  test('sin total lo advierte', () => {
    const raw = 'SMART\n1 PZA SAL 10.00';
    expect(parseTicket(raw).totals.totalCents).toBeNull();
    expect(warnings(raw).map((warning) => warning.code)).toContain(
      'total_missing'
    );
  });
});

describe('conciliación de totales', () => {
  test('un ticket que cuadra no genera advertencias de totales', () => {
    const codes = warnings(WALMART_TICKET).map((warning) => warning.code);
    expect(codes).not.toContain('total_mismatch');
    expect(codes).not.toContain('subtotal_mismatch');
  });

  test('el IVA incluido no se suma otra vez al subtotal', () => {
    const raw = [
      'SMART',
      '1 PZA LECHE 72.50',
      '1 PZA PAN 72.50',
      'SUBTOTAL 145.00',
      'IVA INCLUIDO 23.20',
      'TOTAL 145.00',
    ].join('\n');
    const result = parseTicket(raw);
    expect(result.totals.taxCents).toBe(2320);
    expect(result.totals.taxIncluded).toBe(true);
    expect(result.totals.totalCents).toBe(14500);
    const codes = warnings(raw).map((warning) => warning.code);
    expect(codes).not.toContain('subtotal_mismatch');
    expect(codes).not.toContain('total_mismatch');
  });

  test('un IVA normal sí se suma al subtotal', () => {
    const result = parseTicket(WALMART_TICKET);
    const check = result.checks.find((item) => item.kind === 'tax');
    expect(result.totals.taxIncluded).toBe(false);
    expect(check).toMatchObject({
      expectedCents: 16820,
      foundCents: 16820,
      matches: true,
    });
  });

  test('compara los renglones contra el subtotal', () => {
    const result = parseTicket(WALMART_TICKET);
    const check = result.checks.find(
      (item) => item.kind === 'lines_vs_subtotal'
    );
    expect(check).toMatchObject({
      expectedCents: 14500,
      foundCents: 14500,
      differenceCents: 0,
      matches: true,
    });
  });

  test('un descuento global no se marca como error', () => {
    const codes = warnings(HEB_TICKET).map((warning) => warning.code);
    expect(codes).not.toContain('total_mismatch');
    const check = parseTicket(HEB_TICKET).checks.find(
      (item) => item.kind === 'discount'
    );
    expect(check).toMatchObject({
      expectedCents: 7000,
      foundCents: 7000,
      matches: true,
    });
  });

  test('reporta la diferencia exacta contra el subtotal', () => {
    const warning = warnings(LINES_MISMATCH_TICKET).find(
      (item) => item.code === 'total_mismatch'
    );
    expect(warning?.message).toContain('$50.00');
    expect(warning?.message).toContain('$45.00');
    expect(warning?.message).toContain('Diferencia: $5.00');
  });

  test('reporta la diferencia exacta entre subtotal y total', () => {
    const warning = warnings(BROKEN_TOTALS_TICKET).find(
      (item) => item.code === 'subtotal_mismatch'
    );
    expect(warning?.message).toContain('Diferencia: $5.00');
    expect(parseTicket(BROKEN_TOTALS_TICKET).totals.totalCents).toBe(5500);
  });

  test('no compara si falta el total', () => {
    const result = parseTicket(SMART_TICKET);
    expect(result.totals.totalCents).toBe(2500);
    expect(result.checks).toHaveLength(1);
    expect(result.checks[0].kind).toBe('lines_vs_total');
  });
});
