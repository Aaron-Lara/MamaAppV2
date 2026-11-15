// Pruebas de tienda y fecha del parser de tickets. Solo lógica pura.

import {
  MESSY_TICKET,
  SMART_TICKET,
  WALMART_TICKET,
} from '../../../test-utils/ticket-fixtures';
import { buildTicketDraft } from '../ticket-draft';
import { parseTicket } from '../ticket-parse';

function codes(raw: string): string[] {
  return parseTicket(raw).warnings.map((warning) => warning.code);
}

describe('tienda del ticket', () => {
  test('detecta una marca conocida en el encabezado', () => {
    expect(parseTicket(WALMART_TICKET).store).toBe('WALMART');
    expect(parseTicket(SMART_TICKET).store).toBe('SMART');
  });

  test('sin una marca conocida no inventa la tienda', () => {
    const result = parseTicket(MESSY_TICKET);
    expect(result.store).toBeNull();
    expect(codes(MESSY_TICKET)).toContain('store_missing');
  });
});

describe('fecha del ticket', () => {
  test('normaliza DD/MM/AAAA a AAAA-MM-DD', () => {
    const result = parseTicket(WALMART_TICKET);
    expect(result.date).toBe('2026-11-12');
    expect(result.dateText).toBe('12/11/2026');
  });

  test('acepta guiones y años de dos dígitos', () => {
    expect(parseTicket('HEB\nFECHA 10-11-26\n1 PZA SAL 10.00\nTOTAL 10.00').date).toBe(
      '2026-11-10'
    );
  });

  test('acepta el mes escrito con letras', () => {
    const raw = 'SMART\nFECHA 12 NOV 26\n1 PZA SAL 10.00\nTOTAL 10.00';
    expect(parseTicket(raw).date).toBe('2026-11-12');
  });

  test('sin fecha lo advierte y no la inventa', () => {
    const result = parseTicket(SMART_TICKET);
    expect(result.date).toBeNull();
    expect(codes(SMART_TICKET)).toContain('date_missing');
  });

  test('rechaza fechas imposibles', () => {
    const result = parseTicket(MESSY_TICKET);
    expect(result.date).toBeNull();
    expect(codes(MESSY_TICKET)).toContain('date_invalid');
  });

  test('con dos fechas distintas no elige ninguna', () => {
    const raw = [
      'SMART',
      'FECHA 12/11/2026',
      'CORTE 15/11/2026',
      '1 PZA SAL 10.00',
      'TOTAL 10.00',
    ].join('\n');
    const result = parseTicket(raw);
    expect(result.date).toBeNull();
    expect(codes(raw)).toContain('date_ambiguous');
  });

  test('la fecha detectada no cambia la del formulario', () => {
    const draft = buildTicketDraft(parseTicket(WALMART_TICKET));
    expect('purchaseDate' in draft.values).toBe(false);
    expect(draft.values).not.toHaveProperty('date');
  });
});
