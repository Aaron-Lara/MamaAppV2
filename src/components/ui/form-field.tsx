// Campo de formulario reutilizable: etiqueta, contenido, ayuda y error.

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormFieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  style?: StyleProp<ViewStyle>;
};

export function FormField({ label, children, hint, error, style }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.field, style]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      {children}
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText
          type="small"
          accessibilityLiveRegion="polite"
          style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
});
