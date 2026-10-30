// Conversión entre lo que escribe la usuaria y centavos enteros.
// Sin aritmética de punto flotante: todo se calcula con enteros.

const MONEY_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/** Convierte texto como "12.50", "12,5" o "$7" en centavos enteros. */
export function parseMoneyToCents(text: string): number {
  const cleaned = text.trim().replace(/^\$\s*/, '');

  if (cleaned === '') {
    throw new Error('Escribe un precio.');
  }
  if (cleaned.startsWith('-')) {
    throw new Error('El precio no puede ser negativo.');
  }
  if (/[^\d.,]/.test(cleaned)) {
    throw new Error('El precio solo puede llevar números y un punto decimal.');
  }
  if ((cleaned.match(/[.,]/g) ?? []).length > 1) {
    throw new Error('El precio solo puede tener un separador decimal.');
  }

  const match = MONEY_PATTERN.exec(cleaned);
  if (!match) {
    const [whole = '', fraction = ''] = cleaned.split(/[.,]/);
    if (whole === '') {
      throw new Error('Escribe el precio completo (ejemplo: 0.50).');
    }
    if (fraction === '') {
      throw new Error('Falta la parte decimal (ejemplo: 12.50).');
    }
    throw new Error('El precio solo puede tener 2 decimales (ejemplo: 12.50).');
  }

  const wholePart = Number(match[1]);
  const fractionPart = Number((match[2] ?? '').padEnd(2, '0'));
  const cents = wholePart * 100 + fractionPart;

  if (!Number.isSafeInteger(cents)) {
    throw new Error('El precio es demasiado grande.');
  }
  return cents;
}

/** Texto para rellenar el campo al editar: 1250 -> "12.50". */
export function centsToInputText(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('El monto no es válido.');
  }
  const fraction = cents % 100;
  const whole = (cents - fraction) / 100;
  return `${whole}.${String(fraction).padStart(2, '0')}`;
}