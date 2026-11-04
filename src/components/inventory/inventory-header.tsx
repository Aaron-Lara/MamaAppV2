// Encabezado de Inventario: título, botón de compras y nuevo producto.

import { StyleSheet, View } from 'react-native';

import { InventoryCreateButton } from '@/components/inventory/inventory-create-button';
import { InventoryPurchasesButton } from '@/components/inventory/inventory-purchases-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export function InventoryHeader() {
  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">Inventario</ThemedText>
      <View style={styles.actions}>
        <InventoryPurchasesButton />
        <InventoryCreateButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
