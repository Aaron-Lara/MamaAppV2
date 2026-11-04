// Filas de la lista "Ventas del día". Lógica pura, sin SQL ni pantallas.

import type { DaySale } from '@/db/day-sales';
import { formatLocalTime } from '@/lib/local-time';
import { formatCents } from '@/lib/money';
import { formatSaleItemsText } from '@/lib/sale-items-formatter';

export type DaySaleRow = {
  id: number;
  totalCents: number;
  timeLabel: string;
  totalLabel: string;
  paymentLabel: string;
  customerLabel: string | null;
  itemsText: string;
  isVoid: boolean;
  voidReason: string | null;
};

/**
 * Conserva el orden recibido (la más reciente primero) y deja lista la
 * presentación. El aviso de "otro día" se decide al anular, no por fila.
 */
export function buildDaySaleRows(
  sales: readonly DaySale[],
  utcOffsetMinutes: number
): DaySaleRow[] {
  return sales.map((sale) => ({
    id: sale.id,
    totalCents: sale.totalCents,
    timeLabel: formatLocalTime(sale.createdAt, utcOffsetMinutes),
    totalLabel: formatCents(sale.totalCents),
    paymentLabel: sale.paymentMethod === 'credit' ? 'Fiado' : 'Efectivo',
    customerLabel: sale.paymentMethod === 'credit' ? sale.customerName : null,
    itemsText: formatSaleItemsText(sale.items),
    isVoid: sale.status === 'void',
    voidReason: sale.voidReason,
  }));
}
