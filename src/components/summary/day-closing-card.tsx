// Tarjeta del cierre del día: texto calculado y botón para compartirlo.
// Solo presentación: recibe el cierre ya armado y no consulta la base.

import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { ClosingTone, DayClosing } from '@/lib/day-closing-types';
import { buildDayClosingText } from '@/lib/day-closing-text';

type Props = {
  closing: DayClosing;
};

export function DayClosingCard({ closing }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();

  const toneColor = (tone?: ClosingTone): string | undefined => {
    if (tone === 'danger') {
      return statusColors.error;
    }
    if (tone === 'warning') {
      return statusColors.warning;
    }
    if (tone === 'muted') {
      return theme.textSecondary;
    }
    return undefined;
  };

  const handleShare = async () => {
    try {
      await Share.share(
        { message: buildDayClosingText(closing), title: closing.headline },
        { dialogTitle: 'Compartir cierre del día' }
      );
    } catch {
      Alert.alert('No se pudo compartir', 'Intenta de nuevo en un momento.');
    }
  };

  const shareLabel = closing.profitPending ? 'Esperando ganancia' : 'Compartir cierre';

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.heading}>
        <ThemedText type="default" style={styles.headline}>
          {closing.headline}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {closing.hasActivity
            ? 'Resumen calculado con los datos del día'
            : 'Sin ventas este día'}
        </ThemedText>
      </View>

      {closing.sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {section.title}
          </ThemedText>
          {section.lines.map((line) => (
            <View key={line.key} style={styles.row}>
              <View style={styles.label}>
                <ThemedText type="small">{line.label}</ThemedText>
                {line.note ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {line.note}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText
                type="smallBold"
                style={[styles.value, { color: toneColor(line.tone) ?? theme.text }]}
                numberOfLines={2}>
                {line.value}
              </ThemedText>
            </View>
          ))}
        </View>
      ))}

      {closing.warnings.length > 0 ? (
        <View style={[styles.warnings, { backgroundColor: theme.backgroundSelected }]}>
          {closing.warnings.map((warning) => (
            <ThemedText key={warning} type="small" style={{ color: statusColors.warning }}>
              {warning}
            </ThemedText>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => void handleShare()}
        disabled={closing.profitPending}
        accessibilityRole="button"
        accessibilityLabel="Compartir el cierre del día"
        accessibilityState={{ disabled: closing.profitPending }}
        style={({ pressed }) => [
          styles.shareButton,
          {
            backgroundColor: theme.backgroundSelected,
            opacity: closing.profitPending ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}>
        <ThemedText type="smallBold">{shareLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.three,
  },
  heading: {
    gap: Spacing.half,
  },
  headline: {
    fontWeight: 700,
  },
  section: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  label: {
    flex: 1,
    gap: Spacing.half,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  warnings: {
    padding: Spacing.two,
    borderRadius: 8,
    gap: Spacing.one,
  },
  shareButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
  },
});
