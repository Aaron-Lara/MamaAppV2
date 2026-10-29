// TEMPORAL: pantalla de prueba de SQLite. Se reemplaza al construir el catálogo.
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { countProducts, insertProduct, listProducts, type Product } from '@/db/products';
import { useTheme } from '@/hooks/use-theme';

/** Centavos -> texto en pesos, sin depender de Intl. */
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setProducts(await listProducts(db));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al leer productos');
    }
  }, [db]);

  // Carga inicial: el setState va en el callback, no en el cuerpo del efecto.
  useEffect(() => {
    let active = true;
    listProducts(db).then(
      (rows) => {
        if (active) {
          setProducts(rows);
          setError(null);
        }
      },
      (err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Error al leer productos');
      }
    );
    return () => {
      active = false;
    };
  }, [db]);

  const handleInsert = async () => {
    setBusy(true);
    try {
      const total = await countProducts(db);
      await insertProduct(db, {
        name: `TEST ${total + 1}`,
        priceCents: 1000 + total * 150,
        category: 'prueba',
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al insertar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">POS Cooperativa</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Prueba de SQLite: insertar y leer productos.
      </ThemedText>

      <Pressable
        onPress={handleInsert}
        disabled={busy}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundElement, opacity: busy ? 0.5 : pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="smallBold">{busy ? 'Insertando…' : 'Insertar TEST'}</ThemedText>
      </Pressable>

      {error ? <ThemedText type="small" style={styles.error}>{error}</ThemedText> : null}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary">
            Todavía no hay productos.
          </ThemedText>
        }
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={styles.row}>
            <ThemedText type="smallBold">{item.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatCents(item.price_cents)} · id {item.id}
            </ThemedText>
          </ThemedView>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 12,
    alignItems: 'center',
  },
  error: {
    color: '#d93025',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  row: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
  },
});
