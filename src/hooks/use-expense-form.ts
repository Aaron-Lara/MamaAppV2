// Estado del formulario de gastos: validación, guardado y bloqueo de doble
// toque. La pantalla no escribe SQL.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { createExpense } from '@/db/expenses-create';
import { localDateString } from '@/lib/dates';
import {
  validateExpenseForm,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '@/lib/expense-form';
import { formatCents } from '@/lib/money';

export type ExpenseFormField = keyof ExpenseFormValues;

type Options = {
  /** Fecha elegida con el selector de día; nunca futura. */
  expenseDate: string;
};

export type ExpenseFormState = {
  values: ExpenseFormValues;
  errors: ExpenseFormErrors;
  saving: boolean;
  onChange: (field: ExpenseFormField, value: string) => void;
  save: () => Promise<boolean>;
};

export function useExpenseForm({ expenseDate }: Options): ExpenseFormState {
  const db = useSQLiteContext();
  const [values, setValues] = useState<ExpenseFormValues>({
    category: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [saving, setSaving] = useState(false);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const savingRef = useRef(false);

  const onChange = useCallback((field: ExpenseFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) {
      return false;
    }
    savingRef.current = true;
    setSaving(true);
    const today = localDateString();
    try {
      const result = validateExpenseForm(values, expenseDate, today);
      if (!result.ok || !result.input) {
        setErrors(result.errors);
        return false;
      }
      setErrors({});
      await createExpense(db, result.input, today);
      Alert.alert(
        'Gasto guardado',
        `${result.input.category} · ${formatCents(result.input.amountCents)}`,
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
      return true;
    } catch {
      setErrors({ form: 'No se pudo guardar el gasto. Inténtalo de nuevo.' });
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [db, expenseDate, values]);

  return { values, errors, saving, onChange, save };
}
