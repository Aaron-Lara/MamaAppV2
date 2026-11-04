// Selector de día del Resumen: "‹  Hoy  ›", sin permitir días futuros.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function DaySelector({ label, canGoNext, onPrev, onNext }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        onPress={onPrev}
        accessibilityRole="button"
        accessibilityLabel="Día anterior"
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.7 : 1 }]}>
        <ThemedText type="subtitle">‹</ThemedText>
      </Pressable>

      <ThemedText type="smallBold" style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>

      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        accessibilityRole="button"
        accessibilityLabel="Día siguiente"
        accessibilityState={{ disabled: !canGoNext }}
        style={({ pressed }) => [
          styles.button,
          { opacity: !canGoNext ? 0.35 : pressed ? 0.7 : 1 },
        ]}>
        <ThemedText type="subtitle">›</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.one,
  },
  button: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
