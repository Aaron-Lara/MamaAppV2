// Pruebas de advertencias y datos ausentes. El parser nunca inventa datos ni
// convierte un texto ilegible en un producto.

import {
  DECIMAL_TICKET,
  MESSY_TICKET,
  SMART_TICKET,
  USD_TICKET,
  WALMART_TICKET,
} from '../../../test-utils/ticket-fixtures';
import { parseTicketLine } from '../ticket-lines';
import { parseTicket } from '../ticket-parse';

function codes(raw: string): string[] {
  return parseTicket(raw).warnings.map((warning) => warning.code);
}

describe('moneda', () => {
  test('sin marca propone MXN y lo advierte', () => {
    const result = parseTicket(SMART_TICKET);
    expect(result.currency).toBe('MXN');
    expect(result.currencyCertain).toBe(false);
    expect(codes(SMART_TICKET)).toContain('currency_assumed');
  });

  test('un dólar explícito es USD y no se advierte la moneda', () => {
    const result = parseTicket(USD_TICKET);
    expect(result.currency).toBe('USD');
    expect(result.currencyCertain).toBe(true);
    expect(codes(USD_TICKET)).not.toContain('currency_assumed');
  });

  test('una marca MXN explícita da certeza', () => {
    const raw = 'SMART\n1 PZA SAL 10.00 MXN\nTOTAL 10.00 MXN';
    const result = parseTicket(raw);
    expect(result.currency).toBe('MXN');
    expect(result.currencyCertain).toBe(true);
  });
});

describe('datos faltantes', () => {
  test('un texto vacío reporta todo lo que falta', () => {
    const result = parseTicket('');
    expect(result.lines).toEqual([]);
    expect(result.unparsedLines).toEqual([]);
    expect(new Set(codes(''))).toEqual(
      new Set([
        'store_missing',
        'date_missing',
        'currency_assumed',
        'no_lines',
        'total_missing',
      ])
    );
  });

  test('conserva el texto original de los renglones ilegibles', () => {
    const result = parseTicket(MESSY_TICKET);
    const sources = result.lines.map((line) => line.source);
    expect(sources).toContain('12.5O');
    expect(sources).toContain('SIN PRECIO');
    const warning = result.warnings.find(
      (item) => item.code === 'missing_price'
    );
    expect(warning?.rawLine).toBe('12.5O');
  });

  test('no reporta como ilegible el encabezado del ticket', () => {
    const result = parseTicket(WALMART_TICKET);
    expect(result.unparsedLines).toEqual([]);
  });

  test('una cantidad decimal conserva el valor original', () => {
    const line = parseTicket(DECIMAL_TICKET).lines[0];
    expect(line.quantity).toEqual({ kind: 'decimal', raw: '0.750 KG' });
  });

  test('un precio negativo no se convierte en costo', () => {
    const parsed = parseTicketLine('DEVOLUCION -12.00');
    expect(parsed?.line.lineTotalCents).toBeNull();
    expect(parsed?.issues.map((issue) => issue.code)).toContain(
      'negative_amount'
    );
  });

  test('los límites del formulario se respetan en el borrador', () => {
    const result = parseTicket(WALMART_TICKET);
    for (const line of result.lines) {
      expect((line.description ?? '').length).toBeLessThanOrEqual(60);
    }
  });

  test('las advertencias siempre traen un mensaje', () => {
    for (const raw of [WALMART_TICKET, MESSY_TICKET, '', SMART_TICKET]) {
      for (const warning of parseTicket(raw).warnings) {
        expect(warning.message.length).toBeGreaterThan(0);
      }
    }
  });
});
