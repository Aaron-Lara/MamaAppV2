// Barra superior de Vender: búsqueda y categorías como etiquetas.

import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CategoryOption = { value: string | null; label: string };

export type SellFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: readonly string[];
  category: string | null;
  onCategoryChange: (value: string | null) => void;
};

export function SellFilters({
  query,
  onQueryChange,
  categories,
  category,
  onCategoryChange,
}: SellFiltersProps) {
  const theme = useTheme();
  const options = useMemo<CategoryOption[]>(
    () => [
      { value: null, label: 'Todas' },
      ...categories.map((label) => ({ value: label, label })),
    ],
    [categories]
  );

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

      <FlatList
        horizontal
        data={options}
        keyExtractor={(option) => option.value ?? 'all'}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => {
          const selected = item.value === category;
          return (
            <Pressable
              onPress={() => onCategoryChange(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Categoría ${item.label}`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type={selected ? 'smallBold' : 'small'}>{item.label}</ThemedText>
            </Pressable>
          );
        }}
      />
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
    gap: Spacing.two,
    paddingRight: Spacing.three,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
