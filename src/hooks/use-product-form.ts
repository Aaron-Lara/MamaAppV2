// Estado y lógica del formulario de productos (crear y editar).
// Las pantallas no escriben SQL: el guardado pasa por src/db.

import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';

import { createProductWithStock } from '@/db/products-create';
import { updateProductWithStockCount } from '@/db/products-update';
import {
  emptyProductForm,
  getFormVisibility,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormMode,
  type ProductFormValues,
} from '@/lib/product-form';
import { mapSaveError } from '@/lib/product-form-errors';

type Options = {
  mode: ProductFormMode;
  productId?: number;
  /** Solo se usa al montar: valores iniciales al editar. */
  initialValues?: ProductFormValues;
  originalTrackStock?: boolean;
};

export function useProductForm({
  mode,
  productId,
  initialValues,
  originalTrackStock = false,
}: Options) {
  const [values, setValues] = useState<ProductFormValues>(
    () => initialValues ?? emptyProductForm()
  );
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
        if (mode === 'edit') {
          if (productId === undefined) {
            throw new Error('El producto no existe.');
          }
          await updateProductWithStockCount(db, productId, result.input, result.stockCount);
        } else {
          await createProductWithStock(db, result.input, result.stockCount ?? 0);
        }
        onSuccess();
      } catch (error) {
        setErrors(mapSaveError(error));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [mode, originalTrackStock, productId, values]
  );

  return { values, errors, visibility, saving, onChange, save };
}