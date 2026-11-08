// Pantalla para registrar un gasto. Sin SQL: todo pasa por los hooks.

import { useCallback, useRef, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseFormFields } from '@/components/expenses/expense-form-fields';
import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useExpenseForm } from '@/hooks/use-expense-form';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useTheme } from '@/hooks/use-theme';

export default function ExpenseFormScreen() {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const day = useDayNavigation();
  const form = useExpenseForm({ expenseDate: day.date });
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Descripción queda al final: al enfocarla se baja para que el teclado no la tape.
  const handleFieldFocus = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  }, []);

  const submit = () => {
    Keyboard.dismiss();
    void form.save();
  };

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four + keyboardHeight },
        ]}>
        <ExpenseFormFields
          day={day}
          values={form.values}
          errors={form.errors}
          onChange={form.onChange}
          onFieldFocus={handleFieldFocus}
        />

        {form.errors.form ? (
          <ThemedText type="small" style={{ color: errorColor }}>
            {form.errors.form}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={form.saving}
          accessibilityRole="button"
          accessibilityLabel="Guardar gasto"
          accessibilityState={{ disabled: form.saving, busy: form.saving }}
          style={({ pressed }) => [
            styles.save,
            { backgroundColor: theme.text },
            (pressed || form.saving) && styles.dimmed,
          ]}>
          {form.saving ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Guardar gasto
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  save: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  dimmed: {
    opacity: 0.6,
  },
});
