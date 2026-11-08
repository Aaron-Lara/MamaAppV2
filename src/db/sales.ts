// Registro de ventas. Las pantallas no escriben SQL.
// El dinero se guarda siempre en centavos (enteros).

import type { SQLiteDatabase } from 'expo-sqlite';

import { insertSaleInTransaction } from '@/db/sales-insert';
import type { PaymentMethod, SaleItemInput } from '@/db/sales-insert';
import { isValidDateString, localDateString } from '@/lib/dates';
import { lineTotalCents, sumCents } from '@/lib/money';

export type { PaymentMethod } from '@/db/sales-insert';
export type SaleStatus = 'active' | 'void';

export type NewSaleItem = SaleItemInput;

export type NewSale = {
  paymentMethod: PaymentMethod;
  customerId?: number | null;
  items: NewSaleItem[];
  /** Fecha local AAAA-MM-DD; si se omite se usa la del teléfono hoy. */
  saleDate?: string;
};

type ValidSale = {
  items: NewSaleItem[];
  customerId: number | null;
  saleDate: string;
  totalCents: number;
};

/** Valida la entrada completa antes de escribir nada en la base. */
function validateSale(input: NewSale): ValidSale {
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new Error('La venta necesita al menos un producto.');
  }
  if (input.paymentMethod !== 'cash' && input.paymentMethod !== 'credit') {
    throw new Error('La forma de pago no es válida.');
  }
  const customerId = input.customerId ?? null;
  if (customerId !== null && !Number.isSafeInteger(customerId)) {
    throw new Error('El cliente de la venta no es válido.');
  }
  if (input.paymentMethod === 'credit' && customerId === null) {
    throw new Error('Una venta fiada necesita un cliente.');
  }

  const items = input.items.map((item, index) => {
    const position = index + 1;
    const description = item.description.trim();
    if (!description) {
      throw new Error(`El renglón ${position} necesita una descripción.`);
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new Error(`La cantidad del renglón ${position} debe ser un entero mayor a cero.`);
    }
    if (!Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
      throw new Error(`El precio del renglón ${position} no es válido.`);
    }
    if (item.productId != null && !Number.isSafeInteger(item.productId)) {
      throw new Error(`El producto del renglón ${position} no es válido.`);
    }
    return { ...item, description };
  });

  const saleDate = input.saleDate ?? localDateString();
  if (!isValidDateString(saleDate)) {
    throw new Error('La fecha de la venta no es válida.');
  }

  const totalCents = sumCents(
    items.map((item) => lineTotalCents(item.quantity, item.unitPriceCents))
  );
  return { items, customerId, saleDate, totalCents };
}

/**
 * Guarda una venta con todos sus renglones en una sola transacción.
 * Si algo falla, no queda nada a medias. Devuelve el id de la venta.
 */
export async function recordSale(db: SQLiteDatabase, input: NewSale): Promise<number> {
  const { items, customerId, saleDate, totalCents } = validateSale(input);

  let saleId = 0;
  await db.withExclusiveTransactionAsync(async (txn) => {
    saleId = await insertSaleInTransaction(txn, {
      paymentMethod: input.paymentMethod,
      customerId,
      items,
      saleDate,
      totalCents,
    });
  });

  if (saleId === 0) {
    throw new Error('No se pudo guardar la venta.');
  }
  return saleId;
}
