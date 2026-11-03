import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { DebtorRow as DebtorRowType } from '@/lib/debtor-rows';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

export function DebtorRow({ row }: { row: DebtorRowType }) {
  const theme = useTheme();
  const isAtrasado = row.isOverdue;
  const statusColor = row.status === 'danger' ? theme.error : theme.warning;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.info}>
        <ThemedText type="smallBold">{row.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {row.balanceCents > 0 ? `Debe ${formatCents(row.balanceCents)}` : 'Sin deuda'}
        </ThemedText>
      </View>
      {row.balanceCents > 0 && (
        <View style={styles.debtInfo}>
          <ThemedText type="small" themeColor="textSecondary">{row.ageText}</ThemedText>
          {isAtrasado && <ThemedText type="smallBold" style={{ color: statusColor }}>Atrasado</ThemedText>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', padding: Spacing.three, borderRadius: 12, gap: Spacing.two },
  info: { flex: 1 },
  debtInfo: { alignItems: 'flex-end' }
});
