// Formulario de productos (crear y editar). Las pantallas no escriben SQL.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductActions } from '@/components/products/product-actions';
import { ProductFormFields } from '@/components/products/product-form-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [actionsBusy, setActionsBusy] = useState(false);
  const { values, errors, visibility, saving, onChange, save } = useProductForm({
    mode: props.mode,
    productId: product?.id,
    initialValues: product ? productToFormValues(product) : undefined,
    originalTrackStock: product?.track_stock === 1,
  });

  // Los campos de abajo quedarían detrás del teclado: espera a que suba y baja al final.
  const handleFieldFocus = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }, []);

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
          accessibilityState={{ disabled: saving || actionsBusy, busy: saving }}
          disabled={saving || actionsBusy}
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
          <ProductActions
            productId={product.id}
            isActive={product.active === 1}
            trackStock={product.track_stock === 1}
            disabled={saving}
            onBusyChange={setActionsBusy}
          />
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
  dimmed: {
    opacity: 0.6,
  },
});
