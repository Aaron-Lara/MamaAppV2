// Carga de clientes con su deuda y antigüedad para la pestaña de Fiados.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { listDebtors } from '@/db/balances';
import { listCustomersWithBalance } from '@/db/customers-list';
import { listDebtAgeInputs } from '@/db/customer-ledger';
import { localDateString } from '@/lib/dates';
import { buildDebtorRows, toCustomerWithBalance, type DebtorRow } from '@/lib/debtor-rows';

export type DebtFilter = 'debt' | 'all';

export type DebtorsData = {
  rows: DebtorRow[];
  loading: boolean;
  error: string | null;
};

const LOAD_ERROR = 'No se pudieron cargar los datos.';

export function useDebtors(filter: DebtFilter) {
  const db = useSQLiteContext();
  const [data, setData] = useState<DebtorsData>({ rows: [], loading: true, error: null });
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = ++requestId.current;
    // Solo se muestra el indicador en la primera carga de la pantalla.
    if (request === 1) {
      setData((previous) => ({ ...previous, loading: true }));
    }
    try {
      const [customers, debtInputs] = await Promise.all([
        filter === 'debt'
          ? listDebtors(db).then((debtors) => debtors.map(toCustomerWithBalance))
          : listCustomersWithBalance(db),
        listDebtAgeInputs(db),
      ]);
      if (request !== requestId.current) {
        return;
      }
      setData({
        rows: buildDebtorRows(customers, debtInputs, localDateString()),
        loading: false,
        error: null,
      });
    } catch {
      if (request === requestId.current) {
        setData({ rows: [], loading: false, error: LOAD_ERROR });
      }
    }
  }, [db, filter]);

  // NativeTabs deja la pantalla montada: se recarga cada vez que recibe foco.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { ...data, reload };
}
