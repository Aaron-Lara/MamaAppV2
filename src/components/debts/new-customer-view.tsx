// Alta de cliente dentro de la pestaña de Fiados, sin modal.

import { useCallback, useRef, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CustomerCreateForm,
  type CustomerCreateFormFooterControls,
} from '@/components/sell/customer-create-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useKeyboardHeight } from '@/hooks/use-keyboard-height';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  onCreated: (customer: CustomerWithBalance) => void;
  onCancel: () => void;
};

// Pie normal de pantalla, sin el espacio inferior reservado a los modales.
function DebtsSaveFooter({ save, saving }: CustomerCreateFormFooterControls) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={save}
      disabled={saving}
      accessibilityRole="button"
      accessibilityState={{ disabled: saving, busy: saving }}
      style={({ pressed }) => [
        styles.save,
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
  );
}

export function NewCustomerView({ onCreated, onCancel }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  // Espera a que suba el teclado y baja hasta el botón Guardar.
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
          { paddingBottom: insets.bottom + Spacing.four + keyboardHeight },
        ]}>
        <CustomerCreateForm
          onCreated={onCreated}
          onCancel={onCancel}
          onFieldFocus={handleFieldFocus}
          footer={DebtsSaveFooter}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  save: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  dimmed: {
    opacity: 0.6,
  },
});
