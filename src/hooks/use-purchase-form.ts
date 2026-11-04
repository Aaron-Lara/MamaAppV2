// Estado del formulario de compras: renglones, validación, guardado y bloqueo
// de doble toque. La pantalla no escribe SQL.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { createPurchase } from '@/db/purchases-create';
import type { ProductWithStock } from '@/db/products-with-stock';
import { usePurchaseProducts } from '@/hooks/use-purchase-products';
import { formatCents } from '@/lib/money';
import {
  emptyPurchaseErrors,
  emptyPurchaseForm,
  validatePurchaseForm,
  type PurchaseFormValues,
} from '@/lib/purchase-form';
import { describePurchaseSaveError } from '@/lib/purchase-form-save';
import {
  addPurchaseLine,
  changePurchaseCurrency,
  removePurchaseLine,
  selectPurchaseLineProduct,
  updatePurchaseLine,
  withLineProductError,
  type PurchaseLinePatch,
} from '@/lib/purchase-form-state';
import type { PurchaseCurrency } from '@/lib/purchase-types';

export function usePurchaseForm(purchaseDate: string, lastExchangeRateText: string) {
  const db = useSQLiteContext();
  const { products, loading: productsLoading } = usePurchaseProducts();
  const [values, setValues] = useState<PurchaseFormValues>(emptyPurchaseForm);
  const [showErrors, setShowErrors] = useState(false);
  const [dbError, setDbError] = useState<{ key: string; message: string } | null>(null);
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const lineCounter = useRef(1);
  const result = useMemo(
    () => validatePurchaseForm(values, purchaseDate),
    [values, purchaseDate]
  );
  const errors = useMemo(() => {
    if (!showErrors) {
      return emptyPurchaseErrors();
    }
    return dbError
      ? withLineProductError(result.errors, dbError.key, dbError.message)
      : result.errors;
  }, [showErrors, result.errors, dbError]);
  const setStore = useCallback((store: string) => {
    setValues((current) => ({ ...current, store }));
  }, []);
  const setExchangeRate = useCallback((exchangeRate: string) => {
    setValues((current) => ({ ...current, exchangeRate }));
  }, []);
  const setCurrency = useCallback(
    (currency: PurchaseCurrency) => {
      setValues((current) =>
        changePurchaseCurrency(current, currency, lastExchangeRateText)
      );
      setDbError(null);
    },
    [lastExchangeRateText]
  );
  const updateLine = useCallback((key: string, patch: PurchaseLinePatch) => {
    setValues((current) => updatePurchaseLine(current, key, patch));
    setDbError((current) => (current?.key === key ? null : current));
  }, []);
  const addLine = useCallback(() => {
    setValues((current) => {
      lineCounter.current += 1;
      return addPurchaseLine(current, `line-${lineCounter.current}`);
    });
  }, []);
  const removeLine = useCallback((key: string) => {
    setValues((current) => removePurchaseLine(current, key));
    setDbError((current) => (current?.key === key ? null : current));
  }, []);
  const selectProduct = useCallback((key: string, product: ProductWithStock | null) => {
    setValues((current) =>
      selectPurchaseLineProduct(
        current,
        key,
        product
          ? { id: product.id, name: product.name, trackStock: product.track_stock === 1 }
          : null
      )
    );
    setDbError((current) => (current?.key === key ? null : current));
  }, []);
  const save = useCallback(async () => {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setShowErrors(true);
    setGeneralError('');
    setDbError(null);
    try {
      const check = validatePurchaseForm(values, purchaseDate);
      if (!check.ok || !check.input) {
        return;
      }
      await createPurchase(db, check.input, purchaseDate);
      Alert.alert(
        'Compra guardada',
        `Total en pesos: ${formatCents(check.totalMxnCents)}`,
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch (error) {
      const failure = describePurchaseSaveError(error, values.lines);
      if (failure.lineKey) {
        setDbError({ key: failure.lineKey, message: failure.message });
        return;
      }
      setGeneralError(failure.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [db, purchaseDate, values]);
  return {
    values,
    lines: values.lines,
    errors,
    generalError,
    products,
    productsLoading,
    saving,
    totalCents: result.totalCents,
    totalMxnCents: result.totalMxnCents,
    lineTotals: result.lines,
    setStore,
    setCurrency,
    setExchangeRate,
    updateLine,
    addLine,
    removeLine,
    selectProduct,
    save,
  };
}
