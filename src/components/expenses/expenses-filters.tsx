// Filtros de gastos: fecha, categoría, estado y total activo de lo filtrado.

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DaySelector } from '@/components/summary/day-selector';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DayNavigation } from '@/hooks/use-day-navigation';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type {
  ExpenseCounts,
  ExpenseStatusFilter,
} from '@/lib/expense-view';

export type ExpenseDateMode = 'all' | 'day';

type Props = {
  status: ExpenseStatusFilter;
  onStatusChange: (status: ExpenseStatusFilter) => void;
  counts: ExpenseCounts;
  dateMode: ExpenseDateMode;
  onDateModeChange: (mode: ExpenseDateMode) => void;
  day: DayNavigation;
  categories: string[];
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  totalActiveCents: number;
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const STATUS_OPTIONS: {
  value: ExpenseStatusFilter;
  label: string;
  countKey: keyof ExpenseCounts;
}[] = [
  { value: 'all', label: 'Todos', countKey: 'all' },
  { value: 'active', label: 'Activos', countKey: 'active' },
  { value: 'void', label: 'Anulados', countKey: 'voided' },
];

function Chip({ label, selected, onPress }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <ThemedText type={selected ? 'smallBold' : 'small'}>{label}</ThemedText>
    </Pressable>
  );
}

export function ExpensesFilters({
  status,
  onStatusChange,
  counts,
  dateMode,
  onDateModeChange,
  day,
  categories,
  category,
  onCategoryChange,
  totalActiveCents,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ThemedText type="smallBold">Fecha</ThemedText>
        <View style={styles.chips}>
          <Chip
            label="Todas"
            selected={dateMode === 'all'}
            onPress={() => onDateModeChange('all')}
          />
          <Chip
            label="Por día"
            selected={dateMode === 'day'}
            onPress={() => onDateModeChange('day')}
          />
        </View>
        {dateMode === 'day' ? (
          <DaySelector
            label={day.label}
            canGoNext={day.canGoNext}
            onPrev={day.goPrev}
            onNext={day.goNext}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Categoría</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips}>
          <Chip
            label="Todas"
            selected={category === null}
            onPress={() => onCategoryChange(null)}
          />
          {categories.map((name) => (
            <Chip
              key={name}
              label={name}
              selected={category === name}
              onPress={() => onCategoryChange(name)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">Estado</ThemedText>
        <View style={styles.chips}>
          {STATUS_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={`${option.label} (${counts[option.countKey]})`}
              selected={status === option.value}
              onPress={() => onStatusChange(option.value)}
            />
          ))}
        </View>
      </View>

      <View style={[styles.total, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small">Total activo (no incluye anulados)</ThemedText>
        <ThemedText type="smallBold">{formatCents(totalActiveCents)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  categoryChips: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  total: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
