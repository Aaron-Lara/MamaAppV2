// Paso obligatorio de revisión antes de guardar una compra.

import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseReviewLineRow } from '@/components/purchases/purchase-review-line';
import {
  PurchaseReviewHeader,
  PurchaseReviewTotal,
} from '@/components/purchases/purchase-review-summary';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PurchaseReview } from '@/lib/purchase-review';

type Props = {
  visible: boolean;
  review: PurchaseReview;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function PurchaseReviewModal({
  visible,
  review,
  saving,
  onBack,
  onConfirm,
}: Props) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (!saving) {
          onBack();
        }
      }}>
      <SafeAreaView
        edges={['top', 'left', 'right', 'bottom']}
        style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Revisa tu compra</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Revisa los datos antes de guardar.
          </ThemedText>
        </View>

        <FlatList
          data={review.lines}
          keyExtractor={(row) => row.key}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<PurchaseReviewHeader review={review} />}
          renderItem={({ item }) => <PurchaseReviewLineRow row={item} />}
          ListFooterComponent={<PurchaseReviewTotal review={review} />}
        />

        <View style={styles.footer}>
          <Pressable
            onPress={onBack}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Volver a editar"
            accessibilityState={{ disabled: saving }}
            style={({ pressed }) => [
              styles.secondary,
              {
                backgroundColor: theme.backgroundElement,
                opacity: saving || pressed ? 0.7 : 1,
              },
            ]}>
            <ThemedText type="smallBold">Volver a editar</ThemedText>
          </Pressable>

          <Pressable
            onPress={onConfirm}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Confirmar compra"
            accessibilityState={{ disabled: saving, busy: saving }}
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: theme.text, opacity: saving || pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {saving ? 'Guardando…' : 'Confirmar compra'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  list: { flex: 1 },
  listContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
});
