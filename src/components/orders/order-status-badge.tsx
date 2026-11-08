// Etiqueta visual del estado de un pedido: pendiente, atrasado, entregado o cancelado.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import {
  ORDER_STATUS_LABELS,
  type OrderRowStatus,
} from '@/lib/order-list-view';

type Props = {
  status: OrderRowStatus;
};

export function OrderStatusBadge({ status }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();
  const color =
    status === 'overdue'
      ? colors.error
      : status === 'pending'
        ? colors.warning
        : status === 'delivered'
          ? theme.text
          : theme.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="smallBold" style={{ color }}>
        {ORDER_STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    alignSelf: 'flex-start',
  },
});
