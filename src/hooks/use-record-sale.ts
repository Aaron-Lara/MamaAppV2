// Guardado de una venta (efectivo o fiado). Bloquea el doble toque y
// traduce cualquier fallo a un mensaje en español. No escribe SQL.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { recordSale } from '@/db/sales';
import { buildSaleDraft, type PaymentMethod } from '@/lib/checkout';
import type { Cart } from '@/lib/cart';
import { mapSaleError } from '@/lib/sell-messages';

export type SaleCustomer = { id: number; name: string };

export type RecordedSale = {
  saleId: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  customerName: string | null;
};

export type RecordSale = {
  saving: boolean;
  error: string | null;
  /** Guarda el carrito; null si falló o si ya había un guardado en curso. */
  record: (
    cart: Cart,
    paymentMethod: PaymentMethod,
    customer: SaleCustomer | null
  ) => Promise<RecordedSale | null>;
  clearError: () => void;
};

export function useRecordSale(): RecordSale {
  const db = useSQLiteContext();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const savingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const record = useCallback(
    async (
      cart: Cart,
      paymentMethod: PaymentMethod,
      customer: SaleCustomer | null
    ): Promise<RecordedSale | null> => {
      if (savingRef.current) {
        return null;
      }
      savingRef.current = true;
      setSaving(true);
      setError(null);
      try {
        const draft = buildSaleDraft(cart, paymentMethod, customer?.id ?? null);
        if (!draft.ok) {
          setError(draft.error);
          return null;
        }
        const saleId = await recordSale(db, draft.sale);
        return {
          saleId,
          totalCents: draft.totalCents,
          paymentMethod,
          customerName: paymentMethod === 'credit' ? customer?.name ?? null : null,
        };
      } catch (caught) {
        setError(mapSaleError(caught));
        return null;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [db]
  );

  return { saving, error, record, clearError };
}
