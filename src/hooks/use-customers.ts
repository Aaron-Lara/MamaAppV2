// Clientes con su saldo para el cobro fiado. Las pantallas no escriben SQL.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import {
  listCustomersWithBalance,
  type CustomerWithBalance,
} from '@/db/customers-list';

const LOAD_ERROR = 'No se pudieron cargar los clientes.';

export type Customers = {
  customers: CustomerWithBalance[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useCustomers(): Customers {
  const db = useSQLiteContext();
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Descarta respuestas de recargas anteriores que lleguen tarde.
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = requestId.current + 1;
    requestId.current = request;
    setLoading(true);
    try {
      const rows = await listCustomersWithBalance(db);
      if (request !== requestId.current) {
        return;
      }
      setCustomers(rows);
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

  // Los saldos cambian con abonos y ventas: se recargan al volver a la pantalla.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { customers, loading, error, reload };
}
