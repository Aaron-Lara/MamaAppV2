// Fila del historial de un cliente: fiado o abono, activo o anulado.

import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { LedgerDisplayRow } from '@/lib/ledger-rows';
import { formatCents } from '@/lib/money';

type Props = {
  row: LedgerDisplayRow;
  voiding: boolean;
  onVoid: (row: LedgerDisplayRow) => void;
};

export function LedgerRow({ row, voiding, onVoid }: Props) {
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
        <ThemedText
          type="smallBold"
          style={row.type === 'payment' ? { color: statusColors.warning } : undefined}>
          {row.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {row.date}
        </ThemedText>
        {row.isVoid ? (
          <View style={styles.voidInfo}>
            <ThemedText type="smallBold" style={{ color: statusColors.error }}>
              Anulado
            </ThemedText>
            {row.voidReason ? (
              <ThemedText type="small" themeColor="textSecondary">
                {row.voidReason}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.side}>
        <ThemedText type="smallBold">{formatCents(row.amountCents)}</ThemedText>
        {row.type === 'payment' && !row.isVoid ? (
          <Pressable
            onPress={() => onVoid(row)}
            disabled={voiding}
            accessibilityRole="button"
            accessibilityLabel="Anular abono"
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
        ) : null}
      </View>
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
  voidInfo: {
    gap: Spacing.half,
  },
  side: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  voidButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
});
