// Encabezado con botón "Volver" para las vistas internas del modal.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PickerHeaderProps = {
  title: string;
  backLabel?: string;
  onBack: () => void;
  disabled?: boolean;
};

export function PickerHeader({
  title,
  backLabel = 'Volver',
  onBack,
  disabled = false,
}: PickerHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.back,
          {
            backgroundColor: theme.backgroundElement,
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">{backLabel}</ThemedText>
      </Pressable>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  back: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
});
