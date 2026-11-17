// Botones de motivo del ajuste de stock. Solo dibuja; el estado es de la pantalla.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AdjustmentMotive } from '@/lib/stock-adjust';

const OPTIONS: { value: AdjustmentMotive; label: string }[] = [
  { value: 'count', label: 'Conteo' },
  { value: 'waste', label: 'Merma' },
  { value: 'other', label: 'Otro' },
];

type Props = {
  value: AdjustmentMotive;
  onChange: (value: AdjustmentMotive) => void;
};

export function MotivePicker({ value, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? theme.primary : 'transparent',
                borderColor: selected ? theme.primary : theme.textSecondary,
              },
              pressed && styles.dimmed,
            ]}>
            <ThemedText
              type="smallBold"
              style={selected ? { color: theme.onPrimary } : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  option: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.6,
  },
});
