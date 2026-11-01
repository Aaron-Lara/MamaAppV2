// Ruta del formulario: sin id crea un producto; con id carga el producto y lo edita.

import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ProductFormView } from '@/components/products/product-form-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getProductWithStock } from '@/db/products-get';
import type { ProductWithStock } from '@/db/products-with-stock';

type LoadState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; product: ProductWithStock };

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const db = useSQLiteContext();
  const productId = id === undefined ? null : Number(id);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (productId === null) {
      return;
    }
    let cancelled = false;
    getProductWithStock(db, productId)
      .then((product) => {
        if (!cancelled) {
          setState(product ? { status: 'ready', product } : { status: 'missing' });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'missing' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [db, productId]);

  if (productId === null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Nuevo producto' }} />
        <ProductFormView mode="create" />
      </>
    );
  }

  if (state.status === 'ready') {
    return (
      <>
        <Stack.Screen options={{ title: 'Editar producto' }} />
        <ProductFormView mode="edit" product={state.product} />
      </>
    );
  }

  return (
    <ThemedView style={styles.centered}>
      <Stack.Screen options={{ title: 'Editar producto' }} />
      {state.status === 'loading' ? (
        <ActivityIndicator size="large" accessibilityLabel="Cargando producto" />
      ) : (
        <ThemedText>No se encontró el producto.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});