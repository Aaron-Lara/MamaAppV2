// Botón para crear un producto desde Inventario (compacto, junto al título).

import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function InventoryCreateButton() {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nuevo producto"
      onPress={() => router.push('/product-form')}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.text },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.background }}>
        + Nuevo producto
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});