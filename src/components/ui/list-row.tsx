// Fila reutilizable para listados: título, descripción, meta y accesorios.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppCard } from '@/components/ui/app-card';
import { Spacing, TouchTarget } from '@/constants/theme';

export type ListRowProps = {
  title: string;
  description?: string;
  meta?: string | ReactNode;
  value?: ReactNode;
  leading?: ReactNode;
  accessory?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  dimmed?: boolean;
  titleNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
};

export function ListRow({
  title,
  description,
  meta,
  value,
  leading,
  accessory,
  onPress,
  accessibilityLabel,
  dimmed = false,
  titleNumberOfLines,
  style,
  cardStyle,
}: ListRowProps) {
  const content = (
    <AppCard style={cardStyle}>
      <View style={styles.row}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}

        <View style={styles.body}>
          <View style={styles.topRow}>
            <ThemedText
              type="sectionTitle"
              numberOfLines={titleNumberOfLines}
              style={styles.title}>
              {title}
            </ThemedText>
            {value ? <View style={styles.value}>{value}</View> : null}
          </View>

          {description ? (
            <ThemedText type="small" themeColor="textSecondary">
              {description}
            </ThemedText>
          ) : null}

          {meta || accessory ? (
            <View style={styles.bottomRow}>
              {meta ? (
                typeof meta === 'string' ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.meta}>
                    {meta}
                  </ThemedText>
                ) : (
                  <View style={styles.meta}>{meta}</View>
                )
              ) : null}
              {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
            </View>
          ) : null}
        </View>
      </View>
    </AppCard>
  );

  if (!onPress) {
    return <View style={[dimmed && styles.dimmed, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.pressable,
        dimmed && styles.dimmed,
        pressed && styles.pressed,
        style,
      ]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: TouchTarget.min,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  leading: {
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  value: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  meta: {
    flex: 1,
  },
  accessory: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
  dimmed: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.7,
  },
});
