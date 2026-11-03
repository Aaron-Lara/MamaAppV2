import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { listDebtors } from '@/db/balances';
import { listCustomersWithBalance, CustomerWithBalance } from '@/db/customers-list';
import { listDebtAgeInputs, DebtInput } from '@/db/customer-ledger';
import { buildDebtorRows, DebtorRow } from '@/lib/debtor-rows';
import { localDateString } from '@/lib/dates';

export function useDebtors(filter: 'debt' | 'all') {
  const db = useSQLiteContext();
  const [data, setData] = useState<{ rows: DebtorRow[], loading: boolean, error: string | null }>({ rows: [], loading: true, error: null });
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const request = ++requestId.current;
    if (request === 1) setData(prev => ({ ...prev, loading: true }));
    try {
      const [customers, debtInputs] = await Promise.all([
        filter === 'debt' ? listDebtors(db).then(d => d.map(x => ({ ...x, balanceCents: x.balanceCents }))) : listCustomersWithBalance(db),
        listDebtAgeInputs(db),
      ]);
      if (request !== requestId.current) return;
      setData({ rows: buildDebtorRows(customers as CustomerWithBalance[], debtInputs as DebtInput, localDateString()), loading: false, error: null });
    } catch {
      if (request === requestId.current) setData({ rows: [], loading: false, error: 'No se pudieron cargar los datos.' });
    }
  }, [db, filter]);

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  return { ...data, reload };
}
