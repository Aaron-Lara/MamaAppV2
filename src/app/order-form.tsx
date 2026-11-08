// Pantalla para crear un pedido. Sin SQL: todo pasa por useOrderForm.

import { useCallback, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrderCustomerModal } from '@/components/orders/order-customer-modal';
import { OrderFormFooter } from '@/components/orders/order-form-footer';
import { OrderFormHeader } from '@/components/orders/order-form-header';
import { OrderLineCard } from '@/components/orders/order-line-card';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useOrderForm } from '@/hooks/use-order-form';
import { useTheme } from '@/hooks/use-theme';
import type { OrderLineForm } from '@/lib/order-form-types';

export default function OrderFormScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const day = useDayNavigation();
  const form = useOrderForm(day.date);
  const listRef = useRef<FlatList<OrderLineForm>>(null);
  const [customerOpen, setCustomerOpen] = useState(false);

  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);
  const scrollSoon = useCallback(() => {
    setTimeout(scrollToEnd, 100);
  }, [scrollToEnd]);
  const addLine = useCallback(() => {
    form.addLine();
    scrollSoon();
  }, [form, scrollSoon]);
  const openCustomers = useCallback(() => {
    Keyboard.dismiss();
    setCustomerOpen(true);
  }, []);
  const save = useCallback(() => {
    Keyboard.dismiss();
    form.requestSave();
  }, [form]);

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <FlatList
        ref={listRef}
        data={form.lines}
        keyExtractor={(line) => line.key}
        extraData={form.errors}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four + keyboardHeight },
        ]}
        ListHeaderComponent={
          <OrderFormHeader
            day={day}
            customerName={form.values.customerName}
            customerError={form.errors.customer}
            dueDate={form.values.dueDate}
            dueError={form.errors.dueDate}
            notes={form.values.notes}
            notesError={form.errors.notes}
            onOpenCustomers={openCustomers}
            onDueDateChange={form.setDueDate}
            onNotesChange={form.setNotes}
          />
        }
        renderItem={({ item, index }) => (
          <OrderLineCard
            line={item}
            index={index}
            errors={form.errors.lines[item.key]}
            lineTotalCents={form.lineTotals[item.key] ?? null}
            products={form.products}
            productsLoading={form.productsLoading}
            canRemove={form.lines.length > 1}
            onChange={(patch) => form.updateLine(item.key, patch)}
            onSelectProduct={(product) => form.selectProduct(item.key, product)}
            onRemove={() => form.removeLine(item.key)}
            onFocusLast={index === form.lines.length - 1 ? scrollSoon : undefined}
          />
        )}
        ListFooterComponent={
          <OrderFormFooter
            totalCents={form.totalCents}
            lineCount={form.lines.length}
            generalError={form.generalError}
            saving={form.saving}
            onAddLine={addLine}
            onSave={save}
          />
        }
      />

      <OrderCustomerModal
        visible={customerOpen}
        customers={form.customers}
        loading={form.customersLoading}
        error={form.customersError}
        selectedId={form.values.customerId}
        onSelect={form.setCustomer}
        onReload={form.reloadCustomers}
        onClose={() => setCustomerOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
});
