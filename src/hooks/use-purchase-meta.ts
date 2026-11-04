// Tiendas usadas y último tipo de cambio para el formulario de compras.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { getLastExchangeRate, listStoreNames } from '@/db/purchases-meta';
import { exchangeRateToInputText } from '@/lib/purchase-form';

export function usePurchaseMeta(): {
  stores: string[];
  lastExchangeRateText: string;
  loading: boolean;
} {
  const db = useSQLiteContext();
  const [stores, setStores] = useState<string[]>([]);
  const [lastExchangeRateText, setLastExchangeRateText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [names, rate] = await Promise.all([
        listStoreNames(db),
        getLastExchangeRate(db),
      ]);
      setStores(names);
      setLastExchangeRateText(rate === null ? '' : exchangeRateToInputText(rate));
    } catch {
      setStores([]);
      setLastExchangeRateText('');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { stores, lastExchangeRateText, loading };
}
