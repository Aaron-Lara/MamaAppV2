// Productos activos para buscar en los renglones de una compra.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { listProductsWithStock, type ProductWithStock } from '@/db/products-with-stock';

export function usePurchaseProducts(): {
  products: ProductWithStock[];
  loading: boolean;
} {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setProducts(await listProductsWithStock(db));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { products, loading };
}
