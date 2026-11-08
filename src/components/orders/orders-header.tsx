// Encabezado de Pedidos: título, acceso al alta y aviso de atrasados.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  overdueCount: number;
  onCreate: () => void;
};

export function OrdersHeader({ overdueCount, onCreate }: Props) {
  const theme = useTheme();
  const colors = useStatusColors();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="subtitle">Pedidos</ThemedText>
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Nuevo pedido"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold">+ Nuevo pedido</ThemedText>
        </Pressable>
      </View>
      <ThemedText
        type="smallBold"
        style={{ color: overdueCount > 0 ? colors.error : theme.textSecondary }}>
        {overdueCount === 0
          ? 'Sin pedidos atrasados'
          : overdueCount === 1
            ? '1 pedido atrasado'
            : `${overdueCount} pedidos atrasados`}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
