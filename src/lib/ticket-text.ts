// Limpieza del texto que llega del OCR. Aquí no se interpreta nada: solo se
// separan renglones y se marcan los que son ruido o resúmenes del ticket.

const NOISE_PREFIXES = [
  'GRACIAS',
  'VUELVA',
  'TICKET',
  'FOLIO',
  'AUTORIZACION',
  'RFC',
  'CAJERO',
  'CAJA',
  'SUCURSAL',
  'TELEFONO',
  'TEL.',
  'DIRECCION',
  'HORA',
  'FECHA',
  'MONEDA',
  'TIPO DE CAMBIO',
  'ATENDIO',
  'CLIENTE',
  'WWW.',
  'HTTP',
  'TIENDA',
  'AV.',
  'AVENIDA',
  'CALLE',
  'BLVD',
  'BOULEVARD',
  'COL.',
  'COLONIA',
  'C.P.',
  'KM',
];

const SUMMARY_PREFIXES = [
  'SUBTOTAL',
  'TOTAL',
  'IVA',
  'IMPUESTO',
  'DESCUENTO',
  'EFECTIVO',
  'CAMBIO',
  'TARJETA',
  'PUNTOS',
  'AHORRO',
  'REDONDEO',
  'PROPINA',
  'SALDO',
  'RECIBIDO',
];

/** Mayúsculas sin acentos, para comparar palabras clave. */
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/** Texto crudo -> renglones útiles, sin líneas vacías ni separadores. */
export function normalizeTicketText(raw: string): string[] {
  if (typeof raw !== 'string') {
    return [];
  }
  return raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/[\t\u00a0]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
    )
    .filter((line) => line.length > 0 && !/^[-=_*.#~\s]+$/.test(line));
}

function startsWithAny(folded: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => folded.startsWith(prefix));
}

/** Leyendas de encabezado o pie que no son productos. */
export function isNoiseLine(line: string): boolean {
  return startsWithAny(foldText(line), NOISE_PREFIXES);
}

/** Palabras que pueden seguir a una palabra clave sin convertirla en producto. */
const SUMMARY_TAILS = new Set([
  '',
  'A PAGAR',
  'A PAGAR CON TARJETA',
  'DE VENTA',
  'GENERAL',
  'INCLUIDO',
  'INCLUIDOS',
  'A FAVOR',
  'ANTERIOR',
  'PENDIENTE',
  'EN EFECTIVO',
  'EFECTIVO',
  'CAMBIO',
  'TARJETA',
  'DE CREDITO',
  'DE DEBITO',
  'PUNTOS',
  'REDONDEO',
  'PROPINA',
  'CON IVA',
]);

/** Palabras que también pueden iniciar el nombre de un producto. */
const PRODUCT_LIKE_PREFIXES = new Set(['TOTAL', 'IVA', 'IMPUESTO']);

function summaryTail(folded: string, keyword: string): string {
  return folded
    .slice(keyword.length)
    .replace(/[$0-9%.,:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Renglón de totales, pagos o descuentos. Un producto como "TOTAL CARE
 * SHAMPOO" no se descarta: solo cuenta como resumen si después de la palabra
 * clave solo queda el monto o una frase conocida ("A PAGAR", "INCLUIDO"...).
 */
export function isSummaryLine(line: string): boolean {
  const folded = foldText(line);
  const keyword = SUMMARY_PREFIXES.find((prefix) => folded.startsWith(prefix));
  if (!keyword) {
    return false;
  }
  if (!PRODUCT_LIKE_PREFIXES.has(keyword)) {
    return true;
  }
  return SUMMARY_TAILS.has(summaryTail(folded, keyword));
}
