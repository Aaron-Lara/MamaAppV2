import { useCallback, useRef, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { createProductWithStock } from '@/db/products-create';
import {
  emptyProductForm,
  getFormVisibility,
  type ProductFormErrors,
  type ProductFormMode,
  type ProductFormValues,
  validateProductForm,
} from '@/lib/product-form';

export function useProductForm(mode: ProductFormMode = 'create', originalTrackStock: boolean = false) {
  const [values, setValues] = useState<ProductFormValues>(emptyProductForm());
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const isSaving = useRef(false);

  const onChange = (field: keyof ProductFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const visibility = getFormVisibility(values, mode, originalTrackStock);

  const save = useCallback(
    async (db: SQLiteDatabase, onSuccess: () => void) => {
      if (isSaving.current) return;
      isSaving.current = true;

      const validation = validateProductForm(values, mode, originalTrackStock);
      if (!validation.ok) {
        setErrors(validation.errors);
        isSaving.current = false;
        return;
      }

      try {
        await createProductWithStock(db, validation.input, validation.stockCount ?? 0);
        onSuccess();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado';
        if (message.toLowerCase().includes('nombre')) {
          setErrors({ name: message });
        } else if (message === 'El producto no existe.') {
          setErrors({ form: message });
        } else {
          setErrors({ form: 'No se pudo guardar el producto. Inténtalo más tarde.' });
        }
      } finally {
        isSaving.current = false;
      }
    },
    [mode, originalTrackStock, values]
  );

  return { values, errors, visibility, onChange, save };
}
