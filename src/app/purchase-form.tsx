// Pantalla para registrar una compra. Sin SQL: todo pasa por los hooks.

import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PurchaseHeaderFields } from '@/components/purchases/purchase-header-fields';
import { PurchaseLineCard } from '@/components/purchases/purchase-line-card';
import { PurchaseReviewModal } from '@/components/purchases/purchase-review-modal';
import { PurchaseTotalsFooter } from '@/components/purchases/purchase-totals-footer';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { usePurchaseForm } from '@/hooks/use-purchase-form';
import { usePurchaseMeta } from '@/hooks/use-purchase-meta';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseLineForm } from '@/lib/purchase-form';
import { buildPurchaseReview } from '@/lib/purchase-review';

export default function PurchaseFormScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const day = useDayNavigation();
  const meta = usePurchaseMeta();
  const form = usePurchaseForm(day.date, meta.lastExchangeRateText);
  const listRef = useRef<FlatList<PurchaseLineForm>>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const review = useMemo(
    () =>
      buildPurchaseReview({
        dateLabel: day.label,
        values: form.values,
        lineTotals: form.lineTotals,
        totalCents: form.totalCents,
        totalMxnCents: form.totalMxnCents,
      }),
    [day.label, form.values, form.lineTotals, form.totalCents, form.totalMxnCents]
  );

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
  const openReview = useCallback(() => {
    if (saved || !form.validateForReview()) return;
    Keyboard.dismiss();
    setReviewOpen(true);
  }, [form, saved]);
  const backToEdit = useCallback(() => {
    if (!form.saving) setReviewOpen(false);
  }, [form.saving]);
  const confirmReview = useCallback(async () => {
    if (saved || form.saving) {
      return;
    }
    const ok = await form.save();
    setReviewOpen(false);
    if (ok) {
      setSaved(true);
    }
  }, [form, saved]);

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
          <PurchaseHeaderFields
            day={day}
            stores={meta.stores}
            store={form.values.store}
            currency={form.values.currency}
            exchangeRate={form.values.exchangeRate}
            storeError={form.errors.store}
            rateError={form.errors.exchangeRate}
            onStoreChange={form.setStore}
            onCurrencyChange={form.setCurrency}
            onExchangeRateChange={form.setExchangeRate}
          />
        }
        renderItem={({ item, index }) => (
          <PurchaseLineCard
            line={item}
            index={index}
            errors={form.errors.lines[item.key]}
            totals={form.lineTotals[item.key]}
            currency={form.values.currency}
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
          <PurchaseTotalsFooter
            currency={form.values.currency}
            totalCents={form.totalCents}
            totalMxnCents={form.totalMxnCents}
            lineCount={form.lines.length}
            generalError={form.errors.general ?? form.generalError}
            saving={form.saving || saved}
            onAddLine={addLine}
            onReview={openReview}
          />
        }
      />

      <PurchaseReviewModal
        visible={reviewOpen}
        review={review}
        saving={form.saving}
        onBack={backToEdit}
        onConfirm={confirmReview}
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
