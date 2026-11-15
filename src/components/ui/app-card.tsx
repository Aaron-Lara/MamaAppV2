// Tarjeta base del rediseño: superficie, borde y radio, sin sombra.

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppCardProps = {
  children: ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({ children, padding = Spacing.three, style }: AppCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          padding,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.md,
  },
});
