import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { DebtorRow as DebtorRowType } from '@/lib/debtor-rows';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

type Props = {
  row: DebtorRowType;
  onPress: () => void;
};

export function DebtorRow({ row, onPress }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();
  const isAtrasado = row.isOverdue;
  const statusColor = row.status === 'danger' ? statusColors.error : statusColors.warning;
  const balanceText =
    row.balanceCents > 0 ? `Debe ${formatCents(row.balanceCents)}` : 'Sin deuda';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${row.name}. ${balanceText}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <View style={styles.info}>
        <ThemedText type="smallBold">{row.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {balanceText}
        </ThemedText>
      </View>
      {row.balanceCents > 0 && (
        <View style={styles.debtInfo}>
          <ThemedText type="small" themeColor="textSecondary">{row.ageText}</ThemedText>
          {isAtrasado && <ThemedText type="smallBold" style={{ color: statusColor }}>Atrasado</ThemedText>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: 12, gap: Spacing.two },
  info: { flex: 1 },
  debtInfo: { alignItems: 'flex-end' }
});
