// Detalle de un pedido. Se recarga al enfocar y después de entregar o cancelar.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { getOrder } from '@/db/orders-get';
import { localDateString } from '@/lib/dates';
import type { OrderDetail } from '@/lib/order-types';

const LOAD_ERROR = 'No se pudo cargar el pedido.';
const MISSING_ERROR = 'No se encontró ese pedido.';

export type OrderDetailState = {
  detail: OrderDetail | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useOrderDetail(orderId: number): OrderDetailState {
  const db = useSQLiteContext();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(orderId > 0);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    if (orderId <= 0) {
      setDetail(null);
      setLoading(false);
      setError(null);
      return;
    }
    const request = requestId.current + 1;
    requestId.current = request;
    setError(null);
    try {
      const next = await getOrder(db, orderId, localDateString());
      if (request !== requestId.current) {
        return;
      }
      setDetail(next);
      if (!next) {
        setError(MISSING_ERROR);
      }
    } catch {
      if (request === requestId.current) {
        setError(LOAD_ERROR);
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false);
      }
    }
  }, [db, orderId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return { detail, loading, error, reload };
}
