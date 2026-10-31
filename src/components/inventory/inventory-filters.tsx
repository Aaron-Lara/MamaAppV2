// Barra superior de la lista de inventario: búsqueda, filtros e interruptor.

import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { InventoryFilter } from '@/lib/inventory-rules';
import type { InventoryCounts } from '@/lib/inventory-view';

const FILTERS: { value: InventoryFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'low', label: 'Por agotarse' },
  { value: 'out', label: 'Agotados' },
];

export type InventoryFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filter: InventoryFilter;
  onFilterChange: (filter: InventoryFilter) => void;
  showInactive: boolean;
  onShowInactiveChange: (value: boolean) => void;
  counts: InventoryCounts;
};

export function InventoryFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  showInactive,
  onShowInactiveChange,
  counts,
}: InventoryFiltersProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={onQueryChange}
        placeholder="Buscar producto"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Buscar producto"
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
              accessibilityLabel={`${option.label}: ${counts[option.value]} productos`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type={selected ? 'smallBold' : 'small'}>
                {option.label} ({counts[option.value]})
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onShowInactiveChange(!showInactive)}
        accessibilityRole="switch"
        accessibilityState={{ checked: showInactive }}
        accessibilityLabel="Mostrar desactivados"
        style={({ pressed }) => [styles.switchRow, { opacity: pressed ? 0.7 : 1 }]}>
        <ThemedText>Mostrar desactivados</ThemedText>
        <Switch value={showInactive} pointerEvents="none" />
      </Pressable>
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
  switchRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
