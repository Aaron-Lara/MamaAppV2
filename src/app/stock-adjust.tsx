// Pantalla de ajuste de stock: carga el producto y delega el formulario.
// Las pantallas no escriben SQL.

import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { StockAdjustView } from '@/components/stock/stock-adjust-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getProductWithStock } from '@/db/products-get';
import type { ProductWithStock } from '@/db/products-with-stock';

function CenterMessage({ text, secondary = false }: { text: string; secondary?: boolean }) {
  return (
    <ThemedView style={styles.center}>
      <ThemedText themeColor={secondary ? 'textSecondary' : undefined}>{text}</ThemedText>
    </ThemedView>
  );
}

export default function StockAdjustScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const productId = Number(id);
  const validId = Number.isSafeInteger(productId) && productId > 0;
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    getProductWithStock(db, productId)
      .then((found) => {
        if (cancelled) return;
        if (!found) setProblem('El producto no existe.');
        else if (found.track_stock !== 1) setProblem('Este producto no controla stock.');
        else setProduct(found);
      })
      .catch(() => {
        if (!cancelled) setProblem('No se pudo cargar el producto. Inténtalo de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db, productId, validId]);

  if (!validId) {
    return <CenterMessage text="El producto no es válido." />;
  }
  if (loading) {
    return <CenterMessage text="Cargando producto…" secondary />;
  }
  if (!product) {
    return <CenterMessage text={problem ?? 'El producto no existe.'} />;
  }
  return <StockAdjustView product={product} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
});
