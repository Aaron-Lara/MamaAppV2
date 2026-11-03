// Lista del historial del cliente con el encabezado de abono.

import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomerDetailHeader } from '@/components/debts/customer-detail-header';
import { LedgerRow } from '@/components/debts/ledger-row';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CustomerSummary } from '@/db/customers-get';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import type { LedgerDisplayRow } from '@/lib/ledger-rows';

type Props = {
  customer: CustomerSummary;
  balanceCents: number;
  rows: LedgerDisplayRow[];
  voidingId: number | null;
  onVoid: (row: LedgerDisplayRow) => void;
  onChanged: () => Promise<void>;
};

export function CustomerLedgerList({
  customer,
  balanceCents,
  rows,
  voidingId,
  onVoid,
  onChanged,
}: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const listRef = useRef<FlatList<LedgerDisplayRow>>(null);

  const handleFieldFocus = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
  }, []);

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={({ item }) => (
        <LedgerRow row={item} voiding={voidingId === item.id} onVoid={onVoid} />
      )}
      ListHeaderComponent={
        <CustomerDetailHeader
          name={customer.name}
          customerId={customer.id}
          balanceCents={balanceCents}
          onChanged={onChanged}
          onFieldFocus={handleFieldFocus}
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <ThemedText type="small" themeColor="textSecondary">
            Sin movimientos todavía.
          </ThemedText>
        </View>
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + Spacing.four + keyboardHeight },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
});
