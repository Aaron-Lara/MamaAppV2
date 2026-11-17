// Pantalla para registrar un gasto. Sin SQL: todo pasa por los hooks.

import { useCallback, useRef, type ComponentRef } from 'react';
import { Keyboard, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExpenseFormFields } from '@/components/expenses/expense-form-fields';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';
import { useDayNavigation } from '@/hooks/use-day-navigation';
import { useExpenseForm } from '@/hooks/use-expense-form';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useTheme } from '@/hooks/use-theme';

export default function ExpenseFormScreen() {
  const theme = useTheme();
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
          <ThemedText type="small" style={{ color: theme.danger }}>
            {form.errors.form}
          </ThemedText>
        ) : null}

        <AppButton
          label="Guardar gasto"
          loading={form.saving}
          disabled={form.saving}
          onPress={submit}
          accessibilityLabel="Guardar gasto"
        />
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
});
