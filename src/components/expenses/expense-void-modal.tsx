// Modal para anular un gasto con una confirmación simple.
// El gasto no se borra: queda marcado como anulado.

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useErrorColor } from '@/components/products/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { useVoidExpense } from '@/hooks/use-void-expense';
import { formatCents } from '@/lib/money';

type Props = {
  visible: boolean;
  expenseId: number;
  category: string;
  amountCents: number;
  onClose: () => void;
  onVoided: () => void | Promise<void>;
};

export function ExpenseVoidModal({
  visible,
  expenseId,
  category,
  amountCents,
  onClose,
  onVoided,
}: Props) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  const colors = useStatusColors();
  const { voiding, error, clearError, requestVoid } = useVoidExpense({
    expenseId,
    onVoided,
  });

  const close = () => {
    if (!voiding) {
      clearError();
      onClose();
    }
  };

  const confirm = async () => {
    const ok = await requestVoid();
    if (ok) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top', 'left', 'right', 'bottom']}
          style={[styles.safe, { backgroundColor: theme.background }]}>
          <View style={styles.container}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Anular gasto</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {category} · {formatCents(amountCents)}
              </ThemedText>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              El gasto no se borra: queda como anulado y deja de sumar en los
              totales.
            </ThemedText>

            {error ? (
              <ThemedText type="small" style={{ color: errorColor }}>
                {error}
              </ThemedText>
            ) : null}

            <View style={styles.footer}>
              <Pressable
                onPress={close}
                disabled={voiding}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                accessibilityState={{ disabled: voiding }}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: voiding || pressed ? 0.7 : 1,
                  },
                ]}>
                <ThemedText type="smallBold">Volver</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => void confirm()}
                disabled={voiding}
                accessibilityRole="button"
                accessibilityLabel="Anular gasto"
                accessibilityState={{ disabled: voiding, busy: voiding }}
                style={({ pressed }) => [
                  styles.secondary,
                  {
                    backgroundColor: theme.backgroundElement,
                    opacity: voiding || pressed ? 0.7 : 1,
                  },
                ]}>
                {voiding ? (
                  <ActivityIndicator color={colors.error} />
                ) : (
                  <ThemedText type="smallBold" style={{ color: colors.error }}>
                    Anular gasto
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
