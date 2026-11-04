// Fila de "Ventas del día": datos de la venta y acción de anular.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { DaySaleRow as DaySaleRowData } from '@/lib/day-sales-rows';

type Props = {
  row: DaySaleRowData;
  voiding: boolean;
  onVoid: (row: DaySaleRowData) => void;
};

export function DaySaleRow({ row, voiding, onVoid }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.backgroundElement },
        row.isVoid && styles.voided,
      ]}>
      <View style={styles.info}>
        <View style={styles.line}>
          <ThemedText type="smallBold">{row.timeLabel}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {row.paymentLabel}
          </ThemedText>
        </View>
        <ThemedText type="smallBold">{row.totalLabel}</ThemedText>
        {row.customerLabel ? (
          <ThemedText type="small" themeColor="textSecondary">
            {row.customerLabel}
          </ThemedText>
        ) : null}
        {row.itemsText ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {row.itemsText}
          </ThemedText>
        ) : null}
        {row.isVoid ? (
          <View style={styles.voidInfo}>
            <ThemedText type="smallBold" style={{ color: statusColors.error }}>
              Anulada
            </ThemedText>
            {row.voidReason ? (
              <ThemedText type="small" themeColor="textSecondary">
                {row.voidReason}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>

      {row.isVoid ? null : (
        <Pressable
          onPress={() => onVoid(row)}
          disabled={voiding}
          accessibilityRole="button"
          accessibilityLabel={`Anular venta de ${row.totalLabel}`}
          style={({ pressed }) => [
            styles.voidButton,
            { backgroundColor: theme.background, opacity: pressed ? 0.7 : 1 },
          ]}>
          {voiding ? (
            <ActivityIndicator size="small" color={statusColors.error} />
          ) : (
            <ThemedText type="smallBold" style={{ color: statusColors.error }}>
              Anular
            </ThemedText>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: 12,
  },
  voided: {
    opacity: 0.55,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  voidInfo: {
    gap: Spacing.half,
  },
  voidButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
});
