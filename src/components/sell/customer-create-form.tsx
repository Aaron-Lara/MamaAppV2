// Alta rápida de cliente desde el cobro fiado.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ModalFooter } from '@/components/sell/modal-footer';
import { PickerHeader } from '@/components/sell/picker-header';
import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { createCustomer } from '@/db/customers-create';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useTheme } from '@/hooks/use-theme';
import { MAX_CUSTOMER_NAME_LENGTH, validateCustomerName } from '@/lib/customer-input';
import { mapCreateCustomerError } from '@/lib/customer-messages';

export type CustomerCreateFormProps = {
  onCreated: (customer: CustomerWithBalance) => void;
  onCancel: () => void;
};

export function CustomerCreateForm({ onCreated, onCancel }: CustomerCreateFormProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const errorColor = useErrorColor();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // La referencia bloquea el doble toque al instante; el estado deshabilita el botón.
  const savingRef = useRef(false);

  const handleSave = useCallback(async () => {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const clean = validateCustomerName(name);
      const id = await createCustomer(db, clean);
      onCreated({ id, name: clean, balanceCents: 0 });
    } catch (caught) {
      setError(mapCreateCustomerError(caught));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [db, name, onCreated]);

  return (
    <View style={styles.container}>
      <PickerHeader
        title="Nuevo cliente"
        backLabel="Volver"
        onBack={onCancel}
        disabled={saving}
      />

      <View style={styles.field}>
        <ThemedText type="smallBold">Nombre del cliente</ThemedText>
        <TextInput
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          placeholder="Nombre"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Nombre del cliente"
          maxLength={MAX_CUSTOMER_NAME_LENGTH}
          editable={!saving}
          style={[
            styles.input,
            {
              backgroundColor: theme.backgroundElement,
              color: theme.text,
              borderColor: error ? errorColor : 'transparent',
            },
          ]}
        />
      </View>

      {error ? (
        <ThemedText type="small" accessibilityLiveRegion="polite" style={{ color: errorColor }}>
          {error}
        </ThemedText>
      ) : null}

      <Pressable
        onPress={() => void handleSave()}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Guardar cliente"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
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
