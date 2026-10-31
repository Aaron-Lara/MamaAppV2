// Pantalla para crear un producto. Las pantallas no escriben SQL.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProductFormFields } from '@/components/products/product-form-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useProductForm } from '@/hooks/use-product-form';
import { useTheme } from '@/hooks/use-theme';

export default function ProductFormScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const { values, errors, visibility, saving, onChange, save } = useProductForm('create');

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
          accessibilityState={{ disabled: saving, busy: saving }}
          disabled={saving}
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