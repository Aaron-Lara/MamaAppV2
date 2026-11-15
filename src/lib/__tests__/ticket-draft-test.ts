// Pruebas del adaptador al formulario de compras: claves, límites y bloqueos.

import {
  DECIMAL_TICKET,
  MESSY_TICKET,
  SMART_TICKET,
  USD_TICKET,
  WALMART_TICKET,
} from '../../../test-utils/ticket-fixtures';
import { validatePurchaseForm } from '../purchase-form';
import { buildTicketDraft } from '../ticket-draft';
import { parseTicket } from '../ticket-parse';

const FECHA = '2026-11-12';

function draft(raw: string) {
  return buildTicketDraft(parseTicket(raw));
}

describe('borrador compatible con el formulario', () => {
  test('un ticket completo produce un borrador listo', () => {
    const result = draft(WALMART_TICKET);
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.values.store).toBe('WALMART');
    expect(result.values.currency).toBe('MXN');
    expect(result.values.exchangeRate).toBe('');
    expect(result.values.lines.map((line) => line.description)).toEqual([
      'LECHE ENTERA 1L',
      'PAN BLANCO 680G',
      'SABRITAS',
      'AGUA 600ML',
    ]);
    expect(result.values.lines.map((line) => line.units)).toEqual([
      '2',
      '1',
      '3',
      '1',
    ]);
    expect(result.values.lines.map((line) => line.cost)).toEqual([
      '48.00',
      '42.50',
      '36.00',
      '18.50',
    ]);
  });

  test('nunca asocia ni crea productos', () => {
    const lines = draft(WALMART_TICKET).values.lines;
    for (const line of lines) {
      expect(line.productId).toBeNull();
      expect(line.productName).toBeNull();
      expect(line.trackStock).toBeNull();
    }
  });

  test('validatePurchaseForm acepta el borrador completo', () => {
    const result = validatePurchaseForm(draft(WALMART_TICKET).values, FECHA);
    expect(result.ok).toBe(true);
    expect(result.totalCents).toBe(14500);
    expect(result.errors).toEqual({ lines: {} });
  });

  test('las claves son únicas y siguen el orden del ticket', () => {
    const keys = draft(WALMART_TICKET).values.lines.map((line) => line.key);
    expect(keys).toEqual([
      'ticket-line-1',
      'ticket-line-2',
      'ticket-line-3',
      'ticket-line-4',
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('un ticket vacío deja una línea y no se marca como listo', () => {
    const result = draft('');
    expect(result.values.lines).toHaveLength(1);
    expect(result.values.lines[0]).toMatchObject({
      description: '',
      units: '1',
      cost: '',
      productId: null,
    });
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain('no_lines');
  });

  test('respeta el máximo de renglones del formulario', () => {
    expect(draft(WALMART_TICKET).values.lines.length).toBeLessThanOrEqual(60);
  });
});

describe('borradores incompletos', () => {
  test('USD no se marca listo sin tipo de cambio', () => {
    const result = draft(USD_TICKET);
    expect(result.values.currency).toBe('USD');
    expect(result.values.exchangeRate).toBe('');
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain(
      'usd_rate_required'
    );
    expect(result.values.lines[0].description).toBe('CAMISA');
    expect(validatePurchaseForm(result.values, FECHA).ok).toBe(false);
  });

  test('una cantidad decimal deja las unidades vacías y bloquea', () => {
    const result = draft(DECIMAL_TICKET);
    expect(result.values.lines[0].units).toBe('');
    expect(result.values.lines[0].cost).toBe('18.50');
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain(
      'decimal_quantity'
    );
    expect(
      validatePurchaseForm(result.values, FECHA).errors.lines['ticket-line-1']
        .units
    ).toBeDefined();
  });

  test('un renglón sin cantidad queda bloqueado', () => {
    const result = draft(MESSY_TICKET);
    const line = result.values.lines[0];
    expect(line.description).toBe('LECHE 1L');
    expect(line.units).toBe('');
    expect(line.cost).toBe('25.00');
    expect(result.blockers.map((item) => item.code)).toContain(
      'missing_quantity'
    );
  });

  test('un multiplicador sin total impreso produce el costo correcto', () => {
    const result = draft('SMART\n3 X 12.00 SABRITAS\nTOTAL 36.00');
    expect(result.values.lines[0].units).toBe('3');
    expect(result.values.lines[0].cost).toBe('36.00');
    expect(result.ready).toBe(true);
    expect(
      validatePurchaseForm(result.values, FECHA).totalCents
    ).toBe(3600);
  });

  test('un multiplicador fuera de límite bloquea el borrador', () => {
    const result = draft('SMART\n1001 X 1000.00 PRODUCTO\nTOTAL 1001000.00');
    expect(result.values.lines[0].cost).toBe('');
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain(
      'price_too_high'
    );
  });

  test('un renglón con precio ilegible conserva el texto y bloquea', () => {
    const result = draft('SMART\n1 PZA FOCO 10.00\nSIN PRECIO\nTOTAL 10.00');
    expect(result.values.lines).toHaveLength(2);
    expect(result.values.lines[1].description).toBe('SIN PRECIO');
    expect(result.values.lines[1].cost).toBe('');
    expect(result.ready).toBe(false);
    expect(result.blockers.map((item) => item.code)).toContain('missing_price');
  });

  test('unidades o costos fuera de límite quedan vacíos y bloquean', () => {
    const units = draft('SMART\n10001 PZA TORNILLO 5.00\nTOTAL 50005.00');
    expect(units.values.lines[0].units).toBe('');
    expect(units.values.lines[0].cost).toBe('5.00');
    expect(units.ready).toBe(false);
    expect(units.blockers.map((item) => item.code)).toContain(
      'units_too_large'
    );

    const price = draft('SMART\n1 PZA TELEVISOR 10,000.01\nTOTAL 10000.01');
    expect(price.values.lines[0].cost).toBe('');
    expect(price.blockers.map((item) => item.code)).toContain('price_too_high');
    expect(price.ready).toBe(false);
  });

  test('sin tienda deja el campo vacío', () => {
    const result = draft(SMART_TICKET);
    expect(result.values.store).toBe('SMART');
    expect(draft('TIENDA X\n1 PZA SAL 10.00\nTOTAL 10.00').values.store).toBe(
      ''
    );
  });
});
