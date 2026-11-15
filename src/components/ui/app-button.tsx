// Botón reutilizable con variantes, icono opcional y estados de carga.

import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type AppButtonProps = {
  label: string;
  icon?: ReactNode;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  label,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  accessibilityLabel,
  style,
  labelStyle,
}: AppButtonProps) {
  const theme = useTheme();
  const blocked = disabled || loading;

  const palettes = {
    primary: {
      backgroundColor: theme.primary,
      pressedBackgroundColor: theme.primaryPressed,
      borderColor: 'transparent',
      foregroundColor: theme.onPrimary,
    },
    secondary: {
      backgroundColor: theme.backgroundElement,
      pressedBackgroundColor: theme.backgroundSelected,
      borderColor: theme.border,
      foregroundColor: theme.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      pressedBackgroundColor: theme.primarySoft,
      borderColor: 'transparent',
      foregroundColor: theme.primary,
    },
    danger: {
      backgroundColor: theme.danger,
      pressedBackgroundColor: theme.danger,
      borderColor: 'transparent',
      foregroundColor: theme.onDanger,
    },
  };
  const palette = palettes[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? palette.pressedBackgroundColor : palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: blocked ? 0.5 : pressed && variant === 'danger' ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.foregroundColor} />
      ) : (
        icon
      )}
      <ThemedText
        type="smallBold"
        style={[{ color: palette.foregroundColor }, labelStyle]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: TouchTarget.min,
    minWidth: TouchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.three,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
});
