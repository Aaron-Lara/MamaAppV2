// Carga de productos vendibles y frecuentes para la pantalla Vender.
// Las pantallas no escriben SQL: todo pasa por src/db.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listProductsWithStock } from '@/db/products-with-stock';
import { listFrequentProducts } from '@/db/sales-frequent';
import { toSellableProduct, type SellableProduct } from '@/lib/sellable-product';
import { MAX_FREQUENT, type FrequencyRow } from '@/lib/sellable-order';

const LOAD_ERROR = 'No se pudieron cargar los productos para vender.';

export type SellableProducts = {
  products: SellableProduct[];
  frequency: FrequencyRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useSellableProducts(): SellableProducts {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<SellableProduct[]>([]);
  const [frequency, setFrequency] = useState<FrequencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de recargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const [rows, frequent] = await Promise.all([
        listProductsWithStock(db),
        listFrequentProducts(db, { limit: MAX_FREQUENT }),
      ]);
      if (request !== requestId.current) {
        return;
      }
      setProducts(rows.map(toSellableProduct));
      setFrequency(frequent);
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

  // NativeTabs deja la pantalla montada: hay que recargar cada vez que recibe foco.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { products, frequency, loading, error, reload };
}
