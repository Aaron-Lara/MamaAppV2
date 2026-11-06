// Ganancia estimada del día: solo texto grande, sin gráficas.

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { RetryBlock } from '@/components/summary/retry-block';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import type { ProfitEstimate } from '@/lib/profit-estimate';

type Props = {
  profit: ProfitEstimate | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function uncostedProductLabel(count: number): string {
  return count === 1
    ? '1 producto sin costo: regístralo en Compras'
    : `${count} productos sin costo: regístralos en Compras`;
}

export function ProfitEstimateCard({ profit, loading, error, onRetry }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  if (loading && !profit) {
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Ganancia estimada
        </ThemedText>
        <ActivityIndicator
          size="small"
          color={theme.text}
          accessibilityLabel="Cargando ganancia estimada"
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

  const loss = profit.hasKnownCosts && profit.isLoss;
  const label = loss ? 'Pérdida estimada' : 'Ganancia estimada';
  const value = profit.hasKnownCosts
    ? formatCents(profit.profitCents)
    : profit.hasSales
      ? 'Sin datos de costo'
      : 'Sin ventas';
  const valueColor = loss ? statusColors.error : theme.text;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: valueColor }} numberOfLines={2}>
        {value}
      </ThemedText>

      {profit.hasKnownCosts ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Incluye ventas fiadas · No incluye gastos
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Estimación con el último costo conocido
          </ThemedText>
        </>
      ) : profit.hasSales ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Incluye ventas fiadas · No incluye gastos
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            No hay compras previas de los productos vendidos.
          </ThemedText>
        </>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          No hubo ventas activas este día.
        </ThemedText>
      )}

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
