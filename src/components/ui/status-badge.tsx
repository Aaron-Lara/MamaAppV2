// Etiqueta de estado con texto visible y tonos semánticos del tema.

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

export type StatusBadgeProps = {
  label: string;
  tone?: StatusBadgeTone;
  style?: StyleProp<ViewStyle>;
};

export function StatusBadge({ label, tone = 'neutral', style }: StatusBadgeProps) {
  const theme = useTheme();
  const colors = {
    success: { backgroundColor: theme.successSoft, color: theme.success },
    warning: { backgroundColor: theme.warningSoft, color: theme.warning },
    danger: { backgroundColor: theme.dangerSoft, color: theme.danger },
    neutral: { backgroundColor: theme.backgroundSelected, color: theme.textSecondary },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: colors.backgroundColor }, style]}>
      <ThemedText type="smallBold" style={{ color: colors.color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
