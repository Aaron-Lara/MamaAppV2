// Deshacer la última venta cobrada: solo se recuerda durante 10 segundos.
// La anulación pasa por src/db/sales-void; la pantalla no escribe SQL.

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { voidSale } from '@/db/sales-void';
import { formatCents } from '@/lib/money';

export const UNDO_WINDOW_MS = 10_000;
export const UNDO_REASON = 'Se deshizo la venta recién cobrada.';

export type UndoableSale = { saleId: number; totalCents: number };

type Options = { onVoided?: () => void };

function undoErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message.toLowerCase() : '';
  if (text.includes('ya está anulada') || text.includes('no existe')) {
    return 'Esa venta ya no se puede deshacer.';
  }
  if (text.includes('abonos')) {
    return 'Primero anula los abonos de ese cliente.';
  }
  return 'No se pudo deshacer la venta. Inténtalo de nuevo.';
}

export function useUndoSale({ onVoided }: Options = {}) {
  const db = useSQLiteContext();
  const [sale, setSale] = useState<UndoableSale | null>(null);
  const [undoing, setUndoing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const undoingRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (next: UndoableSale) => {
      clearTimer();
      setSale(next);
      timerRef.current = setTimeout(() => {
        setSale(null);
        timerRef.current = null;
      }, UNDO_WINDOW_MS);
    },
    [clearTimer]
  );

  const applyUndo = useCallback(
    async (target: UndoableSale) => {
      if (undoingRef.current) {
        return;
      }
      undoingRef.current = true;
      setUndoing(true);
      try {
        await voidSale(db, target.saleId, UNDO_REASON);
        clearTimer();
        setSale(null);
        onVoided?.();
      } catch (caught) {
        Alert.alert('No se pudo deshacer la venta', undoErrorMessage(caught), [
          { text: 'Entendido' },
        ]);
      } finally {
        undoingRef.current = false;
        setUndoing(false);
      }
    },
    [clearTimer, db, onVoided]
  );

  const undo = useCallback(() => {
    if (!sale || undoingRef.current) {
      return;
    }
    Alert.alert('Deshacer la venta', `¿Anular la venta de ${formatCents(sale.totalCents)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Deshacer', style: 'destructive', onPress: () => void applyUndo(sale) },
    ]);
  }, [applyUndo, sale]);

  // Al desenfocar (o desmontar) la pantalla, el aviso deja de tener sentido.
  useFocusEffect(
    useCallback(() => {
      return () => {
        clearTimer();
        setSale(null);
      };
    }, [clearTimer])
  );

  return { sale, undoing, start, undo };
}
