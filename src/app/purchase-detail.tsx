// Detalle de una compra: datos, renglones y anulación si sigue activa.

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailMessage } from '@/components/debts/detail-message';
import { PurchaseDetailLine } from '@/components/purchases/purchase-detail-line';
import { PurchaseDetailSummary } from '@/components/purchases/purchase-detail-summary';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { usePurchaseDetail } from '@/hooks/use-purchase-detail';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { useVoidPurchase } from '@/hooks/use-void-purchase';
import { localDateString } from '@/lib/dates';
import {
  buildPurchaseDetailHeader,
  buildPurchaseDetailRows,
} from '@/lib/purchase-rows';

export default function PurchaseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const statusColors = useStatusColors();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = Number(rawId);
  const purchaseId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;

  const { detail, loading, error, reload } = usePurchaseDetail(purchaseId);
  const today = localDateString();
  const header = useMemo(
    () => (detail ? buildPurchaseDetailHeader(detail, today) : null),
    [detail, today]
  );
  const rows = useMemo(
    () => (detail ? buildPurchaseDetailRows(detail.lines, detail.currency) : []),
    [detail]
  );
  const handleVoided = useCallback(() => reload(), [reload]);
  const { voiding, requestVoid } = useVoidPurchase({
    purchaseId,
    totalMxnCents: detail?.total_mxn_cents ?? 0,
    onVoided: handleVoided,
  });

  if (purchaseId === 0) {
    return <DetailMessage text="La compra no es válida." />;
  }
  if (loading && !detail) {
    return <DetailMessage loading />;
  }
  if (error && !detail) {
    return <DetailMessage text={error} onRetry={() => void reload()} />;
  }
  if (!detail || !header) {
    return <DetailMessage text="No se encontró esa compra." />;
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.safe, { backgroundColor: theme.background }]}>
      <FlatList
        data={rows}
        keyExtractor={(row) => String(row.id)}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.four },
        ]}
        ListHeaderComponent={<PurchaseDetailSummary header={header} />}
        renderItem={({ item }) => <PurchaseDetailLine row={item} />}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Esta compra no tiene renglones.
          </ThemedText>
        }
        ListFooterComponent={
          header.isVoid ? undefined : (
            <Pressable
              onPress={requestVoid}
              disabled={voiding}
              accessibilityRole="button"
              accessibilityLabel="Anular compra"
              accessibilityState={{ disabled: voiding }}
              style={({ pressed }) => [
                styles.voidButton,
                {
                  backgroundColor: theme.backgroundElement,
                  opacity: voiding || pressed ? 0.7 : 1,
                },
              ]}>
              {voiding ? (
                <ActivityIndicator size="small" color={statusColors.error} />
              ) : (
                <ThemedText type="smallBold" style={{ color: statusColors.error }}>
                  Anular compra
                </ThemedText>
              )}
            </Pressable>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  voidButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
});
