// Detalle de una compra. Se recarga al enfocar y después de anular.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getPurchaseDetail, type PurchaseDetail } from '@/db/purchases-get';

const LOAD_ERROR = 'No se pudo cargar la compra.';
const MISSING_ERROR = 'No se encontró esa compra.';

export type PurchaseDetailState = {
  detail: PurchaseDetail | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function usePurchaseDetail(purchaseId: number): PurchaseDetailState {
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(purchaseId > 0);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (purchaseId <= 0) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }
    const request = requestId.current + 1;
    requestId.current = request;
    // El indicador solo se muestra en la primera carga de la pantalla.
    if (request === 1) {
      setLoading(true);
    }
    try {
      const data = await getPurchaseDetail(db, purchaseId);
      if (request !== requestId.current) {
        return;
      }
      setDetail(data);
      setError(data ? null : MISSING_ERROR);
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db, purchaseId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { detail, loading, error, reload };
}
