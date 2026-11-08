// Entrega de un pedido desde el detalle: efectivo o fiado, confirmación y
// bloqueo de doble toque. La venta la crea deliverOrder dentro de su transacción.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { deliverOrder } from '@/db/orders-deliver';
import { localDateString } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import type { OrderPaymentMethod } from '@/lib/order-types';

type Options = {
  orderId: number;
  customerName: string;
  totalCents: number;
  onDelivered: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
};

export type DeliverOrderState = {
  method: OrderPaymentMethod;
  setMethod: (method: OrderPaymentMethod) => void;
  delivering: boolean;
  error: string | null;
  clearError: () => void;
  requestDeliver: () => void;
};

export function useDeliverOrder({
  orderId,
  customerName,
  totalCents,
  onDelivered,
  onRefresh,
}: Options): DeliverOrderState {
  const db = useSQLiteContext();
  const [method, setMethod] = useState<OrderPaymentMethod>('cash');
  const [delivering, setDelivering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deliveringRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const changeMethod = useCallback((next: OrderPaymentMethod) => {
    setMethod(next);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (deliveringRef.current) {
      return;
    }
    deliveringRef.current = true;
    setDelivering(true);
    setError(null);
    try {
      await deliverOrder(
        db,
        { orderId, paymentMethod: method },
        localDateString()
      );
      await onDelivered();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo entregar el pedido. Inténtalo de nuevo.'
      );
      await onRefresh();
    } finally {
      deliveringRef.current = false;
      setDelivering(false);
    }
  }, [db, method, onDelivered, onRefresh, orderId]);

  const requestDeliver = useCallback(() => {
    if (deliveringRef.current) {
      return;
    }
    const label = method === 'cash' ? 'efectivo' : 'fiado';
    Alert.alert(
      'Entregar pedido',
      `Se registrará una venta en ${label} por ${formatCents(totalCents)} a ${customerName}. ¿Confirmas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Entregar', onPress: () => void run() },
      ]
    );
  }, [customerName, method, run, totalCents]);

  return {
    method,
    setMethod: changeMethod,
    delivering,
    error,
    clearError,
    requestDeliver,
  };
}
