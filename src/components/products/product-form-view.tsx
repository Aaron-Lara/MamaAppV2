// Formulario de productos (crear y editar). Las pantallas no escriben SQL.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductFormFields } from '@/components/products/product-form-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { setProductActive } from '@/db/products-manage';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useProductForm } from '@/hooks/use-product-form';
import { useTheme } from '@/hooks/use-theme';
import { productToFormValues } from '@/lib/product-form';

type Props = { mode: 'create' } | { mode: 'edit'; product: ProductWithStock };

export function ProductFormView(props: Props) {
  const product = props.mode === 'edit' ? props.product : undefined;
  const db = useSQLiteContext();
  const theme = useTheme();
  const errorColor = useColorScheme() === 'dark' ? '#ff8a80' : '#c62828';
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [toggling, setToggling] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const { values, errors, visibility, saving, onChange, save } = useProductForm({
    mode: props.mode,
    productId: product?.id,
    initialValues: product ? productToFormValues(product) : undefined,
    originalTrackStock: product?.track_stock === 1,
  });
  const isActive = product?.active === 1;

  // Los campos de abajo quedarían detrás del teclado: espera a que suba y baja al final.
  const handleFieldFocus = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }, []);

  const toggleActive = async () => {
    if (!product || toggling) {
      return;
    }
    setToggling(true);
    setStatusError(null);
    try {
      await setProductActive(db, product.id, !isActive);
      router.back();
    } catch {
      setStatusError('No se pudo cambiar el estado del producto. Inténtalo de nuevo.');
      setToggling(false);
    }
  };

  const confirmToggle = () => {
    Alert.alert(
      isActive ? '¿Desactivar producto?' : '¿Reactivar producto?',
      isActive
        ? 'Dejará de aparecer para vender. Sus ventas y su stock se conservan.'
        : 'Volverá a aparecer para vender.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isActive ? 'Desactivar' : 'Reactivar',
          style: isActive ? 'destructive' : 'default',
          onPress: () => void toggleActive(),
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 + keyboardHeight },
        ]}>
        <ProductFormFields
          values={values}
          errors={errors}
          visibility={visibility}
          onChange={onChange}
          onFieldFocus={handleFieldFocus}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving || toggling, busy: saving }}
          disabled={saving || toggling}
          onPress={() => void save(db, () => router.back())}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.text },
            (pressed || saving) && styles.dimmed,
          ]}>
          {saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Guardar
            </ThemedText>
          )}
        </Pressable>

        {product ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={saving || toggling}
              onPress={confirmToggle}
              style={({ pressed }) => [
                styles.button,
                styles.secondary,
                { borderColor: theme.textSecondary },
                (pressed || toggling) && styles.dimmed,
              ]}>
              <ThemedText type="smallBold">
                {isActive ? 'Desactivar producto' : 'Reactivar producto'}
              </ThemedText>
            </Pressable>
            {statusError ? (
              <ThemedText type="small" style={{ color: errorColor }}>
                {statusError}
              </ThemedText>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    borderWidth: 1,
  },
  dimmed: {
    opacity: 0.6,
  },
});