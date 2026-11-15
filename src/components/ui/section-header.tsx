// Encabezado de sección con título, subtítulo opcional y acción opcional.

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  level?: 'section' | 'screen';
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
  title,
  subtitle,
  action,
  level = 'section',
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleBlock}>
        <ThemedText type={level === 'screen' ? 'subtitle' : 'smallBold'}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  action: {
    flexShrink: 0,
  },
});
