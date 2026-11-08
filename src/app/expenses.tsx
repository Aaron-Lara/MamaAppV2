// Historial de gastos: lista, filtros de fecha/categoría/estado y alta.
// Las pantallas no escriben SQL: todo pasa por los hooks.

import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseRow } from '@/components/expenses/expense-row';
import {
  ExpensesFilters,
  type ExpenseDateMode,
} from '@/components/expenses/expenses-filters';
import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useExpenses } from '@/hooks/use-expenses';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/dates';
import type { ExpenseStatusFilter } from '@/lib/expense-view';
import {
  activeExpenseTotalCents,
  buildExpenseRows,
  countExpenses,
  expenseCategoryOptions,
  filterExpenses,
} from '@/lib/expense-view';

function emptyMessage(
  status: ExpenseStatusFilter,
  dateMode: ExpenseDateMode,
  category: string | null
): string {
  if (category) {
    return 'No hay gastos de esa categoría.';
  }
  if (dateMode === 'day') {
    return 'No hay gastos ese día.';
  }
  if (status === 'active') {
    return 'No hay gastos activos.';
  }
  if (status === 'void') {
    return 'No hay gastos anulados.';
  }
  return 'Todavía no hay gastos.';
}

export default function ExpensesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, loading, error, reload } = useExpenses();
  const day = useDayNavigation();
  const [status, setStatus] = useState<ExpenseStatusFilter>('all');
  const [dateMode, setDateMode] = useState<ExpenseDateMode>('all');
  const [category, setCategory] = useState<string | null>(null);

  const today = localDateString();
  const date = dateMode === 'day' ? day.date : null;

  const categories = useMemo(() => expenseCategoryOptions(items), [items]);
  // Base: fecha y categoría, con todos los estados para calcular los conteos.
  const base = useMemo(
    () => filterExpenses(items, { status: 'all', date, category }),
    [items, date, category]
  );
  const counts = useMemo(() => countExpenses(base), [base]);
  const visible = useMemo(
    () => filterExpenses(base, { status, date: null, category: null }),
    [base, status]
  );
  const totalActiveCents = useMemo(() => activeExpenseTotalCents(visible), [visible]);
  const rows = useMemo(() => buildExpenseRows(visible, today), [visible, today]);
  const firstLoad = loading && items.length === 0;

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ExpensesFilters
          status={status}
          onStatusChange={setStatus}
          counts={counts}
          dateMode={dateMode}
          onDateModeChange={setDateMode}
          day={day}
          categories={categories}
          category={category}
          onCategoryChange={setCategory}
          totalActiveCents={totalActiveCents}
        />
      </View>

      {firstLoad ? (
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={theme.text}
            accessibilityLabel="Cargando gastos"
          />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <RetryBlock message={error} onRetry={() => void reload()} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => String(row.id)}
          renderItem={({ item }) => <ExpenseRow row={item} />}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.emptyText}>
                {emptyMessage(status, dateMode, category)}
              </ThemedText>
            </View>
          }
        />
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.background,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}>
        <Pressable
          onPress={() => router.push('/expense-form' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Nuevo gasto"
          style={({ pressed }) => [
            styles.newButton,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.background }}>
            + Nuevo gasto
          </ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  emptyText: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  newButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
