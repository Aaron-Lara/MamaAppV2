// Etiqueta visual del estado de un gasto: activo o anulado.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { ExpenseStatus } from '@/lib/expense-types';

type Props = {
  status: ExpenseStatus;
};

export function ExpenseStatusBadge({ status }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();
  const isVoid = status === 'void';

  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText
        type="smallBold"
        style={{ color: isVoid ? colors.error : theme.textSecondary }}>
        {isVoid ? 'Anulado' : 'Activo'}
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
