// Carga del detalle de un cliente: datos, saldo e historial de movimientos.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getCustomerBalance } from '@/db/balances';
import { listCustomerLedger, type LedgerItem } from '@/db/customer-ledger';
import { getCustomer, type CustomerSummary } from '@/db/customers-get';

export type CustomerDetailData = {
  customer: CustomerSummary | null;
  balanceCents: number;
  ledger: LedgerItem[];
  loading: boolean;
  error: string | null;
};

const LOAD_ERROR = 'No se pudo cargar el detalle del cliente.';

const EMPTY: CustomerDetailData = {
  customer: null,
  balanceCents: 0,
  ledger: [],
  loading: true,
  error: null,
};

export function useCustomerDetail(customerId: number) {
  const db = useSQLiteContext();
  const [data, setData] = useState<CustomerDetailData>(EMPTY);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = ++requestId.current;
    // Solo se muestra el indicador en la primera carga de la pantalla.
    if (request === 1) {
      setData((previous) => ({ ...previous, loading: true }));
    }
    try {
      const customer = await getCustomer(db, customerId);
      if (request !== requestId.current) {
        return;
      }
      if (!customer) {
        setData({ customer: null, balanceCents: 0, ledger: [], loading: false, error: null });
        return;
      }
      const [balanceCents, ledger] = await Promise.all([
        getCustomerBalance(db, customerId),
        listCustomerLedger(db, customerId),
      ]);
      if (request !== requestId.current) {
        return;
      }
      setData({ customer, balanceCents, ledger, loading: false, error: null });
    } catch {
      if (request === requestId.current) {
        setData((previous) => ({ ...previous, loading: false, error: LOAD_ERROR }));
      }
    }
  }, [db, customerId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { ...data, reload };
}
