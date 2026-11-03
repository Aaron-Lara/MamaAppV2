// Alta rápida de cliente desde el cobro fiado.

import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState, type ComponentType } from 'react';
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

export type CustomerCreateFormFooterControls = {
  save: () => void;
  saving: boolean;
};

export type CustomerCreateFormProps = {
  initialName?: string;
  onCreated: (customer: CustomerWithBalance) => void;
  onCancel: () => void;
  onFieldFocus?: () => void;
  // El pie es configurable: Vender usa ModalFooter y Fiados uno normal.
  footer?: ComponentType<CustomerCreateFormFooterControls>;
};

export function CustomerCreateForm({
  initialName,
  onCreated,
  onCancel,
  onFieldFocus,
  footer,
}: CustomerCreateFormProps) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const errorColor = useErrorColor();
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
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

  const save = useCallback(() => {
    void handleSave();
  }, [handleSave]);
  const Footer = footer;

  const defaultFooter = (
    <ModalFooter>
      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [
          styles.save,
          { backgroundColor: theme.text },
          (pressed || saving) && styles.dimmed,
        ]}>
        {saving ? <ActivityIndicator color={theme.background} /> : <ThemedText type="smallBold" style={{ color: theme.background }}>Guardar</ThemedText>}
      </Pressable>
    </ModalFooter>
  );

  return (
    <View style={styles.container}>
      <PickerHeader title="Nuevo cliente" backLabel="Volver" onBack={onCancel} disabled={saving} />
      <View style={styles.field}>
        <ThemedText type="smallBold">Nombre del cliente</ThemedText>
        <TextInput
          value={name}
          onChangeText={(text) => { setName(text); setError(null); }}
          placeholder="Nombre"
          placeholderTextColor={theme.textSecondary}
          maxLength={MAX_CUSTOMER_NAME_LENGTH}
          editable={!saving}
          onFocus={onFieldFocus}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: error ? errorColor : 'transparent' }]}
        />
      </View>
      {error ? <ThemedText type="small" style={{ color: errorColor }}>{error}</ThemedText> : null}
      {Footer ? <Footer save={save} saving={saving} /> : defaultFooter}
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
