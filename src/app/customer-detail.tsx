// Detalle de un cliente: resumen, abono e historial de movimientos.

import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerLedgerList } from '@/components/debts/customer-ledger-list';
import { DetailMessage } from '@/components/debts/detail-message';
import { voidPayment } from '@/db/payments-void';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { useTheme } from '@/hooks/use-theme';
import { buildLedgerRows, type LedgerDisplayRow } from '@/lib/ledger-rows';

const VOID_REASON = 'Abono registrado por error.';

export default function CustomerDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = Number(rawId);
  const customerId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;
  const { customer, balanceCents, ledger, loading, error, reload } =
    useCustomerDetail(customerId);
  const rows = useMemo(() => buildLedgerRows(ledger), [ledger]);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const voidingRef = useRef(false);

  const doVoid = useCallback(
    async (paymentId: number) => {
      if (voidingRef.current) return;
      voidingRef.current = true;
      setVoidingId(paymentId);
      try {
        await voidPayment(db, paymentId, VOID_REASON);
        await reload();
      } catch (caught) {
        const text = caught instanceof Error ? caught.message : '';
        Alert.alert(
          'No se pudo anular',
          text.includes('ya está anulado')
            ? 'Este abono ya estaba anulado.'
            : 'No se pudo anular el abono. Inténtalo de nuevo.'
        );
        await reload();
      } finally {
        voidingRef.current = false;
        setVoidingId(null);
      }
    },
    [db, reload]
  );

  const handleVoid = useCallback(
    (row: LedgerDisplayRow) => {
      Alert.alert('Anular abono', '¿Anular este abono?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Anular', style: 'destructive', onPress: () => void doVoid(row.id) },
      ]);
    },
    [doVoid]
  );

  if (customerId === 0) {
    return <DetailMessage text="El cliente no es válido." />;
  }
  if (loading && !customer) {
    return <DetailMessage loading />;
  }
  if (error) {
    return <DetailMessage text={error} onRetry={() => void reload()} />;
  }
  if (!customer) {
    return <DetailMessage text="No se encontró el cliente." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <CustomerLedgerList
        customer={customer}
        balanceCents={balanceCents}
        rows={rows}
        voidingId={voidingId}
        onVoid={handleVoid}
        onChanged={reload}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
});
