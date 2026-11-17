// Pie del formulario: total, agregar producto y guardar el pedido.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';
import { MAX_ORDER_ITEMS } from '@/lib/order-item-input';

type Props = {
  totalCents: number;
  lineCount: number;
  generalError: string;
  saving: boolean;
  onAddLine: () => void;
  onSave: () => void;
};

export function OrderFormFooter({
  totalCents,
  lineCount,
  generalError,
  saving,
  onAddLine,
  onSave,
}: Props) {
  const theme = useTheme();
  const canAdd = lineCount < MAX_ORDER_ITEMS;

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        El pedido no mueve stock hasta que se entregue.
      </ThemedText>

      <View style={[styles.total, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small">Total del pedido</ThemedText>
        <ThemedText type="smallBold">{formatCents(totalCents)}</ThemedText>
      </View>

      {generalError ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {generalError}
        </ThemedText>
      ) : null}

      <AppButton
        label={`+ Agregar producto (${lineCount} de ${MAX_ORDER_ITEMS})`}
        variant="secondary"
        disabled={!canAdd || saving}
        onPress={onAddLine}
        accessibilityLabel="Agregar producto"
      />

      <AppButton
        label="Guardar pedido"
        loading={saving}
        disabled={saving}
        onPress={onSave}
        accessibilityLabel="Guardar pedido"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  total: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
