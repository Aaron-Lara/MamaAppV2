// Cancelación de un pedido: solo confirmación y sin borrar.
// La fecha la guarda cancelOrder en la base.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { cancelOrder } from '@/db/orders-cancel';
import { localDateString } from '@/lib/dates';

type Options = {
  orderId: number;
  onCancelled: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export type CancelOrderState = {
  cancelling: boolean;
  error: string | null;
  clearError: () => void;
  requestCancel: () => void;
};

export function useCancelOrder({
  orderId,
  onCancelled,
  onRefresh,
}: Options): CancelOrderState {
  const db = useSQLiteContext();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancellingRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const run = useCallback(async () => {
    if (cancellingRef.current) {
      return;
    }
    cancellingRef.current = true;
    setCancelling(true);
    setError(null);
    try {
      await cancelOrder(db, { orderId }, localDateString());
      await onCancelled();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo cancelar el pedido. Inténtalo de nuevo.'
      );
      await onRefresh();
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  }, [db, onCancelled, onRefresh, orderId]);

  const requestCancel = useCallback(() => {
    void run();
  }, [run]);

  return {
    cancelling,
    error,
    clearError,
    requestCancel,
  };
}
