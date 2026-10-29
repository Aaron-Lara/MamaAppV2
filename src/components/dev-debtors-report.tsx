// TEMPORAL: muestra el saldo de "TEST cliente" y la lista de deudores.

import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getCustomerBalance, listDebtors, type Debtor } from '@/db/balances';
import { findCustomerByName } from '@/db/customers';
import { formatCents } from '@/lib/money';

const TEST_CUSTOMER = 'TEST cliente';

type Props = { refreshKey: number };

export function DevDebtorsReport({ refreshKey }: Props) {
  const db = useSQLiteContext();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [testBalance, setTestBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [rows, customer] = await Promise.all([
          listDebtors(db),
          findCustomerByName(db, TEST_CUSTOMER),
        ]);
        const balance = customer ? await getCustomerBalance(db, customer.id) : null;
        if (!active) return;
        setDebtors(rows);
        setTestBalance(balance);
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error al leer deudores');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [db, refreshKey]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">Fiados</ThemedText>
      <ThemedText type="small">
        {testBalance === null
          ? `${TEST_CUSTOMER}: no existe`
          : `${TEST_CUSTOMER}: Debe ${formatCents(testBalance)}`}
      </ThemedText>
      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
      {debtors.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Nadie debe.
        </ThemedText>
      ) : (
        debtors.map((debtor) => (
          <ThemedText key={debtor.customerId} type="small" themeColor="textSecondary">
            {debtor.name}: Debe {formatCents(debtor.balanceCents)}
          </ThemedText>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  error: { color: '#d93025' },
});
