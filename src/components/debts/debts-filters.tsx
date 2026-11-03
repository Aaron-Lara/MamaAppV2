// Búsqueda y filtros de la lista de Fiados.

import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { DebtFilter } from '@/hooks/use-debtors';
import { useTheme } from '@/hooks/use-theme';

const FILTERS: { value: DebtFilter; label: string }[] = [
  { value: 'debt', label: 'Con deuda' },
  { value: 'all', label: 'Todos' },
];

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: DebtFilter;
  onFilterChange: (filter: DebtFilter) => void;
};

export function DebtsFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Buscar cliente"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Buscar cliente"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        underlineColorAndroid="transparent"
        style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      <View style={styles.chips}>
        {FILTERS.map((option) => {
          const selected = option.value === filter;
          return (
            <Pressable
              key={option.value}
              onPress={() => onFilterChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type={selected ? 'smallBold' : 'small'}>{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  search: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
