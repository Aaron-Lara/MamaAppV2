// Campo de texto reutilizable del formulario de productos, con ayuda y error.

import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  maxLength?: number;
  placeholder?: string;
  onFocus?: () => void;
};

export function useErrorColor(): string {
  return useColorScheme() === 'dark' ? '#ff8a80' : '#c62828';
}

export function TextField({
  label,
  value,
  onChangeText,
  error,
  hint,
  keyboardType = 'default',
  maxLength,
  placeholder,
  onFocus
}: TextFieldProps) {
  const theme = useTheme();
  const errorColor = useErrorColor();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={label}
        onFocus={onFocus}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: error ? errorColor : 'transparent',
          },
        ]}
      />
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      {error ? (
        <ThemedText type="small" style={{ color: errorColor }}>
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
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
});
