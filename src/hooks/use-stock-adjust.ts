// Estado y lógica de la pantalla de ajuste de stock. No escribe SQL:
// el guardado pasa por src/db/stock-adjust.

import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { adjustStockToCount } from '@/db/stock-adjust';
import {
  mapAdjustError,
  parseCountedUnits,
  planAdjustment,
  type AdjustmentErrors,
  type AdjustmentMotive,
} from '@/lib/stock-adjust';

export type StockAdjustPreview = {
  text: string;
  difference: number;
  needsConfirmation: boolean;
};

type Options = { currentStock: number };

export function useStockAdjust({ currentStock }: Options) {
  const [countedText, setCountedText] = useState('');
  const [motive, setMotiveState] = useState<AdjustmentMotive>('count');
  const [note, setNoteState] = useState('');
  const [errors, setErrors] = useState<AdjustmentErrors>({});
  const [saving, setSaving] = useState(false);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const savingRef = useRef(false);

  const setCounted = useCallback((text: string) => {
    setCountedText(text);
    setErrors((prev) => ({ ...prev, counted: undefined, form: undefined }));
  }, []);

  const setMotive = useCallback((value: AdjustmentMotive) => {
    setMotiveState(value);
    setErrors((prev) => ({ ...prev, counted: undefined, note: undefined, form: undefined }));
  }, []);

  const setNote = useCallback((text: string) => {
    setNoteState(text);
    setErrors((prev) => ({ ...prev, note: undefined, form: undefined }));
  }, []);

  // Vista previa: solo cuando el conteo es válido y el plan se puede aplicar.
  const preview = useMemo<StockAdjustPreview | null>(() => {
    const parsed = parseCountedUnits(countedText);
    if (!parsed.ok) return null;
    const plan = planAdjustment(currentStock, parsed.value, motive, note);
    if (!plan.ok) return null;
    if (!plan.change) {
      return { text: plan.message, difference: 0, needsConfirmation: false };
    }
    const verb = plan.difference < 0 ? 'restarán' : 'sumarán';
    return {
      text: `Quedará en ${parsed.value} (se ${verb} ${Math.abs(plan.difference)})`,
      difference: plan.difference,
      needsConfirmation: plan.needsConfirmation,
    };
  }, [countedText, currentStock, motive, note]);

  const apply = useCallback(
    async (
      db: SQLiteDatabase,
      productId: number,
      countedUnits: number,
      onSuccess: () => void
    ) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaving(true);
      try {
        await adjustStockToCount(db, productId, countedUnits, motive, note);
        onSuccess();
      } catch (error) {
        setErrors(mapAdjustError(error));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [motive, note]
  );

  const save = useCallback(
    (db: SQLiteDatabase, productId: number, onSuccess: () => void) => {
      if (savingRef.current) return;
      const parsed = parseCountedUnits(countedText);
      if (!parsed.ok) {
        setErrors({ counted: parsed.error });
        return;
      }
      const plan = planAdjustment(currentStock, parsed.value, motive, note);
      if (!plan.ok) {
        setErrors(mapAdjustError(new Error(plan.error)));
        return;
      }
      setErrors({});
      if (!plan.change) {
        onSuccess();
        return;
      }
      if (!plan.needsConfirmation) {
        void apply(db, productId, parsed.value, onSuccess);
        return;
      }
      Alert.alert('Confirmar ajuste', `El stock quedará en ${parsed.value}. ¿Confirmas?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => void apply(db, productId, parsed.value, onSuccess) },
      ]);
    },
    [apply, countedText, currentStock, motive, note]
  );

  return {
    countedText,
    motive,
    note,
    errors,
    saving,
    preview,
    setCounted,
    setMotive,
    setNote,
    save,
  };
}
