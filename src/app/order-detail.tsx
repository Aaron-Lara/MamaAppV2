// Detalle de un pedido: productos, notas, fechas y acciones de entrega/cancelación.

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DetailMessage } from '@/components/debts/detail-message';
import { OrderCancelModal } from '@/components/orders/order-cancel-modal';
import { OrderDeliverModal } from '@/components/orders/order-deliver-modal';
import { OrderDetailActions } from '@/components/orders/order-detail-actions';
import { OrderDetailLine } from '@/components/orders/order-detail-line';
import { OrderDetailSummary } from '@/components/orders/order-detail-summary';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useOrderDetail } from '@/hooks/use-order-detail';
import { useTheme } from '@/hooks/use-theme';
import { localDateString } from '@/lib/dates';
import {
  buildOrderDetailHeader,
  buildOrderDetailLines,
} from '@/lib/order-detail-view';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const parsedId = Number(rawId);
  const orderId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;

  const { detail, loading, error, reload } = useOrderDetail(orderId);
  const today = localDateString();
  const header = useMemo(
    () => (detail ? buildOrderDetailHeader(detail, today) : null),
    [detail, today]
  );
  const rows = useMemo(
    () => (detail ? buildOrderDetailLines(detail.items) : []),
    [detail]
  );
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const refresh = useCallback(() => {
    void reload();
  }, [reload]);
  const handleDelivered = useCallback(async () => {
    setDeliverOpen(false);
    await reload();
  }, [reload]);
  const handleCancelled = useCallback(async () => {
    setCancelOpen(false);
    await reload();
  }, [reload]);

  if (orderId === 0) {
    return <DetailMessage text="El pedido no es válido." />;
  }
  if (loading && !detail) {
    return <DetailMessage loading />;
  }
  if (error && !detail) {
    return <DetailMessage text={error} onRetry={() => void reload()} />;
  }
  if (!detail || !header) {
    return <DetailMessage text="No se encontró ese pedido." />;
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
        ListHeaderComponent={<OrderDetailSummary header={header} />}
        renderItem={({ item }) => <OrderDetailLine row={item} />}
        ListEmptyComponent={
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Este pedido no tiene productos.
          </ThemedText>
        }
        ListFooterComponent={
          <OrderDetailActions
            canDeliver={header.canDeliver}
            canCancel={header.canCancel}
            onDeliver={() => setDeliverOpen(true)}
            onCancel={() => setCancelOpen(true)}
          />
        }
      />

      <OrderDeliverModal
        visible={deliverOpen && header.canDeliver}
        orderId={orderId}
        customerName={header.customerName}
        totalCents={detail.totalCents}
        onClose={() => setDeliverOpen(false)}
        onDelivered={handleDelivered}
        onRefresh={refresh}
      />
      <OrderCancelModal
        visible={cancelOpen && header.canCancel}
        orderId={orderId}
        customerName={header.customerName}
        totalCents={detail.totalCents}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
        onRefresh={refresh}
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
});
