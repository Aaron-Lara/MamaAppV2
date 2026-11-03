// Encabezado de Fiados: título, total adeudado y alta rápida de cliente.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatCents } from '@/lib/money';

type Props = {
  totalCents: number;
  onCreate: () => void;
};

export function DebtsHeader({ totalCents, onCreate }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText type="subtitle">Fiados</ThemedText>
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          accessibilityLabel="Nuevo cliente"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="smallBold">+ Nuevo cliente</ThemedText>
        </Pressable>
      </View>
      <ThemedText type="smallBold">
        Te deben {formatCents(totalCents)} en total
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
