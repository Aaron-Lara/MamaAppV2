// Elección de cliente dentro del mismo modal, con búsqueda y alta rápida.

import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { CustomerPickerStatus } from '@/components/sell/customer-picker-status';
import { CustomerRow } from '@/components/sell/customer-row';
import { ModalFooter } from '@/components/sell/modal-footer';
import { PickerHeader } from '@/components/sell/picker-header';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useTheme } from '@/hooks/use-theme';
import { matchesSearch } from '@/lib/inventory-rules';

export type CustomerPickerProps = {
  customers: readonly CustomerWithBalance[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  onSelect: (customer: CustomerWithBalance) => void;
  onCreate: (name: string) => void;
  onBack: () => void;
  onRetry: () => void;
};

export function CustomerPicker({
  customers,
  loading,
  error,
  selectedId,
  onSelect,
  onCreate,
  onBack,
  onRetry,
}: CustomerPickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();
  const filtered = customers.filter((customer) => matchesSearch(customer.name, trimmed));
  // Sin resultados, el botón crea un cliente con el texto buscado.
  const createFromSearch = trimmed !== '' && filtered.length === 0;
  const createLabel = createFromSearch ? `Crear "${trimmed}"` : 'Crear cliente';

  return (
    <View style={styles.container}>
      <PickerHeader title="Elegir cliente" onBack={onBack} />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar cliente"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Buscar cliente"
        autoCorrect={false}
        style={[
          styles.search,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
      />

      {loading || error ? (
        <CustomerPickerStatus loading={loading} error={error} onRetry={onRetry} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(customer) => String(customer.id)}
          keyboardShouldPersistTaps="handled"
          style={styles.list}
          contentContainerStyle={styles.content}
          ListEmptyComponent={
            <View style={styles.centered}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                {trimmed === ''
                  ? 'Todavía no hay clientes.'
                  : 'No hay clientes con esa búsqueda.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <CustomerRow
              customer={item}
              selected={item.id === selectedId}
              onPress={() => onSelect(item)}
            />
          )}
        />
      )}

      <ModalFooter>
        <Pressable
          onPress={() => onCreate(createFromSearch ? trimmed : '')}
          accessibilityRole="button"
          accessibilityLabel={createLabel}
          style={({ pressed }) => [
            styles.create,
            { backgroundColor: theme.text, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold" numberOfLines={1} style={{ color: theme.background }}>
            {createLabel}
          </ThemedText>
        </Pressable>
      </ModalFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  search: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  centeredText: {
    textAlign: 'center',
  },
  create: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
