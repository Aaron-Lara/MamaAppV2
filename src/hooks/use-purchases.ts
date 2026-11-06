// Lista de compras: se recarga al enfocar la pantalla y al volver del detalle.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listPurchases, type PurchaseListItem } from '@/db/purchases-list';

const LOAD_ERROR = 'No se pudieron cargar las compras.';

export type PurchasesState = {
  items: PurchaseListItem[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function usePurchases(): PurchasesState {
  const db = useSQLiteContext();
  const [items, setItems] = useState<PurchaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de cargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    // El indicador solo se muestra en la primera carga de la pantalla.
    if (request === 1) {
      setLoading(true);
    }
    try {
      const rows = await listPurchases(db);
      if (request !== requestId.current) {
        return;
      }
      setItems(rows);
      setError(null);
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { items, loading, error, reload };
}
