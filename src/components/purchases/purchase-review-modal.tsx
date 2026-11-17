// Paso obligatorio de revisión antes de guardar una compra.

import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PurchaseReviewLineRow } from '@/components/purchases/purchase-review-line';
import {
  PurchaseReviewHeader,
  PurchaseReviewTotal,
} from '@/components/purchases/purchase-review-summary';
import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
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
          <AppButton
            label="Volver a editar"
            variant="secondary"
            disabled={saving}
            onPress={onBack}
            accessibilityLabel="Volver a editar"
          />

          <AppButton
            label={saving ? 'Guardando…' : 'Confirmar compra'}
            loading={saving}
            disabled={saving}
            onPress={onConfirm}
            accessibilityLabel="Confirmar compra"
          />
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
});
