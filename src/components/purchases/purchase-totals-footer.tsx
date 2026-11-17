// Pie del formulario: totales, ayuda, agregar producto y revisar.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { MAX_PURCHASE_LINES, type PurchaseCurrency } from '@/lib/purchase-types';

type Props = {
  currency: PurchaseCurrency;
  totalCents: number;
  totalMxnCents: number;
  lineCount: number;
  generalError?: string;
  saving: boolean;
  onAddLine: () => void;
  onReview: () => void;
};

export function PurchaseTotalsFooter({
  currency,
  totalCents,
  totalMxnCents,
  lineCount,
  generalError,
  saving,
  onAddLine,
  onReview,
}: Props) {
  const theme = useTheme();
  const canAdd = lineCount < MAX_PURCHASE_LINES;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Si compraste una caja de 24, escribe 24 unidades.
      </ThemedText>

      <View style={[styles.totals, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.row}>
          <ThemedText type="small">Total en {currency}</ThemedText>
          <ThemedText type="smallBold">{formatCents(totalCents)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText type="small">Total en pesos</ThemedText>
          <ThemedText type="smallBold">{formatCents(totalMxnCents)}</ThemedText>
        </View>
      </View>

      {generalError ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {generalError}
        </ThemedText>
      ) : null}

      <AppButton
        label={`+ Agregar producto (${lineCount} de ${MAX_PURCHASE_LINES})`}
        variant="secondary"
        disabled={!canAdd}
        onPress={onAddLine}
        accessibilityLabel="Agregar producto"
      />

      <AppButton
        label="Revisar compra"
        disabled={saving}
        onPress={onReview}
        accessibilityLabel="Revisar compra"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three, paddingTop: Spacing.two },
  totals: { borderRadius: 12, padding: Spacing.three, gap: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
