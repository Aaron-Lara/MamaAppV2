// Tipo de cambio y conversión a pesos sin decimales de JavaScript.
// El tipo de cambio se guarda como entero x10000 (20.50 pesos = 205000).

export const EXCHANGE_RATE_SCALE = 10000;
export const MIN_EXCHANGE_RATE = 1;
export const MAX_EXCHANGE_RATE = 100;
export const MXN_RATE_X10000 = 10000;

const MIN_RATE_X10000 = MIN_EXCHANGE_RATE * EXCHANGE_RATE_SCALE;
const MAX_RATE_X10000 = MAX_EXCHANGE_RATE * EXCHANGE_RATE_SCALE;
const RATE_PATTERN = /^(\d+)(?:[.,](\d{1,4}))?$/;

/** Texto como "20.50", "20,5" o "19.9999" -> entero x10000. */
export function parseExchangeRate(text: string): number {
  if (typeof text !== 'string') {
    throw new Error('El tipo de cambio no es válido.');
  }
  const cleaned = text.trim();
  if (cleaned === '') {
    throw new Error('Escribe el tipo de cambio.');
  }
  if (cleaned.startsWith('-')) {
    throw new Error(
      `El tipo de cambio debe estar entre ${MIN_EXCHANGE_RATE} y ${MAX_EXCHANGE_RATE} pesos por dólar.`
    );
  }
  if (/[^\d.,]/.test(cleaned)) {
    throw new Error('El tipo de cambio solo puede llevar números y un punto decimal.');
  }
  if ((cleaned.match(/[.,]/g) ?? []).length > 1) {
    throw new Error('El tipo de cambio solo puede tener un separador decimal.');
  }

  const match = RATE_PATTERN.exec(cleaned);
  if (!match) {
    const [, fraction = ''] = cleaned.split(/[.,]/);
    if (fraction.length > 4) {
      throw new Error('El tipo de cambio solo puede tener 4 decimales.');
    }
    throw new Error('Escribe el tipo de cambio completo (ejemplo: 20.50).');
  }

  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '').padEnd(4, '0'));
  const rate = whole * EXCHANGE_RATE_SCALE + fraction;
  if (!Number.isSafeInteger(rate)) {
    throw new Error('El tipo de cambio es demasiado grande.');
  }
  if (rate < MIN_RATE_X10000 || rate > MAX_RATE_X10000) {
    throw new Error(
      `El tipo de cambio debe estar entre ${MIN_EXCHANGE_RATE} y ${MAX_EXCHANGE_RATE} pesos por dólar.`
    );
  }
  return rate;
}

/** Centavos en la moneda original -> centavos en pesos, redondeando al centavo. */
export function convertToMxnCents(costCents: number, rateX10000: number): number {
  if (!Number.isSafeInteger(costCents) || costCents < 0) {
    throw new Error('El costo debe ser un entero mayor o igual a cero.');
  }
  if (!Number.isSafeInteger(rateX10000) || rateX10000 <= 0) {
    throw new Error('El tipo de cambio no es válido.');
  }
  const product = costCents * rateX10000;
  if (!Number.isSafeInteger(product)) {
    throw new Error('La conversión se sale del rango seguro de enteros.');
  }
  return Math.round(product / EXCHANGE_RATE_SCALE);
}
