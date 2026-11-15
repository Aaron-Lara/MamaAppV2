// Encabezado de pantalla: título centrado y acciones en una fila aparte.

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type ScreenHeaderProps = {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({ title, meta, actions, children, style }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
        {title}
      </ThemedText>

      {meta || actions ? (
        <View style={styles.row}>
          {meta ? <View style={styles.meta}>{meta}</View> : null}
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  meta: {
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    gap: Spacing.two,
  },
});
