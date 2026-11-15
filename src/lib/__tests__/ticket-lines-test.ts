// Pruebas de renglones: cantidades, precios, límites y texto ilegible.

import { longTicket, WALMART_TICKET } from '../../../test-utils/ticket-fixtures';
import { extractTicketLines } from '../ticket-extract';
import { parseTicketLine } from '../ticket-lines';
import { findTicketAmounts } from '../ticket-money';
import { parseTicket } from '../ticket-parse';

function parse(source: string) {
  const parsed = parseTicketLine(source);
  if (!parsed) {
    throw new Error(`No se pudo interpretar: ${source}`);
  }
  return parsed;
}

describe('cantidades y precios de un renglón', () => {
  test('lee el multiplicador y el total del renglón', () => {
    const { line } = parse('3 X 12.00 SABRITAS 36.00');
    expect(line.description).toBe('SABRITAS');
    expect(line.quantity).toEqual({ kind: 'integer', units: 3 });
    expect(line.unitPriceCents).toBe(1200);
    expect(line.lineTotalCents).toBe(3600);
    expect(line.confidence).toBe('high');
  });

  test('calcula el total con multiplicador aunque no esté impreso', () => {
    const sabritas = parse('3 X 12.00 SABRITAS');
    expect(sabritas.line.quantity).toEqual({ kind: 'integer', units: 3 });
    expect(sabritas.line.unitPriceCents).toBe(1200);
    expect(sabritas.line.lineTotalCents).toBe(3600);
    expect(sabritas.line.confidence).toBe('high');

    const jitomate = parse('2 X 25.00 JITOMATE');
    expect(jitomate.line.lineTotalCents).toBe(5000);
    expect(jitomate.issues.map((issue) => issue.code)).not.toContain(
      'line_price_mismatch'
    );
  });

  test('un multiplicador fuera de límite no produce un costo válido', () => {
    const over = parse('1001 X 1000.00 PRODUCTO');
    expect(over.line.lineTotalCents).toBe(100100000);
    expect(over.line.confidence).toBe('low');
    expect(over.issues.map((issue) => issue.code)).toContain('price_too_high');

    const unsafe = parse('99999999999999999999 X 12.00 PRODUCTO');
    expect(unsafe.line.lineTotalCents).toBeNull();
    expect(unsafe.issues.map((issue) => issue.code)).toContain('invalid_price');
  });

  test('lee montos sin separador de miles', () => {
    const arroz = parse('1 PZA ARROZ 1234.50');
    expect(arroz.line.lineTotalCents).toBe(123450);
    const tele = parse('1 PZA TELEVISOR 10000.00');
    expect(tele.line.lineTotalCents).toBe(1000000);
    expect(tele.issues.map((issue) => issue.code)).not.toContain(
      'price_too_high'
    );
    const simbolo = parse('1 PZA FOCO $1234.50');
    expect(simbolo.line.lineTotalCents).toBe(123450);
  });

  test('lee el conteo inicial en piezas', () => {
    const { line } = parse('2 PZA LECHE ENTERA 1L 48.00');
    expect(line.description).toBe('LECHE ENTERA 1L');
    expect(line.quantity).toEqual({ kind: 'integer', units: 2 });
    expect(line.lineTotalCents).toBe(4800);
  });

  test('una cantidad decimal queda sin resolver, sin redondear', () => {
    const { line, issues } = parse('PLATANO 0.750 KG 18.50');
    expect(line.quantity).toEqual({ kind: 'decimal', raw: '0.750 KG' });
    expect(line.lineTotalCents).toBe(1850);
    expect(line.confidence).toBe('low');
    expect(issues.map((issue) => issue.code)).toContain('decimal_quantity');
  });

  test('sin cantidad no se asume ninguna', () => {
    const { line, issues } = parse('LECHE 1L 25.00');
    expect(line.quantity).toEqual({ kind: 'unknown' });
    expect(line.unitPriceCents).toBeNull();
    expect(issues.map((issue) => issue.code)).toContain('missing_quantity');
  });

  test('lee montos con separador de miles', () => {
    const { line } = parse('1 PZA ARROZ 1,234.50');
    expect(line.lineTotalCents).toBe(123450);
  });

  test('un precio mal formateado no se adivina', () => {
    expect(parseTicketLine('12.5O')).toBeNull();
    expect(findTicketAmounts('12.5O')).toEqual([]);
  });

  test('recorta descripciones largas y lo advierte', () => {
    const longName = 'A'.repeat(80);
    const { line, issues } = parse(`1 PZA ${longName} 10.00`);
    expect(line.description).toHaveLength(60);
    expect(issues.map((issue) => issue.code)).toContain('description_too_long');
  });

  test('marca unidades y precios fuera de límite sin recortarlos', () => {
    const units = parse('10001 PZA TORNILLO 5.00');
    expect(units.issues.map((issue) => issue.code)).toContain('units_too_large');

    const price = parse('1 PZA TELEVISOR 10,000.01');
    expect(price.issues.map((issue) => issue.code)).toContain('price_too_high');
    expect(price.line.lineTotalCents).toBe(1000001);
  });
});

describe('extracción de renglones', () => {
  test('separa productos de totales y leyendas', () => {
    const text = [
      'TICKET 004512',
      'GRACIAS POR SU COMPRA',
      '1 PZA SAL 10.00',
      'TOTAL 10.00',
    ];
    const result = extractTicketLines(text);
    expect(result.lines.map((line) => line.description)).toEqual(['SAL']);
    expect(result.unparsed).toEqual([]);
  });

  test('un producto con palabra de encabezado no se descarta si trae precio', () => {
    const result = extractTicketLines([
      'SMART',
      'CAJA DE CHOCOLATES 120.00',
      'TOTAL 120.00',
    ]);
    expect(result.lines.map((line) => line.description)).toEqual([
      'CAJA DE CHOCOLATES',
    ]);
  });

  test('un producto que empieza con TOTAL no se confunde con el resumen', () => {
    const result = extractTicketLines([
      'SMART',
      'TOTAL CARE SHAMPOO 50.00',
      'TOTAL 50.00',
    ]);
    expect(result.lines.map((line) => line.description)).toEqual([
      'TOTAL CARE SHAMPOO',
    ]);
    expect(result.lines[0].lineTotalCents).toBe(5000);
  });

  test('conserva el primer producto aunque su precio sea ilegible', () => {
    const result = extractTicketLines([
      'SMART',
      '1 PZA FOCO 1O.00',
      '1 PZA SAL 10.00',
      'TOTAL 20.00',
    ]);
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].lineTotalCents).toBeNull();
    expect(result.lines[1].description).toBe('SAL');
    expect(result.warnings.map((warning) => warning.code)).toContain(
      'missing_price'
    );
  });

  test('respeta el máximo de renglones y reporta los que sobran', () => {
    const result = extractTicketLines(longTicket(65).split('\n'));
    expect(result.lines).toHaveLength(60);
    expect(result.unparsed).toHaveLength(5);
    expect(result.warnings.map((warning) => warning.code)).toContain('line_limit');
  });

  test('el mismo texto produce el mismo resultado', () => {
    expect(parseTicket(WALMART_TICKET)).toEqual(parseTicket(WALMART_TICKET));
  });
});
