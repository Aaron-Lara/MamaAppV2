// Ganancia neta estimada del día: solo texto grande, sin gráficas.

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type { NetProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  profit: NetProfitEstimate | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function uncostedProductLabel(count: number): string {
  return count === 1
    ? '1 producto sin costo: regístralo en Compras'
    : `${count} productos sin costo: regístralos en Compras`;
}

function expenseCountLabel(count: number): string {
  if (count === 0) {
    return 'sin gastos activos';
  }
  return count === 1 ? '1 gasto activo' : `${count} gastos activos`;
}

export function ProfitEstimateCard({ profit, loading, error, onRetry }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  if (loading && !profit) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Ganancia neta estimada
        </ThemedText>
        <ActivityIndicator
          size="small"
          color={theme.text}
          accessibilityLabel="Cargando ganancia neta estimada"
        />
      </View>
    );
  }

  if (error && !profit) {
    return <RetryBlock message={error} onRetry={onRetry} />;
  }

  if (!profit) {
    return null;
  }

  const hasActivity = profit.hasSales || profit.expensesCents > 0;
  const loss = profit.hasKnownNet && profit.isNetLoss;
  const label = loss ? 'Pérdida estimada' : 'Ganancia neta estimada';
  const value = !hasActivity
    ? 'Sin ventas'
    : profit.hasKnownNet
      ? formatCents(profit.netProfitCents)
      : 'Sin datos de costo';
  const valueColor = loss ? statusColors.error : theme.text;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: valueColor }} numberOfLines={2}>
        {value}
      </ThemedText>

      {hasActivity ? (
        <ThemedText type="small" themeColor="textSecondary">
          Incluye ventas fiadas · Es una estimación
        </ThemedText>
      ) : null}

      {profit.hasKnownCosts ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Ganancia antes de gastos: {formatCents(profit.profitCents)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Estimación con el último costo conocido
          </ThemedText>
        </>
      ) : !hasActivity ? (
        <ThemedText type="small" themeColor="textSecondary">
          No hubo ventas ni gastos activos este día.
        </ThemedText>
      ) : !profit.hasSales ? (
        <ThemedText type="small" themeColor="textSecondary">
          No hubo ventas activas este día.
        </ThemedText>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No hay compras previas de los productos vendidos.
        </ThemedText>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        Gastos del día: {formatCents(profit.expensesCents)} ·{' '}
        {expenseCountLabel(profit.expensesCount)}
      </ThemedText>

      {profit.uncostedRevenueCents > 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Ventas sin costo conocido: {formatCents(profit.uncostedRevenueCents)}
        </ThemedText>
      ) : null}

      {profit.uncostedProductCount > 0 ? (
        <ThemedText type="small" style={{ color: statusColors.warning }}>
          {uncostedProductLabel(profit.uncostedProductCount)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.half,
  },
});
