// Anulación de una compra desde su detalle. La compra nunca se borra.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { voidPurchase } from '@/db/purchases-void';
import {
  PURCHASE_VOID_REASON,
  purchaseVoidConfirmMessage,
  translateVoidPurchaseError,
} from '@/lib/purchase-void-messages';

type Options = {
  purchaseId: number;
  totalMxnCents: number;
  onVoided: () => void | Promise<void>;
};

export type VoidPurchaseState = {
  voiding: boolean;
  requestVoid: () => void;
};

export function useVoidPurchase({
  purchaseId,
  totalMxnCents,
  onVoided,
}: Options): VoidPurchaseState {
  const db = useSQLiteContext();
  const [voiding, setVoiding] = useState(false);
  // Se activa al confirmar, no al abrir el Alert: Cancelar no bloquea.
  const voidingRef = useRef(false);

  const applyVoid = useCallback(async () => {
    if (voidingRef.current) {
      return;
    }
    voidingRef.current = true;
    setVoiding(true);
    try {
      await voidPurchase(db, purchaseId, PURCHASE_VOID_REASON);
      await onVoided();
    } catch (caught) {
      Alert.alert(
        'No se pudo anular la compra',
        translateVoidPurchaseError(caught),
        [{ text: 'Entendido' }]
      );
      await onVoided();
    } finally {
      voidingRef.current = false;
      setVoiding(false);
    }
  }, [db, onVoided, purchaseId]);

  const requestVoid = useCallback(() => {
    if (voidingRef.current) {
      return;
    }
    Alert.alert('Anular compra', purchaseVoidConfirmMessage(totalMxnCents), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Anular',
        style: 'destructive',
        onPress: () => void applyVoid(),
      },
    ]);
  }, [applyVoid, totalMxnCents]);

  return { voiding, requestVoid };
}
