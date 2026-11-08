// Selector de cliente del pedido: búsqueda, alta rápida y vuelta al formulario.

import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { CustomerCreateForm } from '@/components/sell/customer-create-form';
import { CustomerPicker } from '@/components/sell/customer-picker';
import { Spacing } from '@/constants/theme';
import type { CustomerWithBalance } from '@/db/customers-list';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  customers: readonly CustomerWithBalance[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  onSelect: (customer: CustomerWithBalance) => void;
  onReload: () => void | Promise<void>;
  onClose: () => void;
};

export function OrderCustomerModal({
  visible,
  customers,
  loading,
  error,
  selectedId,
  onSelect,
  onReload,
  onClose,
}: Props) {
  const theme = useTheme();
  const [view, setView] = useState<'picker' | 'create'>('picker');
  const [draftName, setDraftName] = useState('');

  const close = () => {
    setView('picker');
    setDraftName('');
    onClose();
  };

  const choose = (customer: CustomerWithBalance) => {
    onSelect(customer);
    close();
  };

  const created = (customer: CustomerWithBalance) => {
    onSelect(customer);
    close();
    void onReload();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      {/* Provider propio: dentro del Modal los insets no son los de la pantalla. */}
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top', 'left', 'right', 'bottom']}
          style={[styles.safe, { backgroundColor: theme.background }]}>
          <View style={styles.container}>
            {view === 'picker' ? (
              <CustomerPicker
                key={visible ? 'open' : 'closed'}
                customers={customers}
                loading={loading}
                error={error}
                selectedId={selectedId}
                onSelect={choose}
                onCreate={(name) => {
                  setDraftName(name);
                  setView('create');
                }}
                onBack={close}
                onRetry={() => void onReload()}
              />
            ) : (
              <CustomerCreateForm
                initialName={draftName}
                onCreated={created}
                onCancel={() => setView('picker')}
              />
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
});
