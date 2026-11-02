// Encabezado del modal de cobro, con el botón de cerrar.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SaleModalHeaderProps = {
  saving: boolean;
  onClose: () => void;
};

export function SaleModalHeader({ saving, onClose }: SaleModalHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <ThemedText type="subtitle">Carrito</ThemedText>
      <Pressable
        onPress={onClose}
        disabled={saving}
        accessibilityRole="button"
        accessibilityLabel="Cerrar carrito"
        accessibilityState={{ disabled: saving }}
        style={({ pressed }) => [
          styles.close,
          {
            backgroundColor: theme.backgroundElement,
            opacity: saving ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">Cerrar</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  close: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
