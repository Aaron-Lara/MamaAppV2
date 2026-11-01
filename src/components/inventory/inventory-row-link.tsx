// Fila de inventario pulsable: abre la edición del producto.

import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { InventoryRowItem } from '@/components/inventory/inventory-row';
import type { InventoryRow } from '@/lib/inventory-view';

export function InventoryRowLink({ row }: { row: InventoryRow }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Editar ${row.product.name}`}
      onPress={() =>
        router.push({ pathname: '/product-form', params: { id: String(row.product.id) } })
      }
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <InventoryRowItem row={row} />
    </Pressable>
  );
}