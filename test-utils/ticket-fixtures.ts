// Textos de tickets usados por las pruebas del parser. Viven fuera de
// __tests__ para que Jest no los trate como suites.

export const WALMART_TICKET = [
  'WALMART SUPERCENTER',
  'SUCURSAL 1234',
  'AV. JUAREZ 100',
  'TICKET 004512',
  'FECHA 12/11/2026  HORA 14:32',
  'CAJERO 05',
  '--------------------------------',
  '2 PZA LECHE ENTERA 1L 48.00',
  '1 PZA PAN BLANCO 680G 42.50',
  '3 X 12.00 SABRITAS 36.00',
  '1 PZA AGUA 600ML 18.50',
  '--------------------------------',
  'SUBTOTAL 145.00',
  'IVA 16% 23.20',
  'TOTAL 168.20',
  'EFECTIVO 200.00',
  'CAMBIO 31.80',
  'GRACIAS POR SU COMPRA',
].join('\n');

export const HEB_TICKET = [
  'HEB',
  'FECHA 10-11-2026',
  '2 X 25.00 JITOMATE 50.00',
  '1 PZA MANZANA 30.00',
  'SUBTOTAL 80.00',
  'DESCUENTO 10.00',
  'TOTAL 70.00',
].join('\n');

export const SMART_TICKET = [
  'SMART',
  '1 PZA LECHE 1L 25.00',
  'TOTAL 25.00',
].join('\n');

export const USD_TICKET = [
  'WALMART SUPERCENTER',
  'FECHA 12/11/2026',
  '1 PZA CAMISA 15.00 USD',
  'TOTAL 15.00 USD',
].join('\n');

export const DECIMAL_TICKET = [
  'SMART',
  'FECHA 12/11/2026',
  'PLATANO 0.750 KG 18.50',
  'TOTAL 18.50',
].join('\n');

export const MESSY_TICKET = [
  'TIENDA LA ESQUINA',
  'FECHA 31/02/2026',
  'LECHE 1L $25.00',
  '12.5O',
  'PLATANO 0.750 KG 18.50',
  'SIN PRECIO',
  'TOTAL 43.50',
].join('\n');

export const BROKEN_TOTALS_TICKET = [
  'WALMART',
  '1 PZA ARROZ 20.00',
  '1 PZA FRIJOL 30.00',
  'SUBTOTAL 50.00',
  'TOTAL 55.00',
].join('\n');

export const LINES_MISMATCH_TICKET = [
  'SMART',
  '1 PZA ARROZ 20.00',
  '1 PZA FRIJOL 30.00',
  'SUBTOTAL 45.00',
  'TOTAL 45.00',
].join('\n');

/** Ticket con más renglones de los que acepta el formulario. */
export function longTicket(count = 65): string {
  const lines = ['SMART', 'FECHA 12/11/2026'];
  for (let index = 1; index <= count; index += 1) {
    lines.push(`1 PZA PRODUCTO ${index} 10.00`);
  }
  lines.push(`TOTAL ${(count * 10).toFixed(2)}`);
  return lines.join('\n');
}
