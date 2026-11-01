// Formulario del ajuste de stock. No escribe SQL: guarda por src/db.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StockAdjustFields } from '@/components/stock/stock-adjust-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { ProductWithStock } from '@/db/products-with-stock';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useStockAdjust } from '@/hooks/use-stock-adjust';
import { useTheme } from '@/hooks/use-theme';
import { formatStockLabel } from '@/lib/stock-label';

type Props = { product: ProductWithStock };

export function StockAdjustView({ product }: Props) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const {
    countedText,
    motive,
    note,
    errors,
    saving,
    preview,
    setCounted,
    setMotive,
    setNote,
    save,
  } = useStockAdjust({ currentStock: product.stock });

  // Los campos de abajo quedarían detrás del teclado: baja al final al enfocar.
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
        <View style={styles.header}>
          <ThemedText>{product.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Stock actual: {formatStockLabel(product.stock)}
          </ThemedText>
        </View>

        <StockAdjustFields
          countedText={countedText}
          motive={motive}
          note={note}
          errors={errors}
          previewText={preview?.text ?? null}
          onCountedChange={setCounted}
          onMotiveChange={setMotive}
          onNoteChange={setNote}
          onFieldFocus={handleFieldFocus}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving, busy: saving }}
          disabled={saving}
          onPress={() => save(db, product.id, () => router.back())}
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
  header: {
    gap: Spacing.one,
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
