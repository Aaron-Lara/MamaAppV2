// Encabezado del detalle de un gasto: categoría, importe, fecha y estado.

import { StyleSheet, View } from 'react-native';

import { ExpenseStatusBadge } from '@/components/expenses/expense-status-badge';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { ExpenseDetailHeader } from '@/lib/expense-view';

type Props = {
  header: ExpenseDetailHeader;
};

export function ExpenseDetailSummary({ header }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" style={styles.category}>
          {header.categoryLabel}
        </ThemedText>
        <ExpenseStatusBadge status={header.isVoid ? 'void' : 'active'} />
      </View>

      <View style={[styles.amount, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Importe
        </ThemedText>
        <ThemedText type="subtitle">{header.amountLabel}</ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Fecha: {header.dateLabel}
      </ThemedText>

      <View style={[styles.info, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="smallBold">Descripción</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {header.descriptionLabel ?? 'Sin descripción'}
        </ThemedText>
      </View>

      {header.isVoid ? (
        <View style={styles.voidInfo}>
          <ThemedText type="smallBold" style={{ color: colors.error }}>
            Gasto anulado
          </ThemedText>
          {header.voidReasonLabel ? (
            <ThemedText type="small" themeColor="textSecondary">
              Motivo: {header.voidReasonLabel}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            Este gasto no se suma a los totales.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  category: {
    flex: 1,
  },
  amount: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  info: {
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  voidInfo: {
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
});
