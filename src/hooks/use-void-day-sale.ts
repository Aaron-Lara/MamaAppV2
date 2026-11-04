// Anulación de una venta desde la lista del Resumen.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { voidSale } from '@/db/sales-void';
import type { DaySaleRow } from '@/lib/day-sales-rows';
import {
  SUMMARY_SALE_TEXTS,
  translateVoidSaleError,
  VOID_FROM_SUMMARY_REASON,
  voidConfirmMessage,
} from '@/lib/sale-void-messages';

type Options = {
  isOtherDay: boolean;
  onVoided?: () => void;
};

export type VoidDaySaleState = {
  voidingId: number | null;
  requestVoid: (row: DaySaleRow) => void;
};

export function useVoidDaySale({ isOtherDay, onVoided }: Options): VoidDaySaleState {
  const db = useSQLiteContext();
  const [voidingId, setVoidingId] = useState<number | null>(null);
  // Se activa al confirmar, no al abrir el Alert: Cancelar no deja bloqueado.
  const voidingRef = useRef(false);

  const applyVoid = useCallback(
    async (row: DaySaleRow) => {
      if (voidingRef.current) {
        return;
      }
      voidingRef.current = true;
      setVoidingId(row.id);
      try {
        await voidSale(db, row.id, VOID_FROM_SUMMARY_REASON);
        onVoided?.();
      } catch (caught) {
        Alert.alert(
          'No se pudo anular la venta',
          translateVoidSaleError(caught, SUMMARY_SALE_TEXTS),
          [{ text: 'Entendido' }]
        );
      } finally {
        voidingRef.current = false;
        setVoidingId(null);
      }
    },
    [db, onVoided]
  );

  const requestVoid = useCallback(
    (row: DaySaleRow) => {
      if (voidingRef.current) {
        return;
      }
      Alert.alert('Anular venta', voidConfirmMessage(row.totalCents, isOtherDay), [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Anular',
          style: 'destructive',
          onPress: () => void applyVoid(row),
        },
      ]);
    },
    [applyVoid, isOtherDay]
  );

  return { voidingId, requestVoid };
}
