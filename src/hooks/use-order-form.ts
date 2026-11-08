// Estado del formulario de pedidos: cliente, renglones, validación y guardado.
// La pantalla no escribe SQL y el doble toque queda bloqueado.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { CustomerWithBalance } from '@/db/customers-list';
import { createOrder } from '@/db/orders-create';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useCustomers } from '@/hooks/use-customers';
import { usePurchaseProducts } from '@/hooks/use-purchase-products';
import { localDateString } from '@/lib/dates';
import { describeOrderSaveError } from '@/lib/order-form-save';
import {
  addOrderLine,
  removeOrderLine,
  selectOrderLineProduct,
  updateOrderLine,
  type OrderLinePatch,
} from '@/lib/order-form-state';
import {
  emptyOrderForm,
  emptyOrderFormErrors,
  type OrderFormValues,
} from '@/lib/order-form-types';
import { validateOrderForm } from '@/lib/order-form-validation';
import { formatCents } from '@/lib/money';
import type { NewOrderInput } from '@/lib/order-types';

export function useOrderForm(orderDate: string) {
  const db = useSQLiteContext();
  const today = localDateString();
  const { customers, loading: customersLoading, error: customersError, reload } =
    useCustomers();
  const { products, loading: productsLoading } = usePurchaseProducts();
  const [draft, setDraft] = useState<OrderFormValues>(() => emptyOrderForm(orderDate));
  const [showErrors, setShowErrors] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const lineCounter = useRef(1);

  const values = useMemo<OrderFormValues>(
    () => ({ ...draft, orderDate }),
    [draft, orderDate]
  );
  const result = useMemo(
    () => validateOrderForm(values, today),
    [values, today]
  );
  const errors = useMemo(
    () => (showErrors ? result.errors : emptyOrderFormErrors()),
    [showErrors, result.errors]
  );

  const setCustomer = useCallback((customer: CustomerWithBalance) => {
    setDraft((current) => ({
      ...current,
      customerId: customer.id,
      customerName: customer.name,
    }));
    setGeneralError('');
  }, []);

  const setDueDate = useCallback((dueDate: string) => {
    setDraft((current) => ({ ...current, dueDate }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setDraft((current) => ({ ...current, notes }));
  }, []);

  const updateLine = useCallback((key: string, patch: OrderLinePatch) => {
    setDraft((current) => updateOrderLine(current, key, patch));
  }, []);

  const addLine = useCallback(() => {
    setDraft((current) => {
      lineCounter.current += 1;
      return addOrderLine(current, `line-${lineCounter.current}`);
    });
  }, []);

  const removeLine = useCallback((key: string) => {
    setDraft((current) => removeOrderLine(current, key));
  }, []);

  const selectProduct = useCallback(
    (key: string, product: ProductWithStock | null) => {
      setDraft((current) =>
        selectOrderLineProduct(
          current,
          key,
          product
            ? { id: product.id, name: product.name, priceCents: product.price_cents }
            : null
        )
      );
    },
    []
  );

  const save = useCallback(
    async (input: NewOrderInput, totalCents: number, customerName: string) => {
      if (savingRef.current) {
        return;
      }
      savingRef.current = true;
      setSaving(true);
      setGeneralError('');
      try {
        await createOrder(db, input, today);
        Alert.alert(
          'Pedido guardado',
          `${customerName}\nTotal: ${formatCents(totalCents)}`,
          [{ text: 'Aceptar', onPress: () => router.back() }]
        );
      } catch (error) {
        setGeneralError(describeOrderSaveError(error));
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [db, today]
  );

  const requestSave = useCallback(() => {
    if (savingRef.current) {
      return;
    }
    setShowErrors(true);
    setGeneralError('');
    const check = validateOrderForm(values, today);
    if (!check.ok || !check.input) {
      return;
    }
    const input = check.input;
    const customer = values.customerName ?? 'Sin cliente';
    const due = values.dueDate.trim() || 'sin fecha';
    Alert.alert(
      'Guardar pedido',
      `${customer}\nTotal: ${formatCents(check.totalCents)}\nEntrega: ${due}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: () => void save(input, check.totalCents, customer),
        },
      ]
    );
  }, [save, today, values]);

  return {
    values,
    lines: values.lines,
    errors,
    generalError: showErrors ? generalError || result.errors.general || '' : generalError,
    products,
    productsLoading,
    customers,
    customersLoading,
    customersError,
    reloadCustomers: reload,
    saving,
    totalCents: result.totalCents,
    lineTotals: result.lineTotals,
    setCustomer,
    setDueDate,
    setNotes,
    updateLine,
    addLine,
    removeLine,
    selectProduct,
    requestSave,
  };
}
