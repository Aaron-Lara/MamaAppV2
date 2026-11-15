// Selector del reporte: semana o mes, periodo anterior/siguiente y etiqueta.
// Solo presentación: la navegación la controla usePeriodNavigation.

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PeriodKind } from '@/lib/period-dates';

type Props = {
  kind: PeriodKind;
  label: string;
  canGoNext: boolean;
  isPartial: boolean;
  onKindChange: (kind: PeriodKind) => void;
  onPrev: () => void;
  onNext: () => void;
};

const KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: 'week', label: 'Semanal' },
  { kind: 'month', label: 'Mensual' },
];

export function PeriodSelector({
  kind,
  label,
  canGoNext,
  isPartial,
  onKindChange,
  onPrev,
  onNext,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.kinds}>
        {KINDS.map((option) => {
          const selected = option.kind === kind;
          return (
            <Pressable
              key={option.kind}
              onPress={() => onKindChange(option.kind)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Reporte ${option.label.toLowerCase()}`}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.backgroundSelected
                    : theme.backgroundElement,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type="smallBold">{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.nav, { backgroundColor: theme.backgroundElement }]}>
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          accessibilityLabel="Periodo anterior"
          style={({ pressed }) => [styles.arrow, { opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText type="subtitle">‹</ThemedText>
        </Pressable>

        <ThemedText type="smallBold" style={styles.label} numberOfLines={1}>
          {isPartial ? `${label} · en curso` : label}
        </ThemedText>

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          accessibilityRole="button"
          accessibilityLabel="Periodo siguiente"
          accessibilityState={{ disabled: !canGoNext }}
          style={({ pressed }) => [
            styles.arrow,
            { opacity: !canGoNext ? 0.35 : pressed ? 0.7 : 1 },
          ]}>
          <ThemedText type="subtitle">›</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  kinds: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
  },
  arrow: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
  },
});
