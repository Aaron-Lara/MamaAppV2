// Selector de forma de pago: efectivo o fiado.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PaymentMethod } from '@/lib/checkout';

export type PaymentMethodPickerProps = {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
};

const OPTIONS: { method: PaymentMethod; label: string }[] = [
  { method: 'cash', label: 'Efectivo' },
  { method: 'credit', label: 'Fiado' },
];

export function PaymentMethodPicker({
  method,
  onChange,
  disabled = false,
}: PaymentMethodPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.method === method;
        return (
          <Pressable
            key={option.method}
            onPress={() => onChange(option.method)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: selected ? theme.text : theme.backgroundElement,
                opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: selected ? theme.background : theme.text }}>
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
    gap: Spacing.two,
  },
  option: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
