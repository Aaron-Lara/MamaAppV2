// Carga de productos con su stock para la pestaña de inventario.
// Las pantallas no escriben SQL: todo pasa por src/db.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listProductsWithStock, type ProductWithStock } from '@/db/products-with-stock';

const LOAD_ERROR = 'No se pudo cargar el inventario.';

export type InventoryProducts = {
  products: ProductWithStock[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useInventoryProducts(): InventoryProducts {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de recargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const rows = await listProductsWithStock(db, { includeInactive: true });
      if (request !== requestId.current) {
        return;
      }
      setProducts(rows);
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

  return { products, loading, error, reload };
}
