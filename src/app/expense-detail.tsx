// Detalle de un gasto: datos, estado y anulación con motivo.

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailMessage } from '@/components/debts/detail-message';
import { ExpenseDetailSummary } from '@/components/expenses/expense-detail-summary';
import { ExpenseVoidModal } from '@/components/expenses/expense-void-modal';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useExpenseDetail } from '@/hooks/use-expense-detail';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/dates';
import { buildExpenseDetailHeader } from '@/lib/expense-view';

export default function ExpenseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const statusColors = useStatusColors();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = Number(rawId);
  const expenseId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;

  const { detail, loading, error, reload } = useExpenseDetail(expenseId);
  const today = localDateString();
  const header = useMemo(
    () => (detail ? buildExpenseDetailHeader(detail, today) : null),
    [detail, today]
  );
  const [voidOpen, setVoidOpen] = useState(false);

  const handleVoided = useCallback(() => reload(), [reload]);

  if (expenseId === 0) {
    return <DetailMessage text="El gasto no es válido." />;
  }
  if (loading && !detail) {
    return <DetailMessage loading />;
  }
  if (error && !detail) {
    return <DetailMessage text={error} onRetry={() => void reload()} />;
  }
  if (!detail || !header) {
    return <DetailMessage text="No se encontró ese gasto." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <ExpenseDetailSummary header={header} />

        {header.isVoid ? null : (
          <Pressable
            onPress={() => setVoidOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Anular gasto"
            style={({ pressed }) => [
              styles.voidButton,
              {
                backgroundColor: theme.backgroundElement,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <ThemedText type="smallBold" style={{ color: statusColors.error }}>
              Anular gasto
            </ThemedText>
          </Pressable>
        )}
      </ScrollView>

      <ExpenseVoidModal
        visible={voidOpen && !header.isVoid}
        expenseId={expenseId}
        category={header.categoryLabel}
        amountCents={detail.amountCents}
        onClose={() => setVoidOpen(false)}
        onVoided={handleVoided}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  voidButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
