// Estado y lógica del formulario de productos (modo crear).
// Las pantallas no escriben SQL: el guardado pasa por src/db.

import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { createProductWithStock } from '@/db/products-create';
import {
  emptyProductForm,
  getFormVisibility,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormMode,
  type ProductFormValues,
} from '@/lib/product-form';
import { mapSaveError } from '@/lib/product-form-errors';

export function useProductForm(mode: ProductFormMode = 'create', originalTrackStock = false) {
  const [values, setValues] = useState<ProductFormValues>(emptyProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const savingRef = useRef(false);

  const onChange = useCallback((field: keyof ProductFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }, []);

  const visibility = getFormVisibility(values, mode, originalTrackStock);

  const save = useCallback(
    async (db: SQLiteDatabase, onSuccess: () => void) => {
      if (savingRef.current) {
        return;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        const result = validateProductForm(values, mode, originalTrackStock);
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        setErrors({});
        await createProductWithStock(db, result.input, result.stockCount ?? 0);
        onSuccess();
      } catch (error) {
        setErrors(mapSaveError(error));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [mode, originalTrackStock, values]
  );

  return { values, errors, visibility, saving, onChange, save };
}